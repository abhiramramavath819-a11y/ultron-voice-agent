import { loadHistory, dbEnabled } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("id");
  if (!sessionId) return Response.json({ error: "Pass ?id=<sessionId>." }, { status: 400 });

  return Response.json({
    persistence: dbEnabled,
    history: await loadHistory(sessionId),
  });
}
