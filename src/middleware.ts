import { NextRequest, NextResponse } from "next/server";
import { verifySession, GATE_COOKIE } from "@/lib/gate";

// Public: health, PPG login, public consent e-form, Twilio webhook.
const PUBLIC_API = ["/api/health", "/api/consent/form", "/api/consent/webhook", "/api/gate"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);

  if (path.startsWith("/api/")) {
    if (PUBLIC_API.some(p => path === p || path.startsWith(p + "/"))) return NextResponse.next();
    if (!s.ok) return NextResponse.json({ error: "Staff sign-in required (PPG).", gate: "/gate" }, { status: 401 });
    if (path.startsWith("/api/ppg")) return NextResponse.next(); // any signed-in user: own portal data
    if (s.role !== "admin") return NextResponse.json({ error: "Admin role required — request access via LAE." }, { status: 403 });
    return NextResponse.next();
  }

  if (path.startsWith("/crm") || path.startsWith("/lab")) {
    if (!s.ok) return redirect(req, "/gate", path);
    if (s.role !== "admin") return redirect(req, "/ppg", path); // users never see the CCD
    return NextResponse.next();
  }
  if (path.startsWith("/ppg")) {
    if (!s.ok) return redirect(req, "/gate", path);
    return NextResponse.next();
  }
  return NextResponse.next();
}

function redirect(req: NextRequest, to: string, next: string) {
  const url = req.nextUrl.clone();
  url.pathname = to;
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/crm/:path*", "/lab/:path*", "/ppg/:path*", "/api/:path*"],
};
