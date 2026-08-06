import { analytics } from "@/lib/db";

export const runtime = "nodejs";

/** Powers the DIAGNOSTICS panel: turn counts, mean response latency, language mix. */
export async function GET() {
  return Response.json(await analytics(), {
    headers: { "cache-control": "no-store" },
  });
}
