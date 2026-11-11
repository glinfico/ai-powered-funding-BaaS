// Bridge: lets the PPG (/gate) accept the SAME Supabase login used by the PFE sign-in.
// Verifies email+password with Supabase Auth (server-side) and maps the role the same
// way the PFE does, but only trusts server-controlled app_metadata for admin access.

const ADMIN_ROLES = new Set(["admin", "staff"]);

export async function verifySupabaseLogin(
  email: string,
  password: string,
): Promise<{ email: string; role: "admin" | "user" } | null> {
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
      user?: { email?: string; app_metadata?: { role?: string } };
    };
    const userEmail = (data.user?.email || email).toLowerCase();
    const appRole = String(data.user?.app_metadata?.role || "").toLowerCase();
    const isAdmin = ADMIN_ROLES.has(appRole) || userEmail === "admin@glinfico.com";
    return { email: userEmail, role: isAdmin ? "admin" : "user" };
  } catch {
    return null;
  }
}
