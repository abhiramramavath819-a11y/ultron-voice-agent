"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Reactor, { type ReactorStatus } from "./Reactor";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/languages";
import { ATTITUDES, type Attitude } from "@/lib/persona";
import { VOICES, pickVoice } from "@/lib/voices";
import { parseActions, urlFor, isLocalCommand, type Action } from "@/lib/actions";

/** Where the local companion listens. Localhost only, by design. */
const COMPANION = "http://127.0.0.1:8765";

/** Saying any of these both wakes the agent and selects who answers. */
const WAKE_WORDS: { phrases: RegExp; persona: Attitude }[] = [
  { phrases: /\b(hey|hi|ok|okay)[,\s]+ultron\b/i, persona: "ultron" },
  { phrases: /\b(hey|hi|ok|okay)[,\s]+(jarvis|jervis|travis)\b/i, persona: "jarvis" },
  { phrases: /\b(hey|hi|ok|okay)[,\s]+(friday|fry day)\b/i, persona: "friday" },
];

/** Strip the wake phrase so "hey ultron what is nine times eight" asks the real question. */
function afterWakeWord(text: string): { persona: Attitude | null; rest: string } {
  for (const w of WAKE_WORDS) {
    const m = w.phrases.exec(text);
    if (!m) continue;
    let rest = text.slice(m.index + m[0].length).trim();
    // Drop the punctuation that trails a summons: "Hey Ultron." and "Hey Friday, add milk".
    rest = rest.replace(/^[\s,.;:!?\u2014-]+/, "").trim();
    // Punctuation with no words is a summons, not a question.
    if (!/[\p{L}\p{N}]/u.test(rest)) rest = "";
    return { persona: w.persona, rest };
  }
  return { persona: null, rest: text };
}

/** Silence before we decide the user has finished speaking. */
const ENDPOINT_MS = 750;
/** Silence before an awake agent goes back to waiting for its name. */
const SLEEP_AFTER_MS = 45000;

type Turn = { role: "user" | "assistant"; content: string; action?: Action };
type Attachment = { mimeType: string; data: string; name: string };

/** What Gemini will accept inline. Anything else is rejected with a reason. */
const ACCEPTED = /^(image\/(png|jpeg|jpg|webp|heic|heif)|application\/pdf|text\/plain)$/;
/** Roughly 4 MB of raw file. Base64 inflates by a third, and requests have limits. */
const MAX_BYTES = 4 * 1024 * 1024;

type Stats = {
  enabled: boolean;
  sessions?: number;
  messages?: number;
  avg_latency_ms?: number;
  byLanguage?: { language: string; turns: number }[];
};

/** Pull complete sentences off a streaming buffer so speech can start before the reply finishes. */
function takeSentences(buffer: string): { ready: string[]; rest: string } {
  const ready: string[] = [];
  let rest = buffer;
  // Terminators cover Latin, CJK, Arabic (؟) and the Indic danda (। ॥) used by Hindi and Marathi.
  const boundary = /^[^.!?…。！？؟।॥\n]*[.!?…。！？؟।॥\n]+/;
  const hasWords = /[\p{L}\p{N}]/u;

  for (;;) {
    const match = boundary.exec(rest);
    if (!match || !match[0].length) break;
    const chunk = match[0];
    // Bare punctuation and whitespace are dropped rather than sent to the synthesizer.
    if (hasWords.test(chunk)) ready.push(chunk.trim());
    rest = rest.slice(chunk.length);
  }

  return { ready, rest };
}

