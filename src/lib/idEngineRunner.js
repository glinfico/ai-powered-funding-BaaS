/**
 * Active ID Engine (IDE) Execution Runner
 * Handles high-volume batch assignment and live real-time AAI indexing.
 */

import { generateAAI, parseAAI, transitionAAITier } from './aaiEngine';

// In-memory sequence state indexed by cohort (MMYY) and entity prefix
const sequenceCounters = new Map();

/**
 * Get or initialize counter for an entity prefix and cohort
 */
function getNextSequence(prefixCode, date = new Date()) {
  const monthNum = date.getMonth() + 1;
  const monthStr = String(monthNum).padStart(2, '0');
  const yearStr = String(date.getFullYear()).slice(-2);
  const key = `${prefixCode.toUpperCase()}_${monthStr}${yearStr}`;

  const current = sequenceCounters.get(key) || 0;
  const next = current + 1;
  sequenceCounters.set(key, next);
  return next;
}

/**
 * Batch assign AAIs to existing dataset array
 * @param {Array} records - List of leads, lenders, or investors
 * @param {string} prefixCode - Tier or role code ('SL', 'BL', 'L', 'I', 'S', 'P', etc.)
 * @param {Date} [cohortDate] - Date of cohort (defaults to current date)
 */
export function batchAssignAAI(records = [], prefixCode = 'SL', cohortDate = new Date()) {
  return records.map((record, index) => {
    if (record.aai) return record; // Skip if already indexed

    const sequenceIndex = getNextSequence(prefixCode, cohortDate);
    const assignedAAI = generateAAI(prefixCode, sequenceIndex, cohortDate);

    return {
      ...record,
      aai: assignedAAI,
      aaiMeta: parseAAI(assignedAAI),
      indexedAt: new Date().toISOString()
    };
  });
}

/**
 * Real-time IDE generator for single inbound signups or incoming leads
 */
export function generateLiveAAI(prefixCode = 'S', cohortDate = new Date()) {
  const sequenceIndex = getNextSequence(prefixCode, cohortDate);
  const aai = generateAAI(prefixCode, sequenceIndex, cohortDate);
  return {
    aai,
    meta: parseAAI(aai)
  };
}

/**
 * Batch Process Initial Counts (8,000+ Leads, 22,000+ Lenders, 3,000+ Investors)
 */
export function initializeActiveNetworkCounters() {
  const currentDate = new Date(); // November 2026 Cohort (1126)
  
  // Set base offsets for live active datasets
  const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
  const yearStr = String(currentDate.getFullYear()).slice(-2);
  const cohort = `${monthStr}${yearStr}`;

  sequenceCounters.set(`SL_${cohort}`, 8000);  // Single Leads
  sequenceCounters.set(`BL_${cohort}`, 1200);  // Bulk Lead Batches
  sequenceCounters.set(`L_${cohort}`, 22000);  // Institutional Lenders
  sequenceCounters.set(`I_${cohort}`, 3000);   // Syndicate Investors
  sequenceCounters.set(`P_${cohort}`, 1500);   // Pro Brokers

  return {
    status: 'ACTIVE',
    activeCohort: cohort,
    indexedMetrics: {
      leadsIndexed: 8000,
      lendersIndexed: 22000,
      investorsIndexed: 3000
    }
  };
}
