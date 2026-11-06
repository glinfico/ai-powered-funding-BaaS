import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

/**
 * REI Deal Analyzer
 *
 * Two underwriting modes:
 *   Fix & Flip   — MAO (70% rule), net profit, ROI, annualised ROI
 *   Buy & Hold   — NOI, true cap rate, cash flow, cash-on-cash, DSCR
 *
 * Notes on the math (the previous version got two of these wrong):
 *   - Cap rate is NOI / purchase price, NOT gross rent / total investment.
 *     Gross rent ignores taxes, insurance, vacancy and management, which
 *     typically consume 35-45% of collected rent.
 *   - NOI is always calculated before debt service. Debt is applied after,
 *     which is what makes DSCR and cash-on-cash meaningful.
 *   - DSCR is the metric most REI lenders actually underwrite on. 1.25x is
 *     the common floor, so we surface it prominently.
 */

const fmtUsd = (n, dp = 0) =>
  isFinite(n)
    ? n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      })
    : "—";

const fmtPct = (n, dp = 1) => (isFinite(n) ? `${n.toFixed(dp)}%` : "—");

/** Standard amortised monthly payment. */
function monthlyPayment(principal, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (principal <= 0 || n <= 0) return 0;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * (r * f)) / (f - 1);
}

function NumField({ label, value, onChange, suffix = "$", step, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-slate-200">
        {label}
        {hint && <span className="text-[11px] font-normal text-slate-500">{hint}</span>}
      </span>
      <div className="relative">
        {suffix === "$" && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            $
          </span>
        )}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className={`w-full rounded-[10px] border border-slate-600 bg-slate-800 py-3 text-base font-semibold text-white outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/20 ${
            suffix === "$" ? "pl-7 pr-3" : "px-3"
          } ${suffix === "%" ? "pr-8" : ""}`}
        />
        {suffix === "%" && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            %
          </span>
        )}
      </div>
    </label>
  );
}

