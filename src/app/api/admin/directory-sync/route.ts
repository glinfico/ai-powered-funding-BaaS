import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { runDirectorySync, ensureSyncSchema } from "@/lib/directorySync";

export const dynamic = "force-dynamic";

// Admin only (middleware): GET = sync status, POST = run one sync pass now.
export async function GET() {
  await ensureSyncSchema();
  const st: any = await db.execute(sql`SELECT name, initial_done, last_run, last_note FROM sync_state ORDER BY name`).then((r: any) => r.rows || r);
  return NextResponse.json({ configured: !!process.env.MAIN_SUPABASE_SERVICE_KEY, state: st });
}

export async function POST() {
  try { return NextResponse.json(await runDirectorySync(15000)); }
  catch (e: any) { return NextResponse.json({ ok: false, error: e?.message || "sync failed" }, { status: 500 }); }
}
