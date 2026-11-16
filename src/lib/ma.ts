// M&A (business acquisition) underwriting for the ACE. Metrics are always computed
// server-side from the raw deal inputs — never trusted from the browser.
//
// Standard acquisition-lending checks (SBA 7(a) / lower-middle-market practice):
//   • Earnings:        EBITDA (or SDE for small businesses) must be positive
//   • Purchase multiple = price / EBITDA       ≤ 5.0x ✓ · 5–7x review · > 7x decline
//   • Leverage        = senior debt / EBITDA   ≤ 4.0x ✓ · 4–5x review · > 5x decline
//   • DSCR            = EBITDA / annual debt service (10-yr amortization)
//                                              ≥ 1.25 ✓ · 1.00–1.25 review · < 1.00 decline
//   • Buyer equity    = (price − loan − seller note) / price   ≥ 10% ✓ · else review
//   • Operating history ≥ 2 years ✓ · else review
// Thresholds are deliberately conservative and live in one place (MA_LIMITS) so they can be
// tuned later (or replaced by each lender's own guidelines via the AI guideline step).

export const MA_LIMITS = {
  multipleOk: 5, multipleMax: 7,
  leverageOk: 4, leverageMax: 5,
  dscrOk: 1.25, dscrMin: 1.0,
  equityMinPct: 10,
  minYears: 2,
  assumedRatePct: 11, // used only to estimate debt service when no lender rate is known yet
  termMonths: 120,
};

export type MaInputs = {
  loanAmount: number; purchasePrice?: number; ebitda?: number; revenue?: number;
  sellerNote?: number; buyerEquity?: number; yearsInBusiness?: number;
};

export type MaMetrics = {
  purchasePrice?: number; ebitda?: number; revenue?: number; sellerNote?: number; buyerEquity?: number;
  yearsInBusiness?: number; multiple?: number; leverage?: number; dscr?: number; equityPct?: number;
  loanToPricePct?: number; annualDebtService?: number; ebitdaMarginPct?: number;
};

const pos = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : undefined);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Annual payment on a fully amortizing loan. */
export function annualDebtService(loan: number, ratePct = MA_LIMITS.assumedRatePct, months = MA_LIMITS.termMonths) {
  const r = ratePct / 100 / 12;
  if (loan <= 0) return 0;
  const monthly = r === 0 ? loan / months : (loan * r) / (1 - Math.pow(1 + r, -months));
  return monthly * 12;
}

export function computeMaMetrics(i: MaInputs): MaMetrics {
  const loan = pos(i.loanAmount) || 0;
  const price = pos(i.purchasePrice);
  const ebitda = typeof i.ebitda === "number" && Number.isFinite(i.ebitda) ? i.ebitda : undefined; // may be ≤ 0 (unprofitable)
  const seller = pos(i.sellerNote) || 0;
  const m: MaMetrics = { purchasePrice: price, ebitda, revenue: pos(i.revenue), sellerNote: seller || undefined, yearsInBusiness: pos(i.yearsInBusiness) };
  const ads = annualDebtService(loan);
  m.annualDebtService = Math.round(ads);
  if (price) {
    const equity = pos(i.buyerEquity) ?? Math.max(price - loan - seller, 0);
    m.buyerEquity = Math.round(equity);
    m.equityPct = r2((equity / price) * 100);
    m.loanToPricePct = r2((loan / price) * 100);
  }
  if (ebitda !== undefined && ebitda > 0) {
    if (price) m.multiple = r2(price / ebitda);
    m.leverage = r2(loan / ebitda);
    if (ads > 0) m.dscr = r2(ebitda / ads);
  }
  if (ebitda !== undefined && m.revenue) m.ebitdaMarginPct = r2((ebitda / m.revenue) * 100);
  return m;
}

export function underwriteMA(amount: number, m: MaMetrics) {
  const L = MA_LIMITS;
  const notes: string[] = [];
  if (!amount) return { status: "Needs info", notes: ["No loan amount"], advancePct: 0 };
  if (!m.purchasePrice || m.ebitda === undefined) {
    return { status: "Needs info", notes: ["Purchase price and EBITDA (or SDE) are required for an M&A deal"], advancePct: 0 };
  }
  let hard = 0, soft = 0;
  if (m.ebitda <= 0) { hard++; notes.push("EBITDA is not positive"); }
  if (m.multiple !== undefined) {
    if (m.multiple > L.multipleMax) { hard++; notes.push(`Multiple ${m.multiple.toFixed(2)}x > ${L.multipleMax}x`); }
    else if (m.multiple > L.multipleOk) { soft++; notes.push(`Multiple ${m.multiple.toFixed(2)}x above ${L.multipleOk}x`); }
    else notes.push(`Multiple ${m.multiple.toFixed(2)}x ✓`);
  }
  if (m.leverage !== undefined) {
    if (m.leverage > L.leverageMax) { hard++; notes.push(`Leverage ${m.leverage.toFixed(2)}x > ${L.leverageMax}x`); }
    else if (m.leverage > L.leverageOk) { soft++; notes.push(`Leverage ${m.leverage.toFixed(2)}x above ${L.leverageOk}x`); }
    else notes.push(`Leverage ${m.leverage.toFixed(2)}x ✓`);
  }
  if (m.dscr !== undefined) {
    if (m.dscr < L.dscrMin) { hard++; notes.push(`DSCR ${m.dscr.toFixed(2)} < ${L.dscrMin.toFixed(2)}`); }
    else if (m.dscr < L.dscrOk) { soft++; notes.push(`DSCR ${m.dscr.toFixed(2)} below ${L.dscrOk}`); }
    else notes.push(`DSCR ${m.dscr.toFixed(2)} ✓`);
  }
  if (m.equityPct !== undefined) {
    if (m.equityPct < L.equityMinPct) { soft++; notes.push(`Buyer equity ${m.equityPct.toFixed(1)}% < ${L.equityMinPct}%`); }
    else notes.push(`Buyer equity ${m.equityPct.toFixed(1)}% ✓`);
  }
  if (m.yearsInBusiness !== undefined && m.yearsInBusiness < L.minYears) { soft++; notes.push(`${m.yearsInBusiness} yr operating history`); }
  const status = hard ? "Declined" : soft >= 2 ? "Review" : "Approved";
  const advancePct = Math.min(Math.round(m.loanToPricePct ?? 0), 90);
  return { status, notes, advancePct };
}

export const MA_CONDITIONS = "Subject to quality-of-earnings review, executed purchase agreement, business valuation, lien & UCC searches · Buyer ID & authorization at closing";
