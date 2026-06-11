import { useState } from "react";
import { format } from "date-fns";
import ArticleDetailModal from "@/components/magazine/ArticleDetailModal";

const CATEGORY_LABELS = {
  finance: "FINANCE",
  economy: "ECONOMY",
  insurance: "INSURANCE",
  retirement: "RETIREMENT",
  travel: "TRAVEL",
  "business consulting": "BUSINESS CONSULTING",
};

const NAV_ITEMS = ["FRONT PAGE", "FINANCE", "ECONOMY", "INSURANCE", "RETIREMENT", "TRAVEL", "BUSINESS CONSULTING"];

const TICKER_HEADLINES = [
  "FED HOLDS RATES — PCE AT 2.4% — THIRD STRAIGHT PAUSE EXPECTED IN Q3",
  "S&P 500 HITS RECORD 5,847 — AI EARNINGS BEAT CONSENSUS BY 12% AVERAGE",
  "IMF RAISES GLOBAL GROWTH FORECAST TO 3.2% FOR 2026",
  "TERM LIFE PREMIUMS HIT DECADE LOW — $500K COVERAGE FROM $28/MONTH",
  "COMMERCIAL REAL ESTATE DEBT WALL: $929 BILLION MATURES IN 2026",
  "TRANSATLANTIC BUSINESS CLASS FARES FALL 22% ON OVERCAPACITY",
];

