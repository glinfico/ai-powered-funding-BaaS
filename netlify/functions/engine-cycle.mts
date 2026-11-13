// Netlify scheduled function: runs the GLINFICO engine cycle (IDE → LAE → ACE) every 15 minutes.
// Calls the protected endpoint /api/engines/cycle with CRON_SECRET.
export default async () => {
  const base = process.env.URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const secret = process.env.CRON_SECRET || "";
  if (!base || !secret) {
    console.log("engine-cycle: URL or CRON_SECRET missing — skipped");
    return new Response("skipped", { status: 200 });
  }
  const r = await fetch(`${base}/api/engines/cycle`, { method: "POST", headers: { "x-cron-secret": secret } });
  const text = await r.text();
  console.log(`engine-cycle: HTTP ${r.status} ${text.slice(0, 400)}`);
  return new Response("ok", { status: 200 });
};

export const config = { schedule: "*/15 * * * *" };
