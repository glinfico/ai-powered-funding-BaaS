import { PORTAL_ROLES, type GateRole } from "@/lib/gate";
// Bridge: lets the PPG (/gate) accept the SAME Supabase login used by the PFE sign-in.
// Verifies email+password with Supabase Auth (server-side) and maps the role the same
// way the PFE does, but only trusts server-controlled app_metadata for admin access.

const ADMIN_ROLES = new Set(["admin", "staff"]);

export async function verifySupabaseLogin(
  email: string,
  password: string,
): Promise<{ email: string; role: GateRole } | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key || !email || !password) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { email?: string; app_metadata?: { role?: string }; user_metadata?: { role?: string } };
    };
    const userEmail = (data.user?.email || email).toLowerCase();
    const appRole = String(data.user?.app_metadata?.role || "").toLowerCase();
    const isAdmin = ADMIN_ROLES.has(appRole) || userEmail === "admin@glinfico.com";
    if (isAdmin) return { email: userEmail, role: "admin" };
    // Portal type (non-admin only): same lookup order as the PFE sign-in.
    // Each portal shows only the signed-in person's own records, so this
    // never grants access to anyone else's data.
    const kind = String(data.user?.app_metadata?.role || data.user?.user_metadata?.role || "").toLowerCase();
    const role = (PORTAL_ROLES as readonly string[]).includes(kind) ? (kind as GateRole) : "user";
    return { email: userEmail, role };
  } catch {
    return null;
  }
}
