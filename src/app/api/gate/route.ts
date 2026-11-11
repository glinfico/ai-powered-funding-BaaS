import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, integrationEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { signSession, verifySession, hashPassword, newSalt, GATE_COOKIE } from "@/lib/gate";
import { verifySupabaseLogin } from "@/lib/supabaseLogin";

export const dynamic = "force-dynamic";

const staffPass = () => process.env.STAFF_PASSWORD || "Gate-ChangeMe-2026"; // set STAFF_PASSWORD in prod env
async function ensureAdmin() {
  const email = (process.env.STAFF_EMAIL || "staff@glinfico.com").toLowerCase();
  const pass = staffPass();
  const rows = await db.select().from(staff).where(eq(staff.email, email));
  if (!rows.length && pass) {
    const salt = newSalt();
    await db.insert(staff).values({ email, name: "Admin", passHash: hashPassword(salt, pass), salt, role: "admin" });
  }
  return { email, hasPassword: !!pass };
}

// POST /api/gate { email, password } → PPG sign-in, role-routed.
//   admin → LAE grants admin access (logged), cookie role=admin, → /crm
//   user  → cookie role=user, → /ppg (their own private portal)
// POST /api/gate { action:"add_user", staffPassword, email, password, role, name } → create staff (admin bootstrap)
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  if (b.action === "add_user") {
    if (String(b.staffPassword || "") !== staffPass()) return NextResponse.json({ ok: false, error: "staffPassword mismatch" }, { status: 401 });
    const email = String(b.email || "").trim().toLowerCase();
    if (!email.includes("@") || !b.password) return NextResponse.json({ ok: false, error: "email+password required" }, { status: 400 });
    const salt = newSalt();
    const [row] = await db.insert(staff).values({ email, name: String(b.name || email), passHash: hashPassword(salt, String(b.password)), salt, role: String(b.role) === "admin" ? "admin" : "user" }).returning();
    return NextResponse.json({ ok: true, user: { id: row.id, email: row.email, role: row.role } });
  }

  await ensureAdmin();
  const email = String(b.email || "").trim().toLowerCase();
  const [local] = await db.select().from(staff).where(eq(staff.email, email));
  let u: { email: string; role: string } | null =
    local && local.passHash === hashPassword(local.salt, String(b.password || "")) ? local : null;
  // Same login as the PFE: fall back to Supabase Auth when the local staff check fails.
  if (!u) u = await verifySupabaseLogin(email, String(b.password || ""));
  if (!u) {
    return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
  }

  if (u.role === "admin") {
    // Admin access goes THROUGH the LAE: record the grant in the engine log.
    await db.insert(integrationEvents).values({ type: "LAE.admin_access_granted", provider: "Engines", status: "delivered", count: 1, payload: JSON.stringify({ email: u.email, note: "LAE grants admin portal access after PPG auth", at: new Date().toISOString() }) });
    const res = NextResponse.json({ ok: true, role: "admin", redirect: "/crm" });
    res.cookies.set(GATE_COOKIE, await signSession("admin", u.email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 12 * 3600 });
    return res;
  }
  const res = NextResponse.json({ ok: true, role: "user", redirect: "/ppg" });
  res.cookies.set(GATE_COOKIE, await signSession("user", u.email), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 12 * 3600 });
  return res;
}

export async function GET(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  return NextResponse.json({ signedIn: s.ok, role: s.role, email: s.email });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
