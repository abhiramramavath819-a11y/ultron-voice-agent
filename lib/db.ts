import { neon } from "@neondatabase/serverless";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

/** The app is fully usable without a database; persistence just turns off. */
export const dbEnabled = Boolean(url);

const sql = dbEnabled ? neon(url) : null;

export type StoredTurn = {
  role: "user" | "assistant";
  content: string;
  language: string;
  latency_ms: number | null;
  created_at: string;
};

export async function recordTurn(params: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  language: string;
  attitude: string;
  latencyMs?: number | null;
}): Promise<void> {
  if (!sql) return;
  try {
    await sql`
      insert into sessions (id, language, attitude)
      values (${params.sessionId}, ${params.language}, ${params.attitude})
      on conflict (id) do update
        set language = excluded.language,
            attitude = excluded.attitude,
            last_seen_at = now()
    `;
    await sql`
      insert into messages (session_id, role, content, language, latency_ms)
      values (${params.sessionId}, ${params.role}, ${params.content}, ${params.language},
              ${params.latencyMs ?? null})
    `;
  } catch (err) {
    // Never let a logging failure break a live conversation.
    console.error("recordTurn failed:", err);
  }
}

export async function loadHistory(sessionId: string, limit = 50): Promise<StoredTurn[]> {
  if (!sql) return [];
  try {
    const rows = await sql`
      select role, content, language, latency_ms, created_at
      from messages
      where session_id = ${sessionId}
      order by created_at asc
      limit ${limit}
    `;
    return rows as StoredTurn[];
  } catch (err) {
    console.error("loadHistory failed:", err);
    return [];
  }
}

export async function analytics() {
  if (!sql) return { enabled: false as const };
  try {
    const [totals] = (await sql`
      select
        (select count(*) from sessions)::int as sessions,
        (select count(*) from messages)::int as messages,
        (select coalesce(round(avg(latency_ms)), 0) from messages
          where latency_ms is not null)::int as avg_latency_ms
    `) as any[];

    const byLanguage = (await sql`
      select language, count(*)::int as turns
      from messages
      group by language
      order by turns desc
      limit 10
    `) as any[];

    return { enabled: true as const, ...totals, byLanguage };
  } catch (err) {
    console.error("analytics failed:", err);
    return { enabled: false as const };
  }
}
