import path from 'node:path';

export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const isDocumentStaff = (user) => ['admin', 'staff'].includes(user?.app_metadata?.role);

export const DOCUMENT_TYPES = Object.freeze({
  bank_statement: 'Bank statements',
  tax_return: 'Tax returns',
  business_license: 'Business license',
  voided_check: 'Voided check',
  government_id: 'Government ID (manual upload only)',
  other: 'Other supporting document',
});

const SIGNATURES = [
  { mime: 'application/pdf', extension: 'pdf', match: (data) => data.subarray(0, 5).toString() === '%PDF-' },
  { mime: 'image/png', extension: 'png', match: (data) => data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { mime: 'image/jpeg', extension: 'jpg', match: (data) => data.length > 3 && data[0] === 255 && data[1] === 216 && data[2] === 255 },
];

export function validateLeadId(value) {
  const id = String(value ?? '').trim();
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('Invalid lead ID.');
  return id;
}

export function validateDocType(value) {
  const type = String(value ?? '').trim();
  if (!Object.hasOwn(DOCUMENT_TYPES, type)) throw new Error('Unsupported document type.');
  return type;
}

export function validateUpload(bytes, name, declaredType) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_DOCUMENT_BYTES) {
    throw new Error('Choose a nonempty file no larger than 8 MB.');
  }
  const signature = SIGNATURES.find((entry) => entry.match(bytes));
  if (!signature) throw new Error('Only genuine PDF, PNG and JPEG files are accepted.');
  if (declaredType && declaredType !== signature.mime) {
    throw new Error('The file content does not match its declared type.');
  }
  const cleanName = path.basename(String(name || 'document'))
    .replace(/[^a-zA-Z0-9_.() -]/g, '_').replace(/^\.+/, '').slice(0, 100);
  if (!cleanName) throw new Error('Invalid filename.');
  const ext = path.extname(cleanName).toLowerCase().slice(1);
  if (!([signature.extension, ...(signature.mime === 'image/jpeg' ? ['jpeg'] : [])].includes(ext))) {
    throw new Error('Filename extension does not match the file content.');
  }
  return { name: cleanName, mime: signature.mime };
}