// Original 12 seeded articles from blueprint (IDs 50–61)
const SEEDED_ARTICLES = [
  {
    id: 61, category: "finance",
    headline: "Corporate Treasury Departments Cut Hedging Costs by 31% as AI-Driven FX Risk Platforms Reshape the $7.5 Trillion Daily Currency Market",
    excerpt: "A new generation of AI-powered treasury tools is quietly dismantling the old guard of currency risk management, delivering measurable cost reductions for firms willing to move fast.",
    body: "Corporate treasury departments across the Fortune 500 are reporting a dramatic 31% reduction in foreign exchange hedging costs, driven by the rapid adoption of AI-powered risk management platforms that have fundamentally reshaped how firms navigate the $7.5 trillion daily currency market.\n\nLeading the charge are platforms like Kyriba, FiREapps, and a wave of fintech challengers that leverage machine learning to predict currency volatility windows with a precision that was unthinkable even three years ago. Goldman Sachs Treasury Services reported in Q1 2026 that clients using AI-assisted hedging strategies outperformed traditional benchmark approaches by an average of 240 basis points.\n\nThe shift is not merely technological — it represents a philosophical change in how CFOs view FX exposure. Rather than treating currency risk as a necessary cost of doing business, forward-thinking treasurers are now treating it as an alpha-generation opportunity.\n\nMid-market companies with $100M–$500M in annual international revenues are arguably the biggest beneficiaries. Previously priced out of sophisticated hedging strategies, they now access institutional-grade tools at a fraction of the historical cost.\n\nAnalysts at JPMorgan estimate that AI-driven treasury automation could unlock $180 billion in aggregate cost savings across global corporates by 2028, fundamentally altering the competitive dynamics of international trade finance.",
    author: "Priya Nair", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
    is_hero: false, is_editors_pick: true,
  },
  {
    id: 60, category: "economy",
    headline: "U.S. Core Inflation Cools to 2.6% but Wage-Price Spiral Keeps Fed on Edge Ahead of Q3 Decision",
    excerpt: "The Fed's preferred inflation gauge is moving in the right direction — but stubborn wage growth is complicating the path to a first rate cut.",
    body: "The Bureau of Economic Analysis confirmed this week that the U.S. Personal Consumption Expenditures price index — the Federal Reserve's preferred inflation measure — cooled to 2.6% year-over-year in May 2026, its lowest reading in 14 months and a meaningful step toward the Fed's 2% target.\n\nYet the celebration inside the Marriner Eccles Building is likely to be muted. Average hourly earnings continue to run at 3.8% annually, a spread wide enough to sustain services inflation well above target levels. Fed Governor Christopher Waller noted in a June 4th speech that 'the last mile of disinflation remains the hardest.'\n\nMarket participants are now pricing a 62% probability of a single 25-basis-point cut at the September FOMC meeting, down from 78% just four weeks ago. The CME FedWatch tool shows a full cut not fully priced until December.\n\nThe labor market's resilience — with jobless claims running at a near-historic low of 214,000 — continues to be a double-edged sword. Strong employment supports consumer spending and GDP growth (now tracking at 2.1% for Q2) but keeps upward pressure on services pricing.\n\nEconomists at BofA Securities argue the Fed may be forced into a 'higher for longer 2.0' scenario, maintaining the current 5.25%–5.50% fed funds rate through year-end and potentially delaying the easing cycle into early 2027.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80",
    is_hero: false, is_editors_pick: true,
  },
  {
    id: 59, category: "insurance",
    headline: "Climate Losses Force a $94 Billion Reckoning: How Insurers Are Repricing the Unthinkable",
    excerpt: "A cascade of unprecedented weather events has pushed insured catastrophe losses to $94B in the first half of 2026, forcing a fundamental rewrite of actuarial models.",
    body: "The global insurance industry is confronting a $94 billion insured catastrophe loss bill for the first half of 2026 alone — a figure that has shattered previous half-year records and forced every major underwriter to revisit decades-old actuarial assumptions.\n\nSwiss Re's sigma research unit released preliminary estimates showing that North American severe convective storms accounted for $41 billion of the total, with the remaining losses distributed across European flood events, Australian cyclones, and unprecedented wildfire activity in Chile and Portugal.\n\nMunich Re has responded by withdrawing capacity from coastal Florida entirely, the first time the reinsurance giant has taken such a drastic market exit in its 146-year history. Lloyd's of London syndicates are implementing minimum 35% rate increases on property catastrophe reinsurance renewals.\n\nFor policyholders, the repricing is severe. Homeowners in flood-prone zones across the Gulf Coast are seeing annual premiums increase by $4,000–$8,000 on average. Some ZIP codes in Miami-Dade County have become effectively uninsurable through private markets, pushing demand onto the state-backed Citizens Property Insurance Corporation, which is now carrying a $1.3 trillion exposure.\n\nThe broader implication for the financial system is significant. S&P Global Ratings warned in a June research note that 'climate-driven insurance retreats could depress property values in affected markets by 15–25% within five years, creating systemic risk for regional bank mortgage portfolios.'",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    is_hero: false, is_editors_pick: true,
  },
  {
    id: 58, category: "retirement",
    headline: "The $1.3 Trillion Retirement Gap: Why 62% of Americans Over 55 Are Dangerously Underfunded Heading Into 2027",
    excerpt: "A landmark Fidelity study reveals a retirement savings crisis of historic proportions — and the window to course-correct is closing faster than most Americans realize.",
    body: "A comprehensive retirement readiness study released by Fidelity Investments this month has quantified what financial planners have long feared: 62% of Americans aged 55 and older are on track to fall short of their retirement income needs, creating an aggregate funding gap estimated at $1.3 trillion.\n\nThe data is particularly alarming for the 58-to-64 age cohort — those within a decade of traditional retirement age. The median 401(k) balance for this group stands at $185,000, against a Fidelity-modeled retirement need of $720,000 for a couple retiring at 65 with a 20-year planning horizon.\n\nSeveral structural forces have converged to produce this crisis. The 2022 bond market selloff wiped an estimated $3.4 trillion from retirement account balances. Persistent inflation from 2021–2024 eroded real purchasing power of fixed Social Security payments. And a decade of historically low interest rates prior to 2022 forced savers into equity risk profiles inappropriate for their age.\n\nThe Social Security Administration projects the Old-Age and Survivors Insurance trust fund will be depleted by 2033, at which point benefits could be automatically cut by up to 23% absent congressional action — a scenario that would devastate the 40% of retirees who rely on Social Security for more than 90% of their income.\n\nFinancial advisors are increasingly recommending a 'barbell' strategy for late-career savers: maximize catch-up contributions (now $31,000 annually for those 50+), delay Social Security claiming to age 70 for a 32% benefit increase, and establish a two-year cash buffer to avoid sequence-of-returns risk in early retirement.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
  {
    id: 57, category: "travel",
    headline: "Business Travel Spending Hits $1.48 Trillion in 2026 as Corporate Fleets Pivot to Premium and AI-Driven Itineraries",
    excerpt: "Global business travel has not only fully recovered from pandemic lows — it has surged past all prior records, driven by a quality-over-quantity shift among road warriors.",
    body: "Global business travel expenditure reached $1.48 trillion in 2026 according to the Global Business Travel Association's mid-year report, surpassing the previous all-time record of $1.43 trillion set in 2019 and marking a decisive end to the 'travel is dead' narrative that dominated corporate planning during the pandemic years.\n\nThe composition of that spending has shifted dramatically. Average business class booking rates have increased 34% year-over-year as corporations recognize that talent retention increasingly depends on travel quality. Delta Air Lines reports that its premium cabin load factor from corporate accounts now exceeds 87%, an unprecedented level that has driven a 14% increase in average corporate contract rates.\n\nAI-driven travel management platforms are reshaping the booking landscape. Tools from TripActions (now Navan), Concur, and newer entrants like Spotnana are using predictive algorithms to optimize itineraries in real time, reducing average trip costs by 18% while simultaneously upgrading traveler experience metrics.\n\nHotel chains are responding to the premium pivot with aggressive corporate rate restructuring. Marriott Bonvoy's corporate segment grew revenue 28% in Q1 2026, while Hilton's business travel division posted its highest-ever operating margin of 31%.\n\nThe sustainability imperative is also reshaping corporate travel policies. Over 340 Fortune 500 companies have now implemented carbon-budgeting tools that assign a CO2 cost to each trip, creating a new optimization variable that travel managers must balance against traditional cost and efficiency metrics.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
  {
    id: 56, category: "business consulting",
    headline: "The $4.7 Trillion Efficiency Gap: Why 68% of Fortune 500 Firms Are Overhauling Their Financial Operations in 2026",
    excerpt: "A seismic shift in enterprise financial consulting is forcing C-suites to confront a staggering inefficiency crisis — and the firms that act now are pulling decisively ahead.",
    body: "A landmark McKinsey Global Institute analysis published this month has put a precise dollar figure on what CFOs have long suspected: inefficient financial operations cost global enterprises $4.7 trillion in unrealized value annually, with Fortune 500 companies accounting for nearly $1.2 trillion of that total.\n\nThe report, based on operational benchmarking across 2,400 enterprises in 38 countries, identifies five core drivers of financial inefficiency: fragmented ERP systems, manual reconciliation processes, siloed treasury and FP&A functions, underinvestment in finance automation, and talent misallocation.\n\nIn response, 68% of Fortune 500 CFOs surveyed by Deloitte in Q2 2026 indicated they are either currently executing or planning a major financial operations transformation within the next 18 months — the highest rate of planned transformation since the post-financial-crisis ERP wave of 2010–2012.\n\nThe consulting firms advising these transformations are themselves being transformed. McKinsey, BCG, and Accenture have all restructured their finance transformation practices around AI-first delivery models, deploying large language models to accelerate diagnostic work that previously took 12-week engagements into 3-week rapid assessments.\n\nMid-market companies — those with $500M to $5B in revenue — represent the largest untapped opportunity. Studies show these firms operate with finance function costs averaging 1.8% of revenue, compared to 0.6% for best-in-class peers, a gap that translates to $18 million in annual excess cost for a $1.5 billion company.\n\nGLINFICO's Financial Operations Division has positioned itself at the intersection of this transformation, offering AI-powered deal structuring, lender matching, and financial workflow automation purpose-built for the mid-market segment.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=800&q=80",
    is_hero: true, is_editors_pick: false,
  },
  {
    id: 55, category: "business consulting",
    headline: "The $2.3 Trillion Efficiency Gap: Why Fortune 500 Firms Are Overhauling Financial Operations in 2026",
    excerpt: "A landmark McKinsey analysis reveals that inefficient financial operations cost global enterprises $2.3 trillion annually — and the consultancies closing that gap are rewriting the rules of corporate finance.",
    body: "Consulting firms are experiencing a renaissance driven by a single, urgent corporate imperative: fix the finance function. McKinsey's latest Global Institute report quantifies the scale of the opportunity at $2.3 trillion in annual value leakage across global enterprises, creating one of the largest addressable markets in the history of management consulting.\n\nThe study reveals that the average large enterprise operates with 47% more finance headcount than best-in-class peers while simultaneously delivering lower-quality financial insights. The paradox of more resources producing worse outcomes stems from decades of accumulated process complexity, legacy system debt, and organizational siloing.\n\nThe Big Four accounting firms — Deloitte, PwC, EY, and KPMG — are competing aggressively with the traditional strategy consultancies for a share of this transformation market, deploying proprietary AI platforms that promise faster time-to-value on finance function redesign engagements.\n\nNotably, the consulting market itself is under AI disruption pressure. Gartner estimates that AI automation will eliminate 34% of traditional consulting billable hours by 2028, forcing firms to reprice their value propositions away from time-and-materials models toward outcome-based fee structures.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
  {
    id: 54, category: "insurance",
    headline: "Climate Catastrophe Tab Hits $38B: How Reinsurers Are Redrawing the Global Risk Map in 2026",
    excerpt: "The first quarter of 2026 alone generated $38 billion in insured catastrophe losses, accelerating a fundamental reinsurance market restructuring that will reshape insurance access for millions.",
    body: "Reinsurers are drawing new boundaries on the global risk map after Q1 2026 generated $38 billion in insured catastrophe losses — already 74% of the full-year 2023 total — forcing the industry to acknowledge that historical loss models have become structurally unreliable.\n\nThe quarter was defined by three events: a Category 5 hurricane strike on the Tampa Bay metropolitan area ($18.2B insured loss), unprecedented flooding across Central Europe triggered by an anomalous atmospheric river ($11.4B), and a series of severe convective storms across the U.S. Midwest ($8.4B combined).\n\nMunich Re's chief climate scientist Dr. Ernst Rauch stated in the company's Q1 review that 'the 100-year event has become the 15-year event across multiple peril categories simultaneously — our models require fundamental recalibration.'\n\nThe reinsurance response has been swift and severe. At the April 1st renewal season, property catastrophe reinsurance rates increased an average of 42% for loss-affected territories, with some Florida programs seeing 60–80% increases. Several Lloyd's syndicates have exited the U.S. property catastrophe market entirely.\n\nFor primary insurers, the cascade effect is creating a coverage crisis. Seven regional U.S. insurers filed for insolvency in Q1 2026, the highest quarterly insolvency rate since Hurricane Katrina. State insurance commissioners in Florida, Louisiana, and California are considering emergency measures to prevent market collapse.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
  {
    id: 53, category: "economy",
    headline: "U.S. Core Inflation Cools to 2.6% in May 2026, But Fed Signals Rates Won't Fall Before Q4",
    excerpt: "Encouraging CPI data masked a troubling divergence: goods deflation is masking persistent services inflation that keeps Fed policymakers in a holding pattern.",
    body: "The Bureau of Labor Statistics reported May 2026 core CPI at 2.6% year-over-year, the lowest reading since February 2021 and a number that briefly sent equity markets to intraday highs before Fed Governor speeches tempered expectations for imminent rate cuts.\n\nThe headline figure conceals a striking compositional divergence. Goods prices fell 1.2% year-over-year in May as import deflation — driven by a strong dollar and Chinese manufacturing overcapacity — continued to suppress durable goods costs. But services inflation, which constitutes 58% of the CPI basket, remained stubbornly elevated at 4.1% year-over-year.\n\nHousing costs, representing roughly one-third of CPI, are running at 5.2% annually despite a cooling in spot rental markets. The lag effect between real-time rents and the official shelter cost measure means housing will continue to distort the headline inflation reading through at least Q3 2026.\n\nFederal Reserve Chair Jerome Powell, speaking at the Economic Club of New York on June 5th, reinforced the 'patient' stance: 'We need several more months of data confirming that the disinflationary trend in services is durable before we can have confidence that inflation is sustainably moving toward our 2% objective.'\n\nFixed income markets responded by extending their rate cut timeline, with the two-year Treasury yield stabilizing at 4.68% — implying the market now expects fewer than two cuts in 2026.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
  {
    id: 52, category: "travel",
    headline: "Business Travel Spending Surges 34% Past Pre-Pandemic Levels as Corporate Road Warriors Demand Premium Experiences in 2026",
    excerpt: "The corporate travel renaissance is rewriting the economics of airlines, hotels, and travel management — and companies that fail to adapt their travel policies are losing top talent.",
    body: "Corporate travel spending in the United States surged to $387 billion in the trailing 12 months through May 2026, representing a 34% premium over the 2019 pre-pandemic baseline and definitively answering whether remote work would permanently suppress business travel demand.\n\nThe answer, emphatically, is no. If anything, the pandemic-era compression of in-person relationship building has created a pent-up demand for face-to-face interaction that is driving travel volumes to record levels across every category — from domestic day trips to multi-week international executive roadshows.\n\nAmerican Airlines reported that managed corporate accounts grew 22% in Q1 2026, with premium cabin bookings outpacing economy by a factor of 3:1. United Airlines' Polaris business class achieved an average load factor of 91% in May, prompting the carrier to accelerate its narrow-body premium cabin retrofit program.\n\nThe hotel industry is recalibrating its entire pricing architecture around the premium corporate traveler. Hyatt's World of Hyatt corporate program reported a 41% increase in five-star property bookings from business accounts in 2026, reflecting a broad shift from the 'cheapest compliant fare' policy era toward experience-first corporate travel programs.\n\nTalent retention is increasingly driving the premium pivot. HR research from Mercer indicates that 67% of frequent business travelers cite travel quality as a top-five factor in employer satisfaction — a finding that has prompted compensation consultants to formally value travel perks in total rewards benchmarking.",
    author: "Lena Marchetti", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
  {
    id: 51, category: "retirement",
    headline: "The $7.4 Trillion Retirement Gap: Why 62% of Americans Over 55 Are Dangerously Underfunded Heading Into 2027",
    excerpt: "The most comprehensive retirement readiness study ever conducted reveals a savings crisis of generational proportions — and the window to course-correct is closing.",
    body: "The Employee Benefit Research Institute's 2026 Retirement Confidence Survey, the most comprehensive such study ever conducted with a sample of 8,200 workers and retirees, has confirmed what financial planners have long feared: the United States faces a retirement savings gap of $7.4 trillion, with 62% of Americans over age 55 projected to exhaust their savings within 15 years of retiring.\n\nThe numbers behind the aggregate figure are stark. The median retirement savings for households approaching traditional retirement age (60–64) stands at $172,000 — a figure that would generate approximately $690 per month in income under a 4% withdrawal rule, far below the $3,200 monthly income that studies show is required to maintain pre-retirement living standards for the average American household.\n\nThree structural forces are converging to deepen the crisis. First, the defined benefit pension system has been almost entirely replaced by defined contribution plans, transferring investment risk and longevity risk from employers to individuals who are ill-equipped to manage them. Second, Social Security's long-term solvency is increasingly in question, with the program's trustees projecting a 23% automatic benefit cut in 2033 absent legislative reform. Third, healthcare cost inflation continues to run at 5.8% annually, consuming an ever-larger share of fixed retirement budgets.\n\nThe advisory industry is responding with urgency. Fidelity, Vanguard, and Schwab have all launched AI-powered retirement planning tools that generate personalized catch-up strategies, while Congress is considering expanding catch-up contribution limits to $40,000 annually for workers aged 60–63 under a proposed SECURE 3.0 framework.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
  {
    id: 50, category: "finance",
    headline: "Corporate Treasury Departments Are Sitting on $2.3 Trillion in Idle Cash — And Paying a Steep Price for It",
    excerpt: "A new wave of liquidity mismanagement is quietly eroding corporate balance sheets. Here's why CFOs can no longer afford to ignore it.",
    body: "American non-financial corporations are collectively sitting on $2.3 trillion in cash and short-term investments as of Q1 2026, according to Federal Reserve flow-of-funds data — the highest level on record and a figure that represents both a triumph of corporate risk management and a staggering opportunity cost.\n\nThe arithmetic is unforgiving. At a time when the federal funds rate remains at 5.25%, corporations holding excess cash in non-interest-bearing accounts or low-yield money market funds are forfeiting billions in potential income. Goldman Sachs treasury analysts estimate that suboptimal cash management cost U.S. corporates $84 billion in foregone interest income in 2025 alone.\n\nThe root cause is structural inertia. Many corporate treasury functions were built for a zero-interest-rate world and have not yet retooled their cash deployment frameworks for the current environment. Policies written in 2015 that prioritized liquidity above all else have become expensive liability in 2026.\n\nThe solution set is well understood but inconsistently implemented. Sweep accounts, commercial paper programs, short-duration bond ladders, and reverse repo facilities can collectively add 150–200 basis points of yield on operating cash balances without meaningfully compromising liquidity. Yet only 34% of mid-market companies have implemented even a basic cash segmentation strategy, per a recent AFP (Association for Financial Professionals) survey.\n\nThe CFO imperative is clear: treat the treasury function as a profit center, not a cost center. In a 5% rate environment, idle cash is not a conservative strategy — it is a performance problem.",
    author: "Diana Cross", date: "Jun 2, 2026",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    is_hero: false, is_editors_pick: false,
  },
];

export default function CapitalDigest() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeNav, setActiveNav] = useState("FRONT PAGE");

  const heroArticle = SEEDED_ARTICLES.find((a) => a.is_hero) || SEEDED_ARTICLES[0];
  const editorsPicks = SEEDED_ARTICLES.filter((a) => a.is_editors_pick && a.id !== heroArticle?.id).slice(0, 3);

  const filtered =
    activeNav === "FRONT PAGE"
      ? SEEDED_ARTICLES
      : SEEDED_ARTICLES.filter((a) => (a.category || "").toLowerCase() === activeNav.toLowerCase());

  const todayStr = format(new Date(), "EEEE, MMMM d, yyyy").toUpperCase();
  const tickerText = TICKER_HEADLINES.join("   ·   ");

  return (
    <div className="bg-white min-h-screen font-serif">
      {/* ── TICKER ── */}
      <div className="bg-black text-white overflow-hidden" style={{ height: "32px" }}>
        <div className="flex items-center h-full">
          <span className="bg-red-600 text-white font-sans font-bold text-[10px] tracking-widest px-3 h-full flex items-center flex-shrink-0">
            BREAKING
          </span>
          <div className="overflow-hidden flex-1">
            <div className="whitespace-nowrap font-sans font-semibold text-[11px] tracking-wide"
              style={{ display: "inline-block", animation: "ticker-scroll 60s linear infinite" }}>
              {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
            </div>
          </div>
        </div>
        <style>{`@keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </div>

      {/* ── MASTHEAD ── */}
      <div className="border-b-4 border-black pt-4 pb-3 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-[10px] font-sans tracking-widest text-slate-500 mb-3 border-b border-slate-200 pb-2">
            <span>{todayStr}</span>
            <div className="flex items-center gap-4">
              <a href="https://fod.glinfico.com/" target="_blank" rel="noreferrer"
                className="bg-black text-white px-2 py-0.5 hover:bg-slate-800 transition-colors">
                ACCESS GLINFICO PLATFORM →
              </a>
              <span className="cursor-pointer hover:text-black">ADVERTISE</span>
              <span className="cursor-pointer hover:text-black">EDITORIAL</span>
            </div>
          </div>
          <div className="text-center border-b border-slate-200 pb-4 mb-2">
            <div className="text-[10px] font-sans tracking-[0.3em] text-slate-400 mb-1">
              POWERED BY{" "}
              <a href="https://fod.glinfico.com/" target="_blank" rel="noreferrer"
                className="text-black font-bold hover:underline">GLINFICO / FINANCIAL OPERATIONS</a>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-none text-black">
              FinVenture Pro
            </h1>
            <div className="text-[13px] font-sans tracking-[0.35em] text-slate-600 mt-1.5 font-semibold">
              CAPITAL DIGEST
            </div>
            <div className="text-[10px] font-sans tracking-[0.3em] text-slate-400 mt-0.5">
              EST. 2024 · EXECUTIVE FINANCIAL INTELLIGENCE
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <div className="border-b border-slate-300 bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <nav className="flex gap-0 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <button key={item} onClick={() => setActiveNav(item)}
                className={`text-[11px] font-sans font-bold tracking-widest px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                  ${activeNav === item ? "border-black text-black" : "border-transparent text-slate-500 hover:text-black hover:border-slate-300"}`}>
                {item}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">

        {/* FRONT PAGE */}
        {activeNav === "FRONT PAGE" && heroArticle && (
          <>
            {/* Hero + Editor's Picks */}
            <div className="grid lg:grid-cols-3 gap-0 border-b border-slate-200 pb-8 mb-8">
              {/* Hero */}
              <div className="lg:col-span-2 lg:pr-8 lg:border-r border-slate-200 cursor-pointer group"
                onClick={() => setSelectedArticle(heroArticle)}>
                <span className="text-[10px] font-sans font-bold tracking-widest text-red-600 mb-2 block">
                  {CATEGORY_LABELS[heroArticle.category] || heroArticle.category?.toUpperCase()}
                </span>
                {heroArticle.image_url && (
                  <img src={heroArticle.image_url} alt={heroArticle.headline}
                    className="w-full h-64 lg:h-80 object-cover mb-4 group-hover:opacity-95 transition-opacity" />
                )}
                <h2 className="text-3xl lg:text-4xl font-black text-black leading-tight mb-3 group-hover:text-slate-700 transition-colors">
                  {heroArticle.headline}
                </h2>
                <p className="text-slate-600 text-base leading-relaxed mb-3 font-sans">{heroArticle.excerpt}</p>
                <p className="text-xs font-sans text-slate-400 tracking-wide">
                  By {heroArticle.author} · {heroArticle.date}
                </p>
              </div>

              {/* Editor's Picks */}
              <div className="lg:pl-8 mt-6 lg:mt-0">
                <div className="text-[10px] font-sans font-bold tracking-widest text-black border-b-2 border-black pb-1 mb-4">
                  EDITOR'S PICKS
                </div>
                <div className="space-y-5">
                  {editorsPicks.map((article) => (
                    <div key={article.id}
                      className="cursor-pointer group border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                      onClick={() => setSelectedArticle(article)}>
                      <span className="text-[9px] font-sans font-bold tracking-widest text-red-600 mb-1 block">
                        {CATEGORY_LABELS[article.category] || article.category?.toUpperCase()}
                      </span>
                      {article.image_url && (
                        <img src={article.image_url} alt={article.headline}
                          className="w-full h-28 object-cover mb-2 group-hover:opacity-90 transition-opacity" />
                      )}
                      <h3 className="text-base font-black text-black leading-tight group-hover:text-slate-700 transition-colors mb-1">
                        {article.headline}
                      </h3>
                      {article.excerpt && (
                        <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-2">{article.excerpt}</p>
                      )}
                      <p className="text-[10px] font-sans text-slate-400 mt-1">By {article.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Most Read */}
            <div className="border border-slate-200 rounded p-4 mb-8 bg-slate-50">
              <div className="text-[10px] font-sans font-bold tracking-widest text-black border-b border-slate-300 pb-1 mb-3">
                MOST READ
              </div>
              <div className="space-y-3">
                {SEEDED_ARTICLES.slice(0, 5).map((article, i) => (
                  <div key={article.id} className="flex gap-3 cursor-pointer group"
                    onClick={() => setSelectedArticle(article)}>
                    <span className="text-2xl font-black text-slate-200 leading-none w-8 flex-shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="text-[9px] font-sans font-bold tracking-widest text-red-600 block mb-0.5">
                        {CATEGORY_LABELS[article.category]}
                      </span>
                      <p className="text-sm font-black text-black leading-snug group-hover:text-slate-600 transition-colors line-clamp-2">
                        {article.headline}
                      </p>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">{article.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* The Wire */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-5">
                <div className="text-[10px] font-sans font-bold tracking-widest text-black border-b-2 border-black pb-1">
                  THE WIRE
                </div>
                <span className="text-[10px] font-sans text-slate-400 tracking-widest">
                  {SEEDED_ARTICLES.length} STORIES
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SEEDED_ARTICLES.map((article) => (
                  <WireCard key={article.id} article={article} onClick={() => setSelectedArticle(article)} />
                ))}
              </div>
            </div>

            {/* AD UNIT — lower rate */}
            <div className="border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <div className="text-[9px] font-sans tracking-widest text-slate-400 mb-1">SPONSORED · GLINFICO</div>
                <h3 className="text-lg font-black text-black">Access the GLINFICO Financial Operations Platform</h3>
                <p className="text-sm font-sans text-slate-500 mt-1">Enterprise-grade tools for deal management, lender outreach, and business consulting.</p>
              </div>
              <a href="https://fod.glinfico.com/" target="_blank" rel="noreferrer"
                className="bg-black text-white font-sans font-bold text-sm px-5 py-2.5 whitespace-nowrap hover:bg-slate-800 transition-colors">
                Visit fod.glinfico.com →
              </a>
            </div>
          </>
        )}

        {/* CATEGORY VIEW */}
        {activeNav !== "FRONT PAGE" && (
          <div>
            <div className="text-[10px] font-sans font-bold tracking-widest text-red-600 mb-1">{activeNav}</div>
            <h2 className="text-3xl font-black text-black border-b-2 border-black pb-2 mb-6">{activeNav}</h2>
            {filtered.length === 0 && (
              <p className="text-slate-400 font-sans text-sm py-12 text-center">No articles in this category.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article) => (
                <WireCard key={article.id} article={article} onClick={() => setSelectedArticle(article)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t-4 border-black bg-black text-white py-8 px-4 lg:px-8 font-sans mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-black text-xl">FinVenture Pro</div>
            <div className="text-xs text-slate-400 tracking-widest mt-0.5">CAPITAL DIGEST · EXECUTIVE FINANCIAL INTELLIGENCE</div>
          </div>
          <div className="text-xs text-slate-400 text-center sm:text-right">
            <div>Powered by <a href="https://fod.glinfico.com/" target="_blank" rel="noreferrer" className="text-white font-bold hover:underline">GLINFICO FINANCIAL OPERATIONS</a></div>
            <div className="mt-1">© {new Date().getFullYear()} GLINFICO LP · bcd.glinfico.com</div>
          </div>
        </div>
      </footer>

      {selectedArticle && (
        <ArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}

function WireCard({ article, onClick }) {
  return (
    <div className="cursor-pointer group border-b border-slate-200 pb-5" onClick={onClick}>
      {article.image_url && (
        <img src={article.image_url} alt={article.headline}
          className="w-full h-44 object-cover mb-3 group-hover:opacity-90 transition-opacity" />
      )}
      <span className="text-[9px] font-sans font-bold tracking-widest text-red-600 mb-1 block">
        {(CATEGORY_LABELS[article.category] || article.category?.toUpperCase())}
      </span>
      <h3 className="text-base font-black text-black leading-snug group-hover:text-slate-700 transition-colors mb-1.5 line-clamp-3">
        {article.headline}
      </h3>
      {article.excerpt && (
        <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-2 mb-2">{article.excerpt}</p>
      )}
      <p className="text-[10px] font-sans text-slate-400">
        By {article.author} · {article.date}
      </p>
    </div>
  );
}