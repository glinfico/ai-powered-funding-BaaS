// AAI ID & Tier standard.
// Code format: {PREFIX}-{YYMM cohort}-{base}, base starts at 100001.
//   Broker Pro/Platinum = P,  Broker Growth/Gold = G,
//   Lender Institutional = L, Investor LP Syndicate = I,
//   Single Lead = SL, Bulk Lead batch = BL
// Upgrade/downgrade: ONLY the leading prefix changes; cohort (1026) and
// baseline sequence (100042) are never touched. Revert restores the original
// ID instantly — history lives in id_ledger.

export const TIERS: Record<string, { prefix: string; label: string; entity: string }> = {
  P: { prefix: "P", label: "Pro / Platinum", entity: "Broker" },
  G: { prefix: "G", label: "Growth / Gold", entity: "Broker" },
  L: { prefix: "L", label: "Institutional Lender", entity: "Lender" },
  I: { prefix: "I", label: "LP Syndicate", entity: "Investor" },
  SL: { prefix: "SL", label: "Direct Borrower Lead", entity: "Single Lead" },
  BL: { prefix: "BL", label: "Syndicated Batch", entity: "Bulk Leads" },
};
export const BASE_START = 100001;
export const COHORT = "1026"; // Oct 2026 cohort

// Cohort is MMYY (e.g. 1026 = Oct 2026). First letter of the month: 10 -> O.
const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
export function monthLetter(cohort: string): string {
  const mm = Number((cohort || "").slice(0, 2));
  return MONTH_LETTERS[(mm - 1 + 12) % 12] || "X";
}

// Code format: {PREFIX}-{YYMM}-{MonthLetter}{BASE}  e.g. P-1026-O100001
export function makeCode(prefix: string, seq: number, cohort = COHORT): string {
  return `${prefix}-${cohort}-${monthLetter(cohort)}${seq}`;
}
export function parseCode(code: string): { prefix: string; cohort: string; month: string; seq: number } | null {
  const m = String(code || "").match(/^([A-Z]+)-(\d{4})-([A-Z])(\d+)$/);
  if (!m) return null;
  return { prefix: m[1], cohort: m[2], month: m[3], seq: Number(m[4]) };
}
// Migration helper: old format P-1026-100001 -> new P-1026-O100001.
// Also repairs a wrongly-lettered code (any letter -> correct month letter).
export function migrateCode(code: string): string {
  let m = String(code || "").match(/^([A-Z]+)-(\d{4})-(\d+)$/);
  if (m) return `${m[1]}-${m[2]}-${monthLetter(m[2])}${m[3]}`;
  m = String(code || "").match(/^([A-Z]+)-(\d{4})-([A-Z])(\d+)$/);
  if (m) return `${m[1]}-${m[2]}-${monthLetter(m[2])}${m[4]}`;
  return code;
}
export function reTier(code: string, newPrefix: string): string {
  const p = parseCode(code);
  if (!p) return code;
  return makeCode(newPrefix, p.seq, p.cohort); // cohort + sequence untouched
}
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function labelFor(code: string): string {
  const p = parseCode(code);
  if (!p) return code;
  const t = TIERS[p.prefix];
  const mm = Number(p.cohort.slice(0, 2));
  const cohortLabel = `${MONTH_NAMES[(mm - 1 + 12) % 12]} 20${p.cohort.slice(2, 4)} Cohort`;
  return t ? `${t.label} • ${cohortLabel} • Account #${p.seq - BASE_START + 1}` : code;
}
export function isValid(code: string): boolean { return parseCode(code) !== null && !!TIERS[parseCode(code)!.prefix]; }

// next sequence per entity type (max existing seq + 1, floor BASE_START)
export function nextSeq(existingSeqs: number[]): number {
  const max = existingSeqs.length ? Math.max(...existingSeqs) : BASE_START - 1;
  return Math.max(BASE_START, max + 1);
}
