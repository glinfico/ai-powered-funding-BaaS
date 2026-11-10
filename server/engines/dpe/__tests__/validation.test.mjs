import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_DOCUMENT_BYTES, isDocumentStaff, validateDocType, validateLeadId, validateUpload } from '../validation.js';

const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n');
const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
const jpg = Buffer.from([255, 216, 255, 224, 0]);

describe('DPE private file validation', () => {
  it('accepts genuine PDF/PNG/JPEG with matching extension', () => {
    assert.equal(validateUpload(pdf, 'bank-statement.pdf', 'application/pdf').mime, 'application/pdf');
    assert.equal(validateUpload(png, 'license.png', 'image/png').mime, 'image/png');
    assert.equal(validateUpload(jpg, 'license.jpeg', 'image/jpeg').mime, 'image/jpeg');
  });
  it('rejects forged formats, mismatched extensions and oversized files', () => {
    assert.throws(() => validateUpload(Buffer.from('hello'), 'statement.pdf', 'application/pdf'), /genuine/);
    assert.throws(() => validateUpload(pdf, 'statement.png', 'application/pdf'), /extension/);
    assert.throws(() => validateUpload(pdf, 'statement.pdf', 'image/png'), /declared/);
    assert.throws(() => validateUpload(Buffer.alloc(MAX_DOCUMENT_BYTES + 1), 'big.pdf', ''), /8 MB/);
  });
  it('uses only server-controlled roles for private documents', () => {
    assert.equal(isDocumentStaff({ app_metadata: { role: 'admin' } }), true);
    assert.equal(isDocumentStaff({ app_metadata: { role: 'staff' } }), true);
    assert.equal(isDocumentStaff({ user_metadata: { role: 'admin' } }), false);
    assert.equal(isDocumentStaff({ app_metadata: { role: 'broker' }, user_metadata: { role: 'admin' } }), false);
  });
  it('sanitizes filenames and rejects invalid lead IDs or types', () => {
    assert.equal(validateUpload(pdf, '../../private statement.pdf', 'application/pdf').name, 'private statement.pdf');
    assert.equal(validateLeadId('123-abc'), '123-abc');
    assert.equal(validateDocType('government_id'), 'government_id');
    assert.throws(() => validateLeadId('../123'), /Invalid/);
    assert.throws(() => validateDocType('passport_scanner'), /Unsupported/);
  });
});