function Metric({ label, value, tone = "white", sub, big }) {
  const tones = {
    white: "text-white",
    green: "text-emerald-400",
    red: "text-rose-400",
    amber: "text-amber-400",
    blue: "text-sky-400",
  };
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-center">
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`font-extrabold ${big ? "text-2xl" : "text-xl"} ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export default function REIDealAnalyzer({ onNavigateToSubmit }) {
  const [mode, setMode] = useState("hold"); // 'flip' | 'hold'

  // Shared
  const [purchasePrice, setPurchasePrice] = useState(250000);
  const [rehabCost, setRehabCost] = useState(30000);
  const [arv, setArv] = useState(350000);
  const [closingPct, setClosingPct] = useState(3);

  // Financing
  const [downPct, setDownPct] = useState(20);
  const [ratePct, setRatePct] = useState(8.5);
  const [termYears, setTermYears] = useState(30);

  // Rental
  const [monthlyRent, setMonthlyRent] = useState(2500);
  const [vacancyPct, setVacancyPct] = useState(5);
  const [taxesYr, setTaxesYr] = useState(3600);
  const [insuranceYr, setInsuranceYr] = useState(1800);
  const [maintPct, setMaintPct] = useState(8);
  const [mgmtPct, setMgmtPct] = useState(8);

  // Flip
  const [holdMonths, setHoldMonths] = useState(6);
  const [sellingPct, setSellingPct] = useState(7);

  const n = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

  const m = useMemo(() => {
    const price = n(purchasePrice);
    const rehab = n(rehabCost);
    const afterRepair = n(arv);

    const closingCosts = price * (n(closingPct) / 100);
    const totalProjectCost = price + rehab + closingCosts;

    // 70% rule — the standard REI maximum allowable offer
    const mao = afterRepair * 0.7 - rehab;
    const maoDelta = mao - price;

    // Financing
    const downPayment = price * (n(downPct) / 100);
    const loanAmount = price - downPayment;
    const piMonthly = monthlyPayment(loanAmount, n(ratePct), n(termYears));
    const annualDebtService = piMonthly * 12;
    const ltv = price > 0 ? (loanAmount / price) * 100 : 0;
    const ltc = totalProjectCost > 0 ? (loanAmount / totalProjectCost) * 100 : 0;
    const cashInvested = downPayment + rehab + closingCosts;

    // ---- Rental ----
    const grossAnnualRent = n(monthlyRent) * 12;
    const vacancyLoss = grossAnnualRent * (n(vacancyPct) / 100);
    const effectiveGrossIncome = grossAnnualRent - vacancyLoss;
    const maintenance = effectiveGrossIncome * (n(maintPct) / 100);
    const management = effectiveGrossIncome * (n(mgmtPct) / 100);
    const operatingExpenses = n(taxesYr) + n(insuranceYr) + maintenance + management;
    const noi = effectiveGrossIncome - operatingExpenses;

    const capRate = price > 0 ? (noi / price) * 100 : 0;
    const annualCashFlow = noi - annualDebtService;
    const monthlyCashFlow = annualCashFlow / 12;
    const cashOnCash = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : Infinity;
    const onePctActual = price > 0 ? (n(monthlyRent) / price) * 100 : 0;
    const expenseRatio = effectiveGrossIncome > 0 ? (operatingExpenses / effectiveGrossIncome) * 100 : 0;
    const breakevenRent =
      (operatingExpenses + annualDebtService) / 12 / (1 - n(vacancyPct) / 100);

    // ---- Flip ----
    const holdingCosts =
      (piMonthly + (n(taxesYr) + n(insuranceYr)) / 12) * n(holdMonths);
    const sellingCosts = afterRepair * (n(sellingPct) / 100);
    const flipProfit = afterRepair - price - rehab - closingCosts - holdingCosts - sellingCosts;
    const flipRoi = cashInvested > 0 ? (flipProfit / cashInvested) * 100 : 0;
    const annualisedRoi = n(holdMonths) > 0 ? flipRoi * (12 / n(holdMonths)) : 0;

    return {
      closingCosts, totalProjectCost, mao, maoDelta,
      downPayment, loanAmount, piMonthly, annualDebtService, ltv, ltc, cashInvested,
      grossAnnualRent, effectiveGrossIncome, operatingExpenses, noi, capRate,
      annualCashFlow, monthlyCashFlow, cashOnCash, dscr, onePctActual, expenseRatio, breakevenRent,
      holdingCosts, sellingCosts, flipProfit, flipRoi, annualisedRoi,
    };
  }, [purchasePrice, rehabCost, arv, closingPct, downPct, ratePct, termYears,
      monthlyRent, vacancyPct, taxesYr, insuranceYr, maintPct, mgmtPct, holdMonths, sellingPct]);

  /** Lender-style verdict. Thresholds reflect common REI underwriting floors. */
  const verdict = useMemo(() => {
    const checks = [];
    if (mode === "hold") {
      checks.push({
        ok: m.dscr >= 1.25,
        warn: m.dscr >= 1.0 && m.dscr < 1.25,
        text: `DSCR ${isFinite(m.dscr) ? m.dscr.toFixed(2) : "∞"}x`,
        why: m.dscr >= 1.25 ? "meets the 1.25x lender floor" : m.dscr >= 1.0 ? "covers debt but below the 1.25x floor" : "does not cover debt service",
      });
      checks.push({
        ok: m.cashOnCash >= 8,
        warn: m.cashOnCash >= 4 && m.cashOnCash < 8,
        text: `Cash-on-cash ${fmtPct(m.cashOnCash)}`,
        why: m.cashOnCash >= 8 ? "strong cash return" : m.cashOnCash >= 4 ? "modest cash return" : "weak cash return",
      });
      checks.push({
        ok: m.capRate >= 6,
        warn: m.capRate >= 4.5 && m.capRate < 6,
        text: `Cap rate ${fmtPct(m.capRate)}`,
        why: m.capRate >= 6 ? "healthy for most markets" : "thin for most markets",
      });
      checks.push({
        ok: m.monthlyCashFlow > 0,
        text: `Monthly cash flow ${fmtUsd(m.monthlyCashFlow)}`,
        why: m.monthlyCashFlow > 0 ? "positive each month" : "negative — the property costs you money monthly",
      });
    } else {
      checks.push({
        ok: m.maoDelta >= 0,
        warn: m.maoDelta > -10000 && m.maoDelta < 0,
        text: `70% rule ${m.maoDelta >= 0 ? "passed" : "exceeded"}`,
        why: m.maoDelta >= 0
          ? `offer is ${fmtUsd(Math.abs(m.maoDelta))} under the max allowable offer`
          : `offer is ${fmtUsd(Math.abs(m.maoDelta))} over the max allowable offer`,
      });
      checks.push({
        ok: m.flipRoi >= 20,
        warn: m.flipRoi >= 10 && m.flipRoi < 20,
        text: `ROI ${fmtPct(m.flipRoi)}`,
        why: m.flipRoi >= 20 ? "strong return on cash in" : m.flipRoi >= 10 ? "acceptable but tight" : "below typical flip targets",
      });
      checks.push({
        ok: m.flipProfit >= 25000,
        warn: m.flipProfit > 0 && m.flipProfit < 25000,
        text: `Net profit ${fmtUsd(m.flipProfit)}`,
        why: m.flipProfit >= 25000 ? "comfortable margin for overruns" : m.flipProfit > 0 ? "little room for overruns" : "projected loss",
      });
    }

    const passed = checks.filter((c) => c.ok).length;
    const score = Math.round((passed / checks.length) * 100);
    const grade = score >= 80 ? "Strong" : score >= 50 ? "Workable" : "Challenging";
    const tone = score >= 80 ? "green" : score >= 50 ? "amber" : "red";
    return { checks, score, grade, tone };
  }, [m, mode]);

  const go = () => {
    if (onNavigateToSubmit) onNavigateToSubmit();
    else window.location.href = "/fod/submit";
  };

  const toneRing = {
    green: "border-emerald-500/40 bg-emerald-500/[0.07]",
    amber: "border-amber-500/40 bg-amber-500/[0.07]",
    red: "border-rose-500/40 bg-rose-500/[0.07]",
  }[verdict.tone];

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-amber-500/25 bg-gradient-to-br from-[#0b0f19] to-[#111827] p-6 shadow-2xl shadow-black/60 sm:p-9">
      {/* Header */}
      <div className="mb-7 text-center">
        <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-300">
          GLINFICO FOD • Free Investor Tool
        </span>
        <h2 className="mt-3.5 text-[28px] font-extrabold tracking-tight text-white sm:text-[32px]">
          REI Deal Analyzer
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-slate-400">
          Full underwriting in real time — cap rate, cash-on-cash and DSCR, the same
          metrics our lender network scores against.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="mx-auto mb-7 grid max-w-sm grid-cols-2 gap-1 rounded-xl border border-slate-700 bg-slate-900/70 p-1">
        {[
          ["hold", "Buy & Hold"],
          ["flip", "Fix & Flip"],
        ].map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={`rounded-lg py-2.5 text-sm font-bold transition ${
              mode === k ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NumField label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} />
        <NumField label="Rehab Budget" value={rehabCost} onChange={setRehabCost} />
        <NumField label="After Repair Value" value={arv} onChange={setArv} />
      </div>

      <details className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/40" open>
        <summary className="cursor-pointer px-5 py-3 text-[13px] font-bold uppercase tracking-wide text-amber-400">
          Financing
        </summary>
        <div className="grid gap-5 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          <NumField label="Down Payment" value={downPct} onChange={setDownPct} suffix="%" step="1" />
          <NumField label="Interest Rate" value={ratePct} onChange={setRatePct} suffix="%" step="0.125" />
          <NumField label="Term (years)" value={termYears} onChange={setTermYears} suffix="" step="1" />
          <NumField label="Closing Costs" value={closingPct} onChange={setClosingPct} suffix="%" step="0.5" hint="of price" />
        </div>
      </details>

      {mode === "hold" ? (
        <details className="mb-7 rounded-xl border border-slate-700/70 bg-slate-900/40" open>
          <summary className="cursor-pointer px-5 py-3 text-[13px] font-bold uppercase tracking-wide text-amber-400">
            Rental income &amp; operating expenses
          </summary>
          <div className="grid gap-5 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
            <NumField label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} />
            <NumField label="Property Taxes" value={taxesYr} onChange={setTaxesYr} hint="per year" />
            <NumField label="Insurance" value={insuranceYr} onChange={setInsuranceYr} hint="per year" />
            <NumField label="Vacancy" value={vacancyPct} onChange={setVacancyPct} suffix="%" step="1" />
            <NumField label="Maintenance" value={maintPct} onChange={setMaintPct} suffix="%" step="1" hint="of income" />
            <NumField label="Property Mgmt" value={mgmtPct} onChange={setMgmtPct} suffix="%" step="1" hint="of income" />
          </div>
        </details>
      ) : (
        <details className="mb-7 rounded-xl border border-slate-700/70 bg-slate-900/40" open>
          <summary className="cursor-pointer px-5 py-3 text-[13px] font-bold uppercase tracking-wide text-amber-400">
            Flip assumptions
          </summary>
          <div className="grid gap-5 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
            <NumField label="Hold Period" value={holdMonths} onChange={setHoldMonths} suffix="" step="1" hint="months" />
            <NumField label="Selling Costs" value={sellingPct} onChange={setSellingPct} suffix="%" step="0.5" hint="of ARV" />
            <NumField label="Property Taxes" value={taxesYr} onChange={setTaxesYr} hint="per year" />
            <NumField label="Insurance" value={insuranceYr} onChange={setInsuranceYr} hint="per year" />
          </div>
        </details>
      )}

      {/* Results */}
      <div className="mb-6 rounded-2xl border border-slate-700 border-l-4 border-l-amber-500 bg-[#131b2e] p-5 sm:p-6">
        <h3 className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-amber-400">
          {mode === "hold" ? "Rental underwriting" : "Flip underwriting"}
        </h3>

        {mode === "hold" ? (
          <>
            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="DSCR" value={isFinite(m.dscr) ? `${m.dscr.toFixed(2)}x` : "∞"} big
                tone={m.dscr >= 1.25 ? "green" : m.dscr >= 1 ? "amber" : "red"}
                sub="lender floor 1.25x" />
              <Metric label="Monthly Cash Flow" value={fmtUsd(m.monthlyCashFlow)} big
                tone={m.monthlyCashFlow > 0 ? "green" : "red"} sub="after debt service" />
              <Metric label="Cash-on-Cash" value={fmtPct(m.cashOnCash)} big
                tone={m.cashOnCash >= 8 ? "green" : m.cashOnCash >= 4 ? "amber" : "red"}
                sub={`on ${fmtUsd(m.cashInvested)} in`} />
              <Metric label="Cap Rate" value={fmtPct(m.capRate)} big tone="blue" sub="NOI ÷ price" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Net Operating Income" value={fmtUsd(m.noi)} sub="per year, before debt" />
              <Metric label="Operating Expenses" value={fmtUsd(m.operatingExpenses)} sub={`${fmtPct(m.expenseRatio, 0)} of income`} />
              <Metric label="Breakeven Rent" value={fmtUsd(m.breakevenRent)} sub="per month" />
              <Metric label="1% Rule" value={fmtPct(m.onePctActual, 2)} tone={m.onePctActual >= 1 ? "green" : "amber"} sub="rent ÷ price" />
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Net Profit" value={fmtUsd(m.flipProfit)} big
                tone={m.flipProfit > 0 ? "green" : "red"} sub="after all costs" />
              <Metric label="ROI" value={fmtPct(m.flipRoi)} big
                tone={m.flipRoi >= 20 ? "green" : m.flipRoi >= 10 ? "amber" : "red"} sub="on cash invested" />
              <Metric label="Annualised ROI" value={fmtPct(m.annualisedRoi)} big tone="blue" sub={`over ${n(holdMonths)} months`} />
              <Metric label="Max Allowable Offer" value={fmtUsd(m.mao)} big
                tone={m.maoDelta >= 0 ? "green" : "red"} sub="70% rule" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Total Project Cost" value={fmtUsd(m.totalProjectCost)} sub="purchase + rehab + closing" />
              <Metric label="Holding Costs" value={fmtUsd(m.holdingCosts)} sub={`${n(holdMonths)} months carry`} />
              <Metric label="Selling Costs" value={fmtUsd(m.sellingCosts)} sub={`${n(sellingPct)}% of ARV`} />
              <Metric label="Cash Required" value={fmtUsd(m.cashInvested)} sub="down + rehab + closing" />
            </div>
          </>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Metric label="Loan Amount" value={fmtUsd(m.loanAmount)} sub={`${fmtPct(m.ltv, 0)} LTV · ${fmtPct(m.ltc, 0)} LTC`} />
          <Metric label="Monthly P&I" value={fmtUsd(m.piMonthly)} sub={`${n(ratePct)}% over ${n(termYears)} yrs`} />
          <Metric label="Down Payment" value={fmtUsd(m.downPayment)} sub={`${n(downPct)}% of price`} />
        </div>
      </div>

      {/* Verdict */}
      <div className={`mb-7 rounded-2xl border p-5 ${toneRing}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Deal assessment</h3>
          <span className="text-sm font-extrabold text-white">
            {verdict.grade} · {verdict.score}/100
          </span>
        </div>
        <ul className="space-y-2">
          {verdict.checks.map((c, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className={c.ok ? "text-emerald-400" : c.warn ? "text-amber-400" : "text-rose-400"}>
                {c.ok ? "✓" : c.warn ? "!" : "✕"}
              </span>
              <span className="text-slate-200">
                <b className="font-semibold">{c.text}</b>
                <span className="text-slate-400"> — {c.why}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="mb-3.5 text-[15px] font-semibold text-slate-300">
          Ready to fund it? Get matched against our indexed capital partners.
        </p>
        <button
          onClick={go}
          className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-9 py-4 text-base font-extrabold text-black shadow-lg shadow-amber-500/30 transition hover:brightness-110 active:scale-[.99]"
        >
          Submit to 22,000+ Lenders
        </button>
        <p className="mt-2.5 text-xs text-slate-500">
          Instant submission · No credit impact to check rates
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-[11px] leading-relaxed text-slate-600">
          Estimates only, for illustration. Figures depend on the assumptions entered above and
          are not an offer of credit or a guarantee of terms.
        </p>
      </div>
    </div>
  );
}
