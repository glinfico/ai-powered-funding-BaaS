// Field-level encryption for sensitive data at rest (consent evidence, signatures,
// SSN/DOB, bank tokens). AES-256-GCM with a random 96-bit IV per value.
// Key: DATA_ENCRYPTION_KEY = 32 random bytes, base64 (set in Netlify env only).
import crypto from "crypto";

const PREFIX = "v1.";

function key(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY || "";
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY missing or invalid (needs 32 bytes, base64). Sensitive data is not stored without it.");
  }
  return k;
}

export function vaultReady(): boolean {
  try { key(); return true; } catch { return false; }
}

/** Encrypts a string → "v1.<iv>.<tag>.<ciphertext>" (base64url parts). */
export function seal(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return PREFIX + [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

/** Decrypts a value produced by seal(). Throws if tampered with. */
export function open(sealed: string): string {
  if (!sealed.startsWith(PREFIX)) throw new Error("Not a sealed value");
  const [iv, tag, enc] = sealed.slice(PREFIX.length).split(".").map((p) => Buffer.from(p, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

export function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Unguessable one-time link token (256 bits). Only its hash is stored. */
export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