export default function Ultron() {
  const [status, setStatus] = useState<ReactorStatus>("idle");
  // One transcript per persona. Switching disposition swaps the view; nothing is lost
  // until the tab closes.
  const [logs, setLogs] = useState<Record<Attitude, Turn[]>>({
    friday: [],
    jarvis: [],
    ultron: [],
  });
  const [awake, setAwake] = useState(false);
  // Wake word is opt-in. Left on by default it silently swallows everything the
  // user says without the magic phrase, which reads as a broken microphone.
  const [wakeRequired, setWakeRequired] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pcLinked, setPcLinked] = useState(false);
  const [pcToken, setPcToken] = useState("");
  const [interim, setInterim] = useState("");
  const [draft, setDraft] = useState("");
  const [armed, setArmed] = useState(false);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE.code);
  const [attitude, setAttitude] = useState<Attitude>("ultron");
  const [notice, setNotice] = useState<string | null>(null);
  const [sttSupported, setSttSupported] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<{ provider?: string; model?: string } | null>(null);
  const [clock, setClock] = useState("--:--:--");

  const awakeRef = useRef(false);
  const wakeRequiredRef = useRef(false);
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const levelRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const armedRef = useRef(false);
  const speakingRef = useRef(false);
  const endpointTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalBuffer = useRef("");
  const turnsRef = useRef<Turn[]>([]);
  const languageRef = useRef(language);
  const attitudeRef = useRef(attitude);
  const sessionRef = useRef("");
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pcTokenRef = useRef("");
  const attachmentsRef = useRef<Attachment[]>([]);
  const ttsQueue = useRef<string[]>([]);
  const ttsBusy = useRef(false);
  const micStream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);

  const turns = logs[attitude];

  useEffect(() => {
    turnsRef.current = logs[attitude];
  }, [logs, attitude]);

  useEffect(() => {
    awakeRef.current = awake;
  }, [awake]);

  useEffect(() => {
    wakeRequiredRef.current = wakeRequired;
  }, [wakeRequired]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  // Voice lists load asynchronously in most browsers, so grab them when they arrive.
  useEffect(() => {
    const load = () => {
      voicesRef.current = window.speechSynthesis?.getVoices() ?? [];
    };
    load();
    window.speechSynthesis?.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", load);
  }, []);
  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) recognitionRef.current.lang = language;
  }, [language]);
  useEffect(() => {
    attitudeRef.current = attitude;
    // Retint the whole document, not just this component, so the page
    // background and scrollbars follow the disposition too.
    document.documentElement.dataset.theme = attitude;
  }, [attitude]);

  // Stable session id so the transcript survives a refresh.
  useEffect(() => {
    let id = window.localStorage.getItem("ultron.session");
    if (!id) {
      id = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.localStorage.setItem("ultron.session", id);
    }
    sessionRef.current = id;

    fetch(`/api/session?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.history) && d.history.length) {
          const restored = d.history.map((h: any) => ({ role: h.role, content: h.content }));
          setLogs((prev) => ({ ...prev, ultron: restored }));
        }
      })
      .catch(() => {});
  }, []);

  const attachFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const accepted: Attachment[] = [];

    for (const file of Array.from(files).slice(0, 4)) {
      if (!ACCEPTED.test(file.type)) {
        setNotice(`${file.name} is a ${file.type || "unknown"} file. Images, PDFs and plain text only.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setNotice(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB. The limit is 4 MB.`);
        continue;
      }
      try {
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          // Drop the "data:...;base64," prefix; the API wants the payload only.
          reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        accepted.push({ mimeType: file.type, data, name: file.name });
      } catch {
        setNotice(`${file.name} could not be read.`);
      }
    }

    if (accepted.length) {
      setNotice(null);
      setAttachments((prev) => [...prev, ...accepted].slice(0, 4));
    }
  }, []);

  // The companion is optional. Probing it costs nothing and tells the user
  // plainly whether their machine is reachable.
  const probeCompanion = useCallback(async () => {
    try {
      const res = await fetch(`${COMPANION}/health`, { signal: AbortSignal.timeout(1500) });
      setPcLinked(res.ok);
    } catch {
      setPcLinked(false);
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("ultron.pcToken") ?? "";
    setPcToken(saved);
    pcTokenRef.current = saved;
    void probeCompanion();
  }, [probeCompanion]);

  /** Run one action. Returns a message if something needs saying. */
  const runAction = useCallback(async (action: Action): Promise<string | null> => {
    if (action.kind === "local") {
      if (!isLocalCommand(action.arg)) return `"${action.arg}" is not something the companion can run.`;
      if (!pcTokenRef.current) return "Paste the companion token under Computer link first.";
      try {
        const res = await fetch(`${COMPANION}/run`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-ultron-token": pcTokenRef.current },
          body: JSON.stringify({ command: action.arg }),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) return null;
        const detail = await res.json().catch(() => ({}));
        return detail?.detail ?? `The companion refused that (${res.status}).`;
      } catch {
        setPcLinked(false);
        return "Your computer is not linked. Start the local companion and try again.";
      }
    }

    const url = urlFor(action);
    if (!url) return "That address could not be opened.";

    // Browsers block window.open outside a user gesture, and a voice command is
    // never a gesture. Try anyway, and if blocked the action card stays clickable.
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) return "Your browser blocked the pop-up. Use the button in the transcript.";
    return null;
  }, []);

  const refreshStats = useCallback(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d?.reasoning ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshStats();
    const tick = setInterval(() => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false })), 1000);
    return () => clearInterval(tick);
  }, [refreshStats]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, interim]);

  useEffect(() => {
    const Impl =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!Impl) {
      setSttSupported(false);
      setNotice(
        "This browser has no speech recognition. Chrome, Edge, or Safari will listen; here you can still type."
      );
    }
  }, []);

  /* ---------------- Speech output ---------------- */

  const speakOne = useCallback(async (text: string) => {
    // Preferred path: the ElevenLabs voice behind /api/tts.
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, attitude: attitudeRef.current }),
      });

      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        const audio = audioRef.current!;
        audio.src = url;
        await audio.play();
        await new Promise<void>((resolve) => {
          const done = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          audio.onended = done;
          audio.onerror = done;
        });
        return;
      }
    } catch {
      // Fall through to the built-in synthesizer.
    }

    // Fallback: the browser's own voice. Always available, less characterful.
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    await new Promise<void>((resolve) => {
      const who = attitudeRef.current;
      const profile = VOICES[who] ?? VOICES.ultron;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageRef.current;
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;

      if (!voicesRef.current.length) {
        voicesRef.current = window.speechSynthesis.getVoices();
      }
      const voice = pickVoice(who, languageRef.current, voicesRef.current);
      if (voice) utterance.voice = voice;

      // Nothing to analyse from speechSynthesis, so drive the reactor with a synthetic pulse.
      let t = 0;
      const pulse = setInterval(() => {
        t += 0.35;
        levelRef.current = 0.34 + Math.abs(Math.sin(t)) * 0.4;
      }, 60);

      const finish = () => {
        clearInterval(pulse);
        levelRef.current = 0;
        resolve();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const startListening = useCallback(() => {
    try {
      recognitionRef.current?.start();
    } catch {
      /* already running */
    }
  }, []);

  const drainSpeech = useCallback(async () => {
    ttsBusy.current = true;
    speakingRef.current = true;
    setStatus("speaking");
    // Muting the mic while speaking is what stops the agent transcribing its own voice.
    stopListening();

    while (ttsQueue.current.length) {
      await speakOne(ttsQueue.current.shift()!);
    }

    ttsBusy.current = false;
    speakingRef.current = false;

    if (armedRef.current) {
      setStatus("listening");
      startListening();
    } else {
      setStatus("idle");
    }
  }, [speakOne, startListening, stopListening]);

  const enqueueSpeech = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      ttsQueue.current.push(text);
      if (!ttsBusy.current) void drainSpeech();
    },
    [drainSpeech]
  );

  /* ---------------- Reasoning ---------------- */

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      setInterim("");
      setNotice(null);
      const sent = attachmentsRef.current;
      const label = sent.length ? `${clean}\n[attached: ${sent.map((a) => a.name).join(", ")}]` : clean;
      const history = [...turnsRef.current, { role: "user" as const, content: label }];
      const who = attitudeRef.current;
      setLogs((prev) => ({ ...prev, [who]: history }));
      setStatus("thinking");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history,
            sessionId: sessionRef.current,
            attitude: attitudeRef.current,
            language: languageRef.current,
            attachments: attachmentsRef.current,
          }),
        });

        if (!res.ok || !res.body) {
          const payload = await res.json().catch(() => ({}));
          const detail = typeof payload.detail === "string" ? payload.detail.trim() : "";
          throw new Error(
            [payload.error || `Request failed with status ${res.status}.`, detail]
              .filter(Boolean)
              .join(" \u2014 ")
          );
        }

        // Attached once, then cleared: they belong to this turn, not the thread.
        setAttachments([]);
        attachmentsRef.current = [];

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let spoken = ""; // text already handed to the speech queue
        let visible = "";

        setLogs((prev) => ({ ...prev, [who]: [...history, { role: "assistant", content: "" }] }));

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          visible += decoder.decode(value, { stream: true });
          setLogs((prev) => ({ ...prev, [who]: [...history, { role: "assistant", content: visible }] }));

          // Speak each sentence the moment it completes rather than waiting for the full reply.
          const pending = visible.slice(spoken.length);
          const { ready, rest } = takeSentences(pending);
          if (ready.length) {
            ready.forEach(enqueueSpeech);
            spoken = visible.slice(0, visible.length - rest.length);
          }
        }

        // Strip the action marker before anything is spoken, then run it.
        const { spoken: cleaned, actions } = parseActions(visible);
        const tail = cleaned.slice(spoken.length).trim();
        if (tail) enqueueSpeech(tail);

        // The turn itself worked, so retire whatever error was last shown. Do this
        // before running the action, or an action failure gets wiped a line later.
        setNotice(null);

        if (actions.length) {
          const action = actions[0];
          setLogs((prev) => ({
            ...prev,
            [who]: [...history, { role: "assistant", content: cleaned, action }],
          }));
          const problem = await runAction(action);
          if (problem) setNotice(problem);
        } else if (cleaned !== visible) {
          setLogs((prev) => ({ ...prev, [who]: [...history, { role: "assistant", content: cleaned }] }));
        }
        if (!ttsBusy.current && !speakingRef.current) {
          setStatus(armedRef.current ? "listening" : "idle");
        }
        refreshStats();
      } catch (err: any) {
        setNotice(err?.message || "The reasoning core did not respond.");
        setStatus(armedRef.current ? "listening" : "idle");
      }
    },
    [enqueueSpeech, refreshStats, runAction]
  );

  /* ---------------- Speech input ---------------- */

  const buildRecognition = useCallback(() => {
    const Impl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Impl) return null;

    const recognition = new Impl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = languageRef.current;

    recognition.onresult = (event: any) => {
      if (speakingRef.current) return;

      let provisional = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalBuffer.current += result[0].transcript;
        else provisional += result[0].transcript;
      }
      setInterim(provisional);

      // While asleep, watch the live text for a wake phrase so we react mid-sentence
      // rather than waiting for the speaker to stop.
      if (!awakeRef.current) {
        const heard = (finalBuffer.current + " " + provisional).trim();
        const { persona } = afterWakeWord(heard);
        if (persona) {
          setAttitude(persona);
          attitudeRef.current = persona;
          setAwake(true);
          awakeRef.current = true;
          setNotice(null);
        }
      }

      // Endpointing: a short silence means the user has finished their turn.
      if (endpointTimer.current) clearTimeout(endpointTimer.current);
      endpointTimer.current = setTimeout(() => {
        const utterance = finalBuffer.current.trim();
        finalBuffer.current = "";
        setInterim("");
        if (!utterance) return;

        const { persona, rest } = afterWakeWord(utterance);
        if (persona) {
          setAttitude(persona);
          attitudeRef.current = persona;
          setAwake(true);
          awakeRef.current = true;
        }

        // Asleep and no wake word: ignore the room entirely.
        if (wakeRequiredRef.current && !awakeRef.current) return;

        // Bare "hey ultron" with nothing after it is a summons, not a question.
        const question = persona ? rest : utterance;
        if (!question) return;

        if (wakeRequiredRef.current) {
          if (sleepTimer.current) clearTimeout(sleepTimer.current);
          sleepTimer.current = setTimeout(() => {
            setAwake(false);
            awakeRef.current = false;
          }, SLEEP_AFTER_MS);
        }

        void send(question);
      }, ENDPOINT_MS);
    };

    recognition.onerror = (event: any) => {
      const code = event?.error ?? "unknown";

      // "no-speech" and "aborted" are routine: onend restarts us.
      if (code === "no-speech" || code === "aborted") return;

      const fatal = code === "not-allowed" || code === "service-not-allowed";
      const explain: Record<string, string> = {
        "not-allowed":
          "Microphone access was refused. Allow it in your browser's site settings, then arm again.",
        "service-not-allowed":
          "The browser blocked its speech service. This usually means the page is not on HTTPS.",
        "audio-capture":
          "No microphone could be captured. Another app or tab may be holding it. Close it and arm again.",
        network:
          "Speech recognition needs the network and the request failed. Check your connection.",
        "language-not-supported": `This browser cannot recognise ${languageRef.current}. Pick another channel.`,
        "bad-grammar": "The recogniser rejected its grammar. Reload the page.",
      };

      // Anything unmapped still surfaces, so a failure can never be invisible again.
      setNotice(explain[code] ?? `Speech recognition error: ${code}.`);

      if (fatal) {
        armedRef.current = false;
        setArmed(false);
        setStatus("idle");
      }
    };

    // Proof of life. Without this a silent recogniser is indistinguishable from a dead one.
    recognition.onaudiostart = () => setHearing(true);
    recognition.onaudioend = () => setHearing(false);

    recognition.onend = () => {
      // Chrome ends recognition every few seconds, so restart while we are still armed.
      if (armedRef.current && !speakingRef.current) {
        try {
          recognition.start();
        } catch {
          /* restart raced with a manual stop */
        }
      }
    };

    return recognition;
  }, [send]);

  const startMeter = useCallback(async () => {
    if (audioCtx.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    micStream.current = stream;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtx.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      if (!speakingRef.current) {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        // RMS, scaled so ordinary speech fills most of the bloom.
        levelRef.current = Math.min(1, Math.sqrt(sum / data.length) * 4.2);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const arm = useCallback(async () => {
    setNotice(null);

    // The level meter is decoration; recognition is the point. A meter failure
    // used to abort both, which looked exactly like a dead microphone.
    try {
      await startMeter();
    } catch {
      setNotice("The level meter could not open the microphone, but speech recognition will still try.");
    }

    if (!recognitionRef.current) recognitionRef.current = buildRecognition();
    armedRef.current = true;
    setArmed(true);
    setAwake(!wakeRequiredRef.current);
    awakeRef.current = !wakeRequiredRef.current;
    setStatus("listening");
    startListening();
  }, [buildRecognition, startListening, startMeter]);

  const disarm = useCallback(() => {
    armedRef.current = false;
    setArmed(false);
    setAwake(false);
    awakeRef.current = false;
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    if (endpointTimer.current) clearTimeout(endpointTimer.current);
    stopListening();
    window.speechSynthesis?.cancel();
    ttsQueue.current = [];
    levelRef.current = 0;
    setInterim("");
    setStatus("idle");
  }, [stopListening]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      micStream.current?.getTracks().forEach((t) => t.stop());
      audioCtx.current?.close().catch(() => {});
    },
    []
  );

  const submitDraft = () => {
    const text = draft.trim() || (attachmentsRef.current.length ? "What is in this?" : "");
    if (!text) return;
    setDraft("");
    // Typing is an explicit summons; no wake word needed.
    setAwake(true);
    awakeRef.current = true;
    void send(text);
  };

  const wipe = () => {
    setLogs((prev) => ({ ...prev, [attitudeRef.current]: [] }));
    turnsRef.current = [];
    window.localStorage.removeItem("ultron.session");
    sessionRef.current = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem("ultron.session", sessionRef.current);
  };

  const personaName = (ATTITUDES.find((a) => a.id === attitude)?.label ?? "ULTRON");

  const label: Record<ReactorStatus, string> = {
    idle: "Standby",
    listening: awake ? "Listening" : "Waiting for name",
    thinking: "Reasoning",
    speaking: "Transmitting",
  };

  return (
    <div className="deck">
      <audio ref={audioRef} hidden />

      <header className="masthead">
        <div className="rail">
          <span>Core v4.0</span>
          <span>
            Persistence <b>{stats?.enabled ? "Online" : "Local"}</b>
          </span>
          <span>
            Wake <b>{!armed ? "Off" : wakeRequired ? (awake ? "Open" : `Say "Hey ${personaName}"`) : "Always on"}</b>
          </span>
          <span>
            Mic <b>{armed ? (hearing ? "Receiving" : "Silent") : "Off"}</b>
          </span>
        </div>
        <h1 className="wordmark">{personaName}</h1>
        <div className="rail right">
          <span>
            <b>{LANGUAGES.find((l) => l.code === language)?.label}</b> channel
          </span>
          <span>
            Turns <b>{stats?.messages ?? turns.length}</b>
          </span>
          <span>{clock}</span>
        </div>
      </header>

      <div className="stage">
        {/* ---- Diagnostics ---- */}
        <aside className="panel left-panel">
          <div className="panel-head">Diagnostics</div>
          <div className="panel-body">
            <div className="readout">
              <span>Reasoning</span>
              <span>{health?.model ?? "\u2014"}</span>
            </div>
            <div className="readout">
              <span>Recognition</span>
              <span>{sttSupported ? "Web Speech" : "Offline"}</span>
            </div>
            <div className="readout">
              <span>Mean latency</span>
              <span>{stats?.avg_latency_ms ? `${stats.avg_latency_ms} ms` : "—"}</span>
            </div>
            <div className="meter">
              <i style={{ width: `${Math.min(100, ((stats?.avg_latency_ms ?? 0) / 4000) * 100)}%` }} />
            </div>
            <div className="readout">
              <span>Sessions</span>
              <span>{stats?.sessions ?? "—"}</span>
            </div>
            <div className="readout">
              <span>Logged turns</span>
              <span>{stats?.messages ?? "—"}</span>
            </div>

            <div className="section-rule">Channel mix</div>
            {stats?.byLanguage?.length ? (
              stats.byLanguage.map((row) => {
                const top = stats.byLanguage![0].turns || 1;
                return (
                  <div key={row.language}>
                    <div className="readout">
                      <span>{LANGUAGES.find((l) => l.code === row.language)?.label ?? row.language}</span>
                      <span>{row.turns}</span>
                    </div>
                    <div className="meter">
                      <i style={{ width: `${(row.turns / top) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="hint">
                No traffic recorded. Attach a Postgres database to log turns, latency, and language mix.
              </p>
            )}
          </div>
        </aside>

        {/* ---- Conversation ---- */}
        <section className="panel center-panel">
          <div className="panel-head">
            Directive channel — <span className="status">{label[status]}</span>
          </div>

          {notice && <div className="notice">{notice}</div>}

          <div className="panel-body transcript" ref={transcriptRef}>
            {turns.length === 0 && !interim && (
              <div className="turn agent">
                <div className="who">{personaName}</div>
                <div className="said">
                  Systems initialized. Arm the microphone and state your directive, or type it if speaking is
                  beyond you.
                </div>
              </div>
            )}

            {turns.map((turn, i) => (
              <div key={i} className={`turn ${turn.role === "assistant" ? "agent" : "human"}`}>
                <div className="who">{turn.role === "assistant" ? personaName : "OPERATOR"}</div>
                <div className="said">
                  {turn.content}
                  {turn.role === "assistant" && i === turns.length - 1 && status === "thinking" && (
                    <span className="caret" />
                  )}
                  {turn.action && (
                    <button className="action-card" onClick={() => void runAction(turn.action!)}>
                      {turn.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {interim && (
              <div className="turn human">
                <div className="who">OPERATOR</div>
                <div className="said provisional">{interim}</div>
              </div>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="attachments">
              {attachments.map((a, i) => (
                <button
                  key={`${a.name}-${i}`}
                  className="attachment"
                  onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                  title="Remove"
                >
                  {a.mimeType.startsWith("image/") ? "IMG" : a.mimeType === "application/pdf" ? "PDF" : "TXT"}
                  <span>{a.name}</span>
                  <i>&times;</i>
                </button>
              ))}
            </div>
          )}

          <div className="console">
            <input
              ref={fileRef}
              type="file"
              hidden
              multiple
              accept="image/png,image/jpeg,image/webp,image/heic,application/pdf,text/plain"
              onChange={(e) => {
                void attachFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              className="btn attach"
              onClick={() => fileRef.current?.click()}
              title="Attach an image, PDF or text file"
              aria-label="Attach a file"
            >
              Attach
            </button>
            <span className="chevron">&gt;</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitDraft()}
              placeholder="Type a directive…"
              aria-label="Type a directive"
            />
            <button
              className="btn"
              onClick={submitDraft}
              disabled={!draft.trim() && attachments.length === 0}
            >
              Execute
            </button>
          </div>
        </section>

        {/* ---- Core & controls ---- */}
        <aside className="panel right-panel">
          <div className="panel-head">System core</div>
          <div className="panel-body">
            <div className="reactor-cell">
              <Reactor levelRef={levelRef} status={status} theme={attitude} />
            </div>

            <div className="readout">
              <span className="status">
                <i className={`dot ${status === "idle" ? "cold" : ""}`} />
                {label[status]}
              </span>
            </div>

            <button className={`btn ${armed ? "live" : ""}`} onClick={armed ? disarm : arm} style={{ width: "100%", marginTop: 10 }}>
              {armed ? "Disarm microphone" : "Arm microphone"}
            </button>

            <div className="section-rule">Wake word</div>
            <div className="chiprow">
              <button className="chip" aria-pressed={!wakeRequired} onClick={() => setWakeRequired(false)}>
                Always listening
              </button>
              <button className="chip" aria-pressed={wakeRequired} onClick={() => setWakeRequired(true)}>
                Say the name
              </button>
            </div>

            <div className="section-rule">Channel</div>
            <div className="chiprow">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className="chip"
                  aria-pressed={language === l.code}
                  onClick={() => setLanguage(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="section-rule">Disposition</div>
            <div className="chipcol">
              {ATTITUDES.map((a) => (
                <button
                  key={a.id}
                  className="chip"
                  aria-pressed={attitude === a.id}
                  data-persona={a.id}
                  onClick={() => setAttitude(a.id)}
                  title={a.blurb}
                >
                  {a.label}
                  <small>
                    {a.blurb}
                    {logs[a.id].length > 0 && ` \u00b7 ${logs[a.id].length} logged`}
                  </small>
                </button>
              ))}
            </div>

            <div className="section-rule">Computer link</div>
            <div className="readout">
              <span>Companion</span>
              <span>{pcLinked ? "Linked" : "Not running"}</span>
            </div>
            <input
              className="token-input"
              value={pcToken}
              placeholder="Paste companion token"
              aria-label="Local companion token"
              onChange={(e) => {
                setPcToken(e.target.value);
                pcTokenRef.current = e.target.value.trim();
                window.localStorage.setItem("ultron.pcToken", e.target.value.trim());
              }}
            />
            <button className="btn" onClick={() => void probeCompanion()} style={{ width: "100%", marginTop: 6 }}>
              Re-check link
            </button>
            <p className="hint">
              Opening web pages works anywhere. Controlling this computer needs the companion in
              local-companion/ running on your own machine.
            </p>

            <div className="section-rule">Session</div>
            <button className="btn" onClick={wipe} style={{ width: "100%" }}>
              Purge transcript
            </button>
            <p className="hint">
              Speech is recognised in the selected channel and answered in the same language. Switch mid-sentence
              and the core follows.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
