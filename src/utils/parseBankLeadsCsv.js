// Private CCD CSV intake. Parsing is local for preview; only explicitly
// approved fields are sent to the authenticated Render API after confirmation.
const MAX_ROWS = 20000;
const MAX_TEXT = 8 * 1024 * 1024;
const normalizeHeader = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const columns = {
  email: 'email', emailaddress: 'email', primaryemail: 'email',
  company: 'companyName', companyname: 'companyName', business: 'companyName', businessname: 'companyName',
  contact: 'contactName', contactname: 'contactName', fullname: 'contactName', ownername: 'contactName', name: 'contactName',
  firstname: 'firstName', lastname: 'lastName', givenname: 'firstName', familyname: 'lastName',
  phone: 'phone', phonenumber: 'phone', mobile: 'phone', mobilenumber: 'phone',
  requestedamount: 'requestedAmount', loanamount: 'requestedAmount', amountrequested: 'requestedAmount',
};
const sensitiveColumn = /ssn|socialsecurity|dateofbirth|birthdate|^dob$|routingnumber|accountnumber|bankaccount|creditscore|creditreport|^fico$|accountbalance/i;
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseCsvRows(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT) throw new Error('Choose a nonempty CSV file no larger than 8 MB.');
  const source = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(field); field = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS + 1) throw new Error(`At most ${MAX_ROWS.toLocaleString()} data rows are accepted per file.`);
    } else field += ch;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export function previewBankLeadsCsv(text) {
  const all = parseCsvRows(text);
  if (all.length < 2) throw new Error('CSV needs a header and at least one data row.');
  const headers = all[0].map(normalizeHeader);
  if (headers.length > 80) throw new Error('CSV has too many columns.');
  const restricted = headers.filter((key) => sensitiveColumn.test(key));
  if (restricted.length) throw new Error('This secure intake does not accept SSN, DOB, credit scores or bank-account fields. Remove those columns and use the approved sensitive-data process.');
  const mapped = headers.map((key) => columns[key] || null);
  if (!mapped.includes('email')) throw new Error('An email column is required.');
  if (!mapped.includes('companyName') && !mapped.includes('contactName') && !mapped.includes('firstName')) throw new Error('Add a company, contact, or first-name column.');

  const rows = [], invalid = [], seen = new Set();
  let duplicates = 0;
  for (let i = 1; i < all.length; i++) {
    const fields = all[i];
    const record = {};
    mapped.forEach((name, column) => { if (name && !(name in record)) record[name] = String(fields[column] || '').trim(); });
    const companyName = record.companyName || '';
    const contactName = record.contactName || [record.firstName, record.lastName].filter(Boolean).join(' ');
    const email = String(record.email || '').trim().toLowerCase();
    if (!validEmail.test(email) || email.length > 254 || (!companyName && !contactName) || companyName.length > 160 || contactName.length > 160 || String(record.phone || '').length > 40 || String(record.requestedAmount || '').length > 40) {
      if (invalid.length < 25) invalid.push({ row: i + 1, reason: !validEmail.test(email) ? 'Missing/invalid email' : 'Missing name or field too long' });
      continue;
    }
    if (seen.has(email)) { duplicates++; continue; }
    seen.add(email);
    rows.push({ companyName, contactName, email, phone: record.phone || '', requestedAmount: record.requestedAmount || '' });
  }
  return {
    rows, total: all.length - 1, valid: rows.length, invalidCount: all.length - 1 - rows.length - duplicates,
    duplicateCount: duplicates, invalid,
    ignoredColumns: all[0].filter((_, index) => !mapped[index]),
  };
}
