import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBankLeadRow } from '../routes/ccdBankLeads.js';

test('real contact or company required; never invent a source identity', () => {
  const lead = validateBankLeadRow({ email: 'person@example.com', companyName: '', contactName: 'Jane Smith' });
  assert.equal(lead.company_name, '');
  assert.equal(lead.contact_name, 'Jane Smith');
  assert.throws(() => validateBankLeadRow({ email: 'person@example.com', companyName: '', contactName: '' }), /company or contact/);
  assert.throws(() => validateBankLeadRow({ email: '', companyName: 'Acme' }), /valid email/);
});

test('server rejects extra credit and banking data even if client is bypassed', () => {
  assert.throws(() => validateBankLeadRow({ email: 'person@example.com', companyName: 'Acme', ssn: '111223333' }), /sensitive/);
  assert.throws(() => validateBankLeadRow({ email: 'person@example.com', contactName: 'Jane', consent: 'granted' }), /sensitive/);
});
