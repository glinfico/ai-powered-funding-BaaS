import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewBankLeadsCsv } from '../parseBankLeadsCsv.js';

test('quoted commas and line breaks do not split prospects', () => {
  const preview = previewBankLeadsCsv('company_name,contact_name,email,phone\r\n"Acme, Inc.","Jane\nSmith",jane@example.com,555-0100\r\n');
  assert.equal(preview.valid, 1);
  assert.equal(preview.rows[0].companyName, 'Acme, Inc.');
  assert.equal(preview.rows[0].contactName, 'Jane\nSmith');
});

test('does not invent emails, counts invalid and duplicate rows', () => {
  const result = previewBankLeadsCsv('company,email\nReal Co,owner@example.com\nMissing,\nOther,owner@example.com\n');
  assert.equal(result.total, 3);
  assert.equal(result.valid, 1);
  assert.equal(result.invalidCount, 1);
  assert.equal(result.duplicateCount, 1);
  assert.equal(result.invalid[0].row, 3);
});

test('never forwards SSN or DOB CSV columns', () => {
  assert.throws(() => previewBankLeadsCsv('company,email,ssn\nReal,owner@example.com,111-22-3333'), /does not accept SSN/);
  assert.throws(() => previewBankLeadsCsv('contact_name,email,date_of_birth\nJane,jane@example.com,1990-01-01'), /does not accept SSN/);
});

test('10,000 distinct prospects remain 10,000, not a sampled subset', () => {
  const text = 'contact_name,email\n' + Array.from({ length: 10000 }, (_, n) => `Applicant ${n + 1},person${n + 1}@example.com`).join('\n');
  const result = previewBankLeadsCsv(text);
  assert.equal(result.total, 10000);
  assert.equal(result.valid, 10000);
  assert.equal(result.invalidCount, 0);
  assert.equal(Math.ceil(result.rows.length / 200), 50);
});
