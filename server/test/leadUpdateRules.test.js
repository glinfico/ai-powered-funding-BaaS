import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLeadUpdates,
  buildContactName
} from '../leadUpdateRules.js';

test('maps company to business_name', () => {
  assert.equal(
    buildLeadUpdates({ company: 'Example LLC' }).updates.business_name,
    'Example LLC'
  );
});

test('maps annual revenue to estimated_revenue', () => {
  assert.equal(
    buildLeadUpdates({ annual_revenue: 250000 }).updates.estimated_revenue,
    250000
  );
});

test('preserves explicit null values for supported fields', () => {
  assert.equal(
    buildLeadUpdates({ phone: null }).updates.phone,
    null
  );
});

test('rejects invalid assigned broker identifiers', () => {
  const result = buildLeadUpdates({ assigned_to: 'not-a-uuid' });
  assert.match(result.error, /valid broker UUID/);
});

test('allows clearing the broker assignment', () => {
  assert.equal(
    buildLeadUpdates({ assigned_to: '' }).updates.assigned_to,
    null
  );
  assert.equal(
    buildLeadUpdates({ assigned_to: null }).updates.assigned_to,
    null
  );
});

test('rejects empty or unsupported updates', () => {
  assert.match(buildLeadUpdates({}).error, /No supported lead fields/);
  assert.match(
    buildLeadUpdates({ unsupported_field: true }).error,
    /No supported lead fields/
  );
});

test('reconstructs contact names while preserving unchanged parts', () => {
  assert.equal(
    buildContactName({ first_name: 'Jane' }, 'John Smith Jones'),
    'Jane Smith Jones'
  );
  assert.equal(
    buildContactName({ last_name: 'Brown' }, 'Jane Smith'),
    'Jane Brown'
  );
});

test('trims explicit contact names', () => {
  assert.equal(
    buildContactName({ contact_name: '  Jane Brown  ' }),
    'Jane Brown'
  );
});
