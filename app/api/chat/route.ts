import { buildSystemPrompt, type Attitude } from "@/lib/persona";
import { resolveLanguage } from "@/lib/languages";
import { recordTurn } from "@/lib/db";
import { precomputeArithmetic } from "@/lib/calc";
import {
  activeProvider,
  apiKeyFor,
  buildUpstreamRequest,
  extractDelta,
  missingKeyMessage,
  type Turn,
  type Attachment,
} from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const provider = activeProvider();
  const apiKey = apiKeyFor(provider);

  if (!apiKey) {
    return Response.json({ error: missingKeyMessage(provider) }, { status: 500 });
  }

  let messages: Turn[];
  let sessionId: string;
  let attitude: Attitude;
  let languageCode: string;
  let attachments: Attachment[] = [];

  try {
    const body = await req.json();
    messages = body.messages;
    sessionId = String(body.sessionId || "anonymous");
    attitude = (body.attitude || "ultron") as Attitude;
    languageCode = String(body.language || "en-IN");
    attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 4) : [];
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("no messages");
  } catch {
    return Response.json(
      { error: "Expected a JSON body shaped like { messages, sessionId, attitude, language }." },
      { status: 400 }
    );
  }

  const language = resolveLanguage(languageCode);
  const started = Date.now();

  const latest = messages[messages.length - 1];
  if (latest?.role === "user") {
    await recordTurn({
      sessionId,
      role: "user",
      content: latest.content,
      language: language.code,
      attitude,
    });
  }

  // Settle any arithmetic exactly before the model sees it. Language models
  // pattern-match digits rather than calculating, so this is a correctness fix,
  // not an optimisation.
  const computed = latest?.role === "user" ? precomputeArithmetic(latest.content) : null;

  const request = buildUpstreamRequest({
    provider,
    apiKey,
    attachments,
    system: [buildSystemPrompt(attitude, language.name), computed].filter(Boolean).join("\n\n"),
    // Six turns is enough context for a voice exchange and roughly halves the
    // input tokens billed on every single request.
    messages: messages.slice(-6),
  });

  // Free tiers overload in bursts. 503 and 429 are transient and clear in under a
  // second, so retry rather than surfacing "try again later" to someone mid-demo.
  // Safe to retry because nothing has been streamed to the client yet.
  const TRANSIENT = new Set([429, 500, 502, 503, 504]);
  const BACKOFF_MS = [400, 1200, 2500];

  let upstream: Response | null = null;
  let lastStatus = 0;
  let lastDetail = "";

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    try {
      const res = await fetch(request.url, {
        method: "POST",
        headers: request.headers,
        body: request.body,
      });

      if (res.ok && res.body) {
        upstream = res;
        break;
      }

      lastStatus = res.status;
      lastDetail = await res.text().catch(() => "");

      // Anything else — a bad key, a wrong model — will fail identically forever.
      if (!TRANSIENT.has(res.status)) break;
    } catch (err: any) {
      lastStatus = 0;
      lastDetail = String(err?.message ?? err);
    }

    if (attempt < BACKOFF_MS.length) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
    }
  }

  if (!upstream || !upstream.body) {
    const retried = TRANSIENT.has(lastStatus);
    return Response.json(
      {
        error: retried
          ? `The model was busy and did not recover after ${BACKOFF_MS.length + 1} attempts (${lastStatus}).`
          : `Model call failed (${lastStatus}).`,
        detail: lastDetail.slice(0, 400),
      },
      { status: 502 }
    );
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let carry = "";
  let full = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        await recordTurn({
          sessionId,
          role: "assistant",
          content: full,
          language: language.code,
          attitude,
          latencyMs: Date.now() - started,
        });
        controller.close();
        return;
      }

      // A network chunk can end mid-line, so hold the tail back for the next read.
      carry += decoder.decode(value, { stream: true });
      const lines = carry.split("\n");
      carry = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const text = extractDelta(provider, JSON.parse(payload));
          if (text) {
            full += text;
            controller.enqueue(encoder.encode(text));
          }
        } catch {
          // Keepalive or non-JSON line — ignore.
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
