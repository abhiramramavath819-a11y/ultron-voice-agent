export type Provider = "anthropic" | "openai" | "gemini" | "groq";
export type Turn = { role: "user" | "assistant"; content: string };

/** A file the user attached, already base64 encoded by the browser. */
export type Attachment = { mimeType: string; data: string; name?: string };

/** Gemini accepts images and PDFs inline; the others need different handling. */
const GEMINI_INLINE = /^(image\/(png|jpeg|jpg|webp|heic|heif)|application\/pdf|text\/plain)$/;

/**
 * Which provider to use. An explicit LLM_PROVIDER wins; otherwise we infer from
 * whichever key is present.
 */
export function activeProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "gemini" || explicit === "openai" || explicit === "anthropic" || explicit === "groq") return explicit as Provider;
  // Check for Groq first (free tier)
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "groq"; // Default to Groq if none set
}

export function apiKeyFor(provider: Provider): string | undefined {
  if (provider === "gemini") return process.env.GEMINI_API_KEY;
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY;
  if (provider === "groq") return process.env.GROQ_API_KEY;
  return undefined;
}

export function modelFor(provider: Provider): string {
  if (provider === "gemini") return process.env.GEMINI_MODEL || "gemini-3.5-flash";
  if (provider === "openai") return process.env.OPENAI_MODEL || "gpt-5.6-terra";
  if (provider === "anthropic") return process.env.CLAUDE_MODEL || "claude-opus-5";
  return process.env.GROQ_MODEL || "groq/compound";
}

export function missingKeyMessage(provider: Provider): string {
  const name =
    provider === "gemini"
      ? "GEMINI_API_KEY"
      : provider === "openai"
        ? "OPENAI_API_KEY"
        : provider === "anthropic"
          ? "ANTHROPIC_API_KEY"
          : "GROQ_API_KEY";
  return `${name} is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.`;
}

/**
 * Build upstream request for different LLM providers
 */
export function buildUpstreamRequest(params: {
  provider: Provider;
  apiKey: string;
  system: string;
  messages: Turn[];
  attachments?: Attachment[];
}): { url: string; headers: Record<string, string>; body: string } {
  const { provider, apiKey, system, messages, attachments = [] } = params;
  const model = modelFor(provider);

  if (provider === "gemini") {
    const base =
      process.env.GEMINI_BASE_URL ||
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`;
    return {
      url: `${base}?alt=sse`,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m, i) => {
          const parts: any[] = [{ text: m.content }];
          if (i === messages.length - 1 && m.role === "user") {
            for (const a of attachments) {
              if (GEMINI_INLINE.test(a.mimeType)) {
                parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
              }
            }
          }
          return { role: m.role === "assistant" ? "model" : "user", parts };
        }),
        generationConfig: {
          maxOutputTokens: 400,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    };
  }

  if (provider === "openai") {
    return {
      url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_completion_tokens: 400,
        stream: true,
      }),
    };
  }

  if (provider === "groq") {
    return {
      url: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: 400,
        stream: true,
        temperature: 0.7,
      }),
    };
  }

  return {
    url: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1/messages",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system,
      messages,
      stream: true,
    }),
  };
}

/** Pull the text out of one parsed SSE event, or null if this event carries none. */
export function extractDelta(provider: Provider, event: any): string | null {
  if (provider === "gemini") {
    const parts = event?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;
    const text = parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("");
    return text.length ? text : null;
  }
  if (provider === "openai" || provider === "groq") {
    const piece = event?.choices?.[0]?.delta?.content;
    return typeof piece === "string" && piece.length ? piece : null;
  }
  if (event?.type === "content_block_delta" && event?.delta?.type === "text_delta") {
    return event.delta.text ?? null;
  }
  return null;
}
