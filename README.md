# ULTRON — Voice & Conversational Intelligence

A multilingual voice agent that listens, reasons, and answers out loud, with three
switchable personas. Frontend, backend, and database deploy to Vercel as one app.

**Live:** https://ultron-voice-agent-abhi-47c3.vercel.app
**Health check:** `/api/health`

---

## What it does

| Capability | How it is met |
| --- | --- |
| Speech recognition | Web Speech API in the browser, 750 ms silence endpointing |
| Wake word | "Hey Ultron", "Hey Jarvis", "Hey Friday" — also switches persona |
| Natural language understanding | Gemini via `/api/chat`, streaming (GPT and Claude also supported) |
| Multilingual | 13 channels — recognition, reasoning and speech all follow the choice |
| Text to speech | ElevenLabs when a key is set, browser synthesizer otherwise |
| Context awareness | Postgres-backed transcripts, latency and language mix logged |

Replies are spoken sentence by sentence as they stream, so the agent starts talking
before the model has finished thinking.

### Three dispositions

**FRIDAY** (yellow), **JARVIS** (blue), **ULTRON** (red). Switching retints the whole
interface, changes the voice, and swaps to that persona's own transcript. Each keeps
its history until the tab closes.

All three explain things as though the listener is five years old — small words, real
examples — without softening anything into being untrue.

---

## Setup

```bash
npm install
cp .env.example .env.local     # add GEMINI_API_KEY
npm run dev
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Default provider. Free tier at aistudio.google.com |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.5-flash` |
| `OPENAI_API_KEY` | no | Needs `LLM_PROVIDER=openai` to take effect |
| `ANTHROPIC_API_KEY` | no | Needs `LLM_PROVIDER=anthropic` to take effect |
| `ELEVENLABS_API_KEY` | no | Without it, the browser voice is used |
| `DATABASE_URL` | no | Vercel Postgres sets this when you attach a store |

Environment variables are baked in at deploy time, so **redeploy after adding any**.

### Database

Storage → Create → Postgres, attach to the project, then:

```bash
vercel env pull .env.local
npm run migrate
```

Skipping the migration leaves `persistence: true` in health while the panel stays
empty — the DB layer swallows errors so logging can never break a live conversation.

---

## Architecture

```
Browser                       Vercel                    External
Web Speech API ──text──▶  /api/chat  ──────────────▶  Gemini / GPT / Claude
               ◀──stream──────┤
                              └───────────────────▶  Postgres
speechSynthesis ◀──audio── /api/tts ──────────────▶  ElevenLabs
Web Audio ──▶ reactor      /api/health, /api/session, /api/analytics
```

Recognition and synthesis run client-side, so no audio ever crosses the server — only
text. That is what keeps this viable on serverless: no WebSocket to hold open.

### Files worth reading

- `lib/persona.ts` — the three dispositions and their guardrails
- `lib/voices.ts` — per-persona pitch, rate and voice preference
- `lib/themes.ts` — palette tokens shared by CSS and the canvas
- `lib/llm.ts` — the only file that knows Gemini from OpenAI from Anthropic
- `components/Ultron.tsx` — state machine, wake word, endpointing, speech queue
- `components/Reactor.tsx` — the audio-reactive core

---

## Known limits

**Firefox has no Web Speech API.** Chrome, Edge and Safari listen; Firefox falls back
to typing and says so.

**Browser voices vary by OS.** Pitch and rate always apply, but voice character depends
on what is installed. Windows ships far fewer than macOS. An ElevenLabs key removes the
lottery.

**No barge-in.** The mic mutes while the agent speaks, otherwise it transcribes its own
voice and talks to itself. The cost is that you cannot interrupt mid-sentence.

**Arithmetic is computed, not guessed.** `lib/calc.ts` parses and evaluates any sum in
the message with a hand-written shunting-yard parser (no eval), then hands the model the
exact answer to explain. Prose falls through untouched.

**Media input** accepts images, PDFs and plain text up to 4 MB, passed to Gemini as
inline parts. Attachments apply to one turn only, so a long conversation does not
re-send them. Other providers ignore attachments.

**Free-tier providers overload in bursts.** The chat route retries 429 and 5xx up to
four times with backoff, which absorbs the usual Gemini 503 spike. Permanent errors
(bad key, wrong model) fail on the first attempt rather than retrying pointlessly.

---

## Actions

The agent can open things. It emits a marker on its own line, the client strips it
before anything is spoken, and runs it:

    [[youtube:hans zimmer interstellar]]   [[open:github.com]]
    [[search:vercel pricing]]              [[local:notepad]]

YouTube resolves to a search, never a watch link: a model cannot know a real video
id, and a guessed one is a dead page. URLs are validated, so `javascript:` and
`file:` are rejected.

Browsers block pop-ups outside a user gesture, and a voice command is never a
gesture. Every action therefore also renders as a button in the transcript, so a
blocked pop-up degrades to one click rather than silently failing.

`[[local:...]]` needs the companion in `local-companion/` running on your own
machine. See its README.

## Not deployed: the original local agent

`legacy-local-agent/` holds the original FastAPI backend. It uses `psutil` to kill
processes and `os.system` to launch Windows apps, which cannot work on Vercel — that
code would run in a throwaway Linux container, not on your machine. Run it locally if
you want process control back. Bind it to localhost; it has no authentication.
