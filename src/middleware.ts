import { NextRequest, NextResponse } from "next/server";
import { verifySession, GATE_COOKIE } from "@/lib/gate";

// Public (unauthenticated) paths: health, public consent e-form, Twilio webhook.
const PUBLIC_API = ["/api/health", "/api/consent/form", "/api/consent/webhook", "/api/gate"];
const PUBLIC_PAGES = ["/gate", "/consent"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");
  const isPage = path.startsWith("/crm") || path.startsWith("/lab");
  if (!isApi && !isPage) return NextResponse.next();
  if (isApi && PUBLIC_API.some(p => path === p || path.startsWith(p + "/"))) return NextResponse.next();
  if (!isApi && !isPage) return NextResponse.next();

  const ok = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (isApi) return NextResponse.json({ error: "Staff sign-in required (PPG).", gate: "/gate" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/gate";
  url.searchParams.set("next", path);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/crm/:path*", "/lab/:path*", "/api/:path*"],
};
