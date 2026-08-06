import { dbEnabled } from "@/lib/db";
import { activeProvider, apiKeyFor, modelFor } from "@/lib/llm";

export const runtime = "nodejs";

/**
 * A key that merely exists tells you nothing — a wrong key looks identical to a
 * right one until something calls it. Add ?verify=1 to spend one tiny request
 * proving the credential actually authenticates.
 */
async function verifyKey(provider: string, apiKey: string) {
  try {
    const res =
      provider === "gemini"
        ? await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
            headers: { "x-goog-api-key": apiKey },
          })
        : provider === "openai"
          ? await fetch("https://api.openai.com/v1/models", {
              headers: { authorization: `Bearer ${apiKey}` },
            })
          : await fetch("https://api.anthropic.com/v1/models", {
              headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
            });

    if (res.ok) return { valid: true as const, status: res.status };
    const body = await res.text().catch(() => "");
    return { valid: false as const, status: res.status, detail: body.slice(0, 300) };
  } catch (err: any) {
    return { valid: false as const, status: 0, detail: String(err?.message ?? err) };
  }
}

/** Subsystem readiness. Verify a fresh deploy before demoing it. */
export async function GET(req: Request) {
  const provider = activeProvider();
  const apiKey = apiKeyFor(provider);
  const wantsVerify = new URL(req.url).searchParams.get("verify") === "1";

  // Only present with ?verify=1. { valid: false, status: 401 } means the key is
  // wrong rather than missing — the single most confusing failure without this.
  const credential = wantsVerify && apiKey ? await verifyKey(provider, apiKey) : undefined;

  return Response.json(
    {
      ok: Boolean(apiKey),
      reasoning: {
        provider,
        configured: Boolean(apiKey),
        model: modelFor(provider),
      },
      credential,
      keysSeen: {
        gemini: Boolean(process.env.GEMINI_API_KEY),
        openai: Boolean(process.env.OPENAI_API_KEY),
        anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
        elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
      },
      // First three characters only, never the key itself. OpenAI uses "sk-",
      // ElevenLabs uses "sk_", and pasting one into the other is silent until a call fails.
      keyShape: {
        gemini: process.env.GEMINI_API_KEY?.slice(0, 4) ?? null,
        openai: process.env.OPENAI_API_KEY?.slice(0, 3) ?? null,
        elevenlabs: process.env.ELEVENLABS_API_KEY?.slice(0, 3) ?? null,
      },
      speech: {
        provider: process.env.ELEVENLABS_API_KEY ? "elevenlabs" : "browser-fallback",
      },
      persistence: { configured: dbEnabled },
      time: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
