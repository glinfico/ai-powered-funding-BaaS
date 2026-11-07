import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, signSession, GATE_COOKIE } from "@/lib/gate";

export const dynamic = "force-dynamic";

// PPG login. POST { email, password } → httpOnly cookie
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "");
  const password = String(b.password || "");
  if (!checkCredentials(email, password)) {
    return NextResponse.json({ ok: false, error: "Invalid staff credentials." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, await signSession(), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 12 * 3600,
  });
  return res;
}

// GET → is the current session valid (and who)
export async function GET(req: NextRequest) {
  const { verifySession } = await import("@/lib/gate");
  return NextResponse.json({ signedIn: await verifySession(req.cookies.get(GATE_COOKIE)?.value) });
}

// DELETE → sign out
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
