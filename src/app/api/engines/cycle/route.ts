import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { POST as runEngine } from "../route";
import { runDirectorySync } from "@/lib/directorySync";

export const dynamic = "force-dynamic";

// Automatic engine cycle (called every 15 min by the Netlify scheduled function
// netlify/functions/engine-cycle.mts). Order: directory SYNC → IDE → LAE → ACE.
// Protected by CRON_SECRET (header x-cron-secret); refuses all other callers.
function authorized(req: NextRequest): boolean {
  const want = process.env.CRON_SECRET || "";
  const got = req.headers.get("x-cron-secret") || "";
  if (!want || want.length < 24 || got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const started = Date.now();
  const results: Record<string, unknown> = {};
  // 0) Pull lenders / funders / investors from the main Supabase project (master).
  try { results.SYNC = await runDirectorySync(10000); } catch (e: any) { results.SYNC = { ok: false, error: e?.message || "sync failed" }; }
  for (const engine of ["IDE", "LAE", "ACE"]) {
    try {
      const r = await runEngine(new NextRequest(new URL("/api/engines", req.url), {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ engine }),
      }));
      results[engine] = await r.json();
    } catch (e: any) {
      results[engine] = { ok: false, error: e?.message || "failed" };
    }
  }
  return NextResponse.json({ ok: true, ms: Date.now() - started, results });
}
