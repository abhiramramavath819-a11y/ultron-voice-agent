export type Provider = "anthropic" | "openai" | "gemini";
export type Turn = { role: "user" | "assistant"; content: string };

/** A file the user attached, already base64 encoded by the browser. */
export type Attachment = { mimeType: string; data: string; name?: string };

/** Gemini accepts images and PDFs inline; the others need different handling. */
const GEMINI_INLINE = /^(image\/(png|jpeg|jpg|webp|heic|heif)|application\/pdf|text\/plain)$/;

/**
 * Which provider to use. An explicit LLM_PROVIDER wins; otherwise we infer from
 * whichever key is present, so setting only OPENAI_API_KEY just works.
 */
export function activeProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "gemini" || explicit === "openai" || explicit === "anthropic") return explicit;
  // Gemini first: it is the intended provider, and this ordering stops a stale
  // key from another service silently hijacking the app.
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "gemini";
}

export function apiKeyFor(provider: Provider): string | undefined {
  if (provider === "gemini") return process.env.GEMINI_API_KEY;
  if (provider === "openai") return process.env.OPENAI_API_KEY;
  return process.env.ANTHROPIC_API_KEY;
}

export function modelFor(provider: Provider): string {
  if (provider === "gemini") return process.env.GEMINI_MODEL || "gemini-3.5-flash";
  if (provider === "openai") return process.env.OPENAI_MODEL || "gpt-5.6-terra";
  return process.env.CLAUDE_MODEL || "claude-opus-5";
}

export function missingKeyMessage(provider: Provider): string {
  const name =
    provider === "gemini"
      ? "GEMINI_API_KEY"
      : provider === "openai"
        ? "OPENAI_API_KEY"
        : "ANTHROPIC_API_KEY";
  return `${name} is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.`;
}

/**
 * The two APIs differ in four places: the URL, the auth header, where the system
 * prompt lives, and what the token-limit field is called. Everything else in the
 * app is provider-agnostic.
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
      // alt=sse is required, or Gemini streams a JSON array instead of server-sent events.
      url: `${base}?alt=sse`,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        // Gemini keeps the system prompt in its own field, and calls the
        // assistant role "model" rather than "assistant".
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m, i) => {
          const parts: any[] = [{ text: m.content }];
          // Attachments belong to the newest user turn only. Replaying them on
          // every request would multiply the token cost of a long conversation.
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
          // Flash reasons before answering by default, which costs a second or
          // more of silence. Voice needs the first word fast.
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
        // OpenAI carries the system prompt as the first message rather than a top-level field.
        messages: [{ role: "system", content: system }, ...messages],
        // Newer GPT models reject max_tokens and require max_completion_tokens.
        max_completion_tokens: 400,
        stream: true,
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
    // A chunk can carry several parts; join them so nothing is dropped.
    const parts = event?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;
    const text = parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("");
    return text.length ? text : null;
  }
  if (provider === "openai") {
    const piece = event?.choices?.[0]?.delta?.content;
    return typeof piece === "string" && piece.length ? piece : null;
  }
  if (event?.type === "content_block_delta" && event?.delta?.type === "text_delta") {
    return event.delta.text ?? null;
  }
  return null;
}
