// Server-only FinGoal Insights auth. AdminSettings stores client ID and secret
// in Supabase platform_credentials. An access JWT is cached in this process
// and refreshed before expiry; no credential/token is exposed to the browser.
export function createFinGoalTokenProvider({
  getCredential,
  fetchImpl = globalThis.fetch,
  baseUrl = 'https://findmoney-dev.fingoal.com',
  tenantId = '',
  timeoutMs = 25000,
  legacyBearerToken = '',
}) {
  let token = null;
  let expiresAt = 0;
  let pending = null;
  const base = String(baseUrl).replace(/\/$/, '');

  return async function getBearerToken() {
    const clientId = await getCredential('fingoal_key', 'FINGOAL_CLIENT_ID');
    const clientSecret = await getCredential('fingoal_secret', 'FINGOAL_CLIENT_SECRET');
    if (!clientId || !clientSecret) return legacyBearerToken || null;
    if (token && expiresAt > Date.now() + 60000) return token;
    if (pending) return pending;

    pending = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${base}/v3/authentication`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            ...(tenantId ? { tenant_id: tenantId } : {}),
          }),
        });
        if (!response.ok) {
          const err = new Error(`FinGoal authentication failed (${response.status}).`);
          err.status = response.status;
          throw err;
        }
        const body = await response.json();
        if (!body?.access_token) throw new Error('FinGoal authentication response contained no access_token.');
        token = body.access_token;
        expiresAt = Date.now() + Math.max(60, Number(body.expires_in) || 86400) * 1000;
        return token;
      } finally {
        clearTimeout(timer);
        pending = null;
      }
    })();
    return pending;
  };
}
