// PPG (Private Portal Gate) — role-routed staff session.
// Web Crypto (crypto.subtle) so it runs in Node routes AND edge middleware.
// Cookie payload: staff|<role>|<expiry>.<hmac>  — role: admin | user
// Admin role is only ever issued after the LAE grants it (see /api/gate).

const secret = () => process.env.GATE_SECRET || process.env.CONSENT_SIGNING_SECRET || "dev-gate-secret-change-me";

async function hmacHex(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
export function hashPassword(salt: string, password: string): string {
  // sha256 via subtle is async; keep sync simple hash for storage (salted)
  let h = 5381;
  const s = salt + ":" + password;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
  return "h" + Math.abs(h).toString(16) + salt.length.toString(16);
}
export function newSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function signSession(role: "admin" | "user", email: string): Promise<string> {
  const exp = Date.now() + 12 * 3600 * 1000;
  const payload = `staff|${role}|${exp}|${email.toLowerCase()}`;
  return `${payload}.${await hmacHex(payload)}`;
}
export async function verifySession(token: string | undefined): Promise<{ ok: boolean; role: string; email: string }> {
  if (!token) return { ok: false, role: "", email: "" };
  let t = String(token);
  try { t = decodeURIComponent(t); } catch {}
  const m = t.match(/^staff\|(admin|user)\|(\d+)\|(.+)\.([a-f0-9]{64})$/);
  if (!m) return { ok: false, role: "", email: "" };
  const payload = `staff|${m[1]}|${m[2]}|${m[3]}`;
  const ok = safeEqual(await hmacHex(payload), m[4]) && Number(m[2]) > Date.now();
  return { ok, role: ok ? m[1] : "", email: ok ? m[3] : "" };
}

export const GATE_COOKIE = "ppg_session";
