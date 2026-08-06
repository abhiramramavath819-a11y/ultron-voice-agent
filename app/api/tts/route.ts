export const runtime = "nodejs";

// Distinct ElevenLabs voice per persona; env vars override any of them.
const PERSONA_VOICES: Record<string, string> = {
  friday: process.env.ELEVENLABS_VOICE_FRIDAY || "EXAVITQu4vr4xnSDxMaL",
  jarvis: process.env.ELEVENLABS_VOICE_JARVIS || "onwK4e9ZLuTAKqWW03F9",
  ultron: process.env.ELEVENLABS_VOICE_ULTRON || "pNInz6obpgDQGcFmaJgB",
};

const VOICE_SETTINGS: Record<string, Record<string, number | boolean>> = {
  // Bright and quick, with enough style to sound like she means it.
  friday: { stability: 0.4, similarity_boost: 0.75, style: 0.45, speed: 1.08, use_speaker_boost: true },
  // Composed rather than sluggish. High stability keeps the cadence even.
  jarvis: { stability: 0.6, similarity_boost: 0.8, style: 0.25, speed: 1.06, use_speaker_boost: true },
  // Low stability makes the delivery uneven and less human. Slower on purpose.
  ultron: { stability: 0.18, similarity_boost: 0.95, style: 0.65, speed: 0.94, use_speaker_boost: true },
};

/**
 * Returns spoken audio for one line of text.
 * With no ElevenLabs key this answers 501 and the browser falls back to its built-in
 * synthesizer. That fallback is the designed path, not a failure — the agent talks either way.
 */
export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Response.json({ fallback: "browser" }, { status: 501 });

  const { text, attitude } = await req.json().catch(() => ({ text: "", attitude: "ultron" }));
  if (!text || typeof text !== "string") {
    return Response.json({ error: "Expected { text: string }." }, { status: 400 });
  }

  const voiceId = PERSONA_VOICES[attitude] || PERSONA_VOICES.ultron;

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "xi-api-key": apiKey },
      body: JSON.stringify({
        text,
        // Flash v2.5 is the low-latency multilingual model — it covers all the HUD languages.
        model_id: "eleven_flash_v2_5",
        voice_settings:
          attitude === "ultron"
            ? { stability: 0.2, similarity_boost: 0.9, style: 0.6 }
            : { stability: 0.45, similarity_boost: 0.8, style: 0.3 },
      }),
    }
  );

  if (!upstream.ok || !upstream.body) {
    return Response.json({ fallback: "browser" }, { status: 501 });
  }

  return new Response(upstream.body, {
    headers: { "content-type": "audio/mpeg", "cache-control": "no-store" },
  });
}
