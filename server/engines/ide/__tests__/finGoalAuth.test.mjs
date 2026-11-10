import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFinGoalTokenProvider } from '../finGoalAuth.js';

test('uses saved client_id/client_secret to request a bearer token and caches it', async () => {
  const stored = { fingoal_key: 'test-client-id', fingoal_secret: 'test-client-secret' };
  let calls = 0;
  let requestBody;
  const provider = createFinGoalTokenProvider({
    getCredential: async key => stored[key],
    baseUrl: 'https://findmoney-dev.fingoal.com/',
    tenantId: 'tenant-test',
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, 'https://findmoney-dev.fingoal.com/v3/authentication');
      requestBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ access_token: 'test-jwt', expires_in: 86400 }) };
    },
  });
  assert.equal(await provider(), 'test-jwt');
  assert.equal(await provider(), 'test-jwt');
  assert.deepEqual(requestBody, { client_id: 'test-client-id', client_secret: 'test-client-secret', tenant_id: 'tenant-test' });
  assert.equal(calls, 1);
});

test('uses no credentials and no legacy token as unconfigured', async () => {
  const provider = createFinGoalTokenProvider({ getCredential: async () => null, fetchImpl: async () => { throw new Error('must not call'); } });
  assert.equal(await provider(), null);
});

test('supports an explicitly configured legacy bearer token', async () => {
  const provider = createFinGoalTokenProvider({ getCredential: async () => null, legacyBearerToken: 'ops-bearer' });
  assert.equal(await provider(), 'ops-bearer');
});
