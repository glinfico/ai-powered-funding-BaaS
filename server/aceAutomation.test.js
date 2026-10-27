import test from 'node:test';
import assert from 'node:assert/strict';
import { runLeadSmartRouting, runSmartFundingMatch } from './aceAutomation.js';

function mockSupabase({ requests = [], matches = [], rpcError = null } = {}) {
  const updates = [];
  const rpcCalls = [];
  const client = {
    updates,
    rpcCalls,
    from(table) {
      assert.equal(table, 'funding_requests');
      return {
        select() {
          return {
            eq(column, value) {
              assert.equal(column, 'lead_id');
              assert.equal(value, 'lead-123');
              return {
                order: async () => ({ data: requests, error: null }),
              };
            },
          };
        },
        update(patch) {
          return {
            eq: async (column, value) => {
              assert.equal(column, 'id');
              updates.push({ id: value, patch });
              return { error: null };
            },
          };
        },
      };
    },
    async rpc(name, args) {
      rpcCalls.push({ name, args });
      return { data: matches, error: rpcError };
    },
  };
  return client;
}

test('ACE skips safely when no existing funding request is linked', async () => {
  const supabase = mockSupabase();
  const result = await runLeadSmartRouting(supabase, 'lead-123');
  assert.equal(result.status, 'skipped');
  assert.equal(result.request_count, 0);
  assert.equal(supabase.rpcCalls.length, 0);
  assert.equal(supabase.updates.length, 0);
});

test('ACE syncs matching inputs and calls the existing Smart Router RPC', async () => {
  const supabase = mockSupabase({
    requests: [{ id: 'request-456', lead_id: 'lead-123', created_at: '2026-10-01T00:00:00Z' }],
    matches: [{ lender_id: 'lender-1' }, { lender_id: 'lender-2' }],
  });

  const result = await runLeadSmartRouting(supabase, 'lead-123', {
    loan_type: 'commercial_real_estate',
    loan_amount: '150000',
    estimated_revenue: '500000',
    years_in_business: '5',
    state: 'CA',
    industry: 'Trucking',
  });

  assert.equal(result.status, 'completed');
  assert.equal(result.request_count, 1);
  assert.equal(result.match_count, 2);
  assert.deepEqual(result.synchronized_fields.sort(), [
    'annual_revenue',
    'funding_category',
    'funding_product',
    'industry',
    'requested_amount',
    'state',
    'time_in_business_months',
  ]);
  assert.deepEqual(supabase.updates[0], {
    id: 'request-456',
    patch: {
      funding_product: 'commercial_real_estate',
      funding_category: 'REAL_ESTATE',
      requested_amount: 150000,
      annual_revenue: 500000,
      time_in_business_months: 60,
      state: 'CA',
      industry: 'Trucking',
    },
  });
  assert.deepEqual(supabase.rpcCalls, [{
    name: 'get_smart_funding_matches',
    args: { p_funding_request_id: 'request-456' },
  }]);
});

test('Smart Router errors are not swallowed', async () => {
  const supabase = mockSupabase({ rpcError: new Error('RPC unavailable') });
  await assert.rejects(
    runSmartFundingMatch(supabase, 'request-456'),
    /RPC unavailable/
  );
});
