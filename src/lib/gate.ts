// PPG (Private Portal Gate) — staff-only session.
// Uses Web Crypto (crypto.subtle) so it runs in BOTH the Node route handlers
// and the Edge middleware. Credentials from STAFF_EMAIL / STAFF_PASSWORD env.

const secret = () => process.env.GATE_SECRET || process.env.CONSENT_SIGNING_SECRET || "dev-gate-secret-change-me";

async function hmacHex(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkCredentials(email: string, password: string): boolean {
  const wantEmail = (process.env.STAFF_EMAIL || "staff@glinfico.com").toLowerCase();
  const wantPass = process.env.STAFF_PASSWORD || "";
  if (!wantPass) return false; // gate stays locked until a password is set
  return safeEqual(String(email || "").trim().toLowerCase(), wantEmail) && safeEqual(String(password || ""), wantPass);
}

export async function signSession(): Promise<string> {
  const exp = Date.now() + 12 * 3600 * 1000; // 12h staff session
  const payload = `staff|${exp}`;
  return `${payload}.${await hmacHex(payload)}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const m = String(token).match(/^staff\|(\d+)\.([a-f0-9]+)$/);
  if (!m) return false;
  const ok = safeEqual(await hmacHex(`staff|${m[1]}`), m[2]);
  return ok && Number(m[1]) > Date.now();
}

export const GATE_COOKIE = "ppg_session";
