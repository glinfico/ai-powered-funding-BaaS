/**
 * Advanced AAI (Account Assigned ID) Engine
 * Format: [TIER_PREFIX]-[MMYY]-[MONTH_LETTER][SEQUENCE]
 * Example: S-1026-O100001 (Silver Tier, Oct 2026, Oct Month Letter, Sequence 1 -> 100001)
 */

const MONTH_LETTERS = {
  1: 'J',  // January
  2: 'F',  // February
  3: 'M',  // March
  4: 'A',  // April
  5: 'W',  // May
  6: 'U',  // June
  7: 'L',  // July
  8: 'G',  // August
  9: 'S',  // September
  10: 'O', // October
  11: 'N', // November
  12: 'D'  // December
};

export const TIER_PREFIXES = {
  silver: 'S',      // Starter / Silver
  gold: 'G',        // Growth / Gold
  pro: 'P',         // Pro / Platinum
  emerald: 'E',     // Enterprise / Emerald
  lender: 'L',      // Lender Desk
  investor: 'I',    // LP Investor Syndicate
  singleLead: 'SL', // Single Borrower Lead
  bulkLead: 'BL'    // Bulk Lead Batch
};

export function generateAAI(prefixCode, sequenceIndex = 1, date = new Date()) {
  const monthNum = date.getMonth() + 1;
  const monthStr = String(monthNum).padStart(2, '0');
  const yearStr = String(date.getFullYear()).slice(-2);
  const cohort = `${monthStr}${yearStr}`;
  
  const monthLetter = MONTH_LETTERS[monthNum] || 'X';
  const baseSequence = 100000 + sequenceIndex;
  
  return `${prefixCode.toUpperCase()}-${cohort}-${monthLetter}${baseSequence}`;
}

export function parseAAI(aai) {
  if (!aai || typeof aai !== 'string') return null;
  const parts = aai.trim().toUpperCase().split('-');
  if (parts.length !== 3) return null;

  const seqPart = parts[2];
  const monthLetter = seqPart.charAt(0);
  const numericSequence = seqPart.slice(1);

  return {
    prefix: parts[0],
    cohort: parts[1],
    month: parts[1].slice(0, 2),
    year: parts[1].slice(2, 4),
    monthLetter: monthLetter,
    sequence: numericSequence,
    raw: aai.trim().toUpperCase()
  };
}

export function isValidAAI(aai) {
  const parsed = parseAAI(aai);
  if (!parsed) return false;
  return /^[A-Z]{1,2}$/.test(parsed.prefix) &&
         /^\d{4}$/.test(parsed.cohort) &&
         /^[A-Z]\d{6}$/.test(parsed.raw.split('-')[2]);
}

export function transitionAAITier(currentAai, newPrefixCode) {
  const parsed = parseAAI(currentAai);
  if (!parsed) return currentAai;

  const seqPart = parsed.raw.split('-')[2];
  return `${newPrefixCode.toUpperCase()}-${parsed.cohort}-${seqPart}`;
}
