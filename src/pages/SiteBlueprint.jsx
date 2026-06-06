/**
 * GLINFICO SITE BLUEPRINT — PRESERVATION FILE
 * 
 * This page documents the complete structure, copy, features, and design specs
 * of both fod.glinfico.com and bcd.glinfico.com so they can be fully rebuilt
 * inside this platform once upgraded to Builder+.
 * 
 * Last captured: June 6, 2026
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================================
//  FOD.GLINFICO.COM — FULL SITE CAPTURE
// ============================================================

const FOD_SITE = {
  domain: "fod.glinfico.com",
  brand: "GLINFICO — GLOBAL INVESTMENTS FINANCE",
  tagline: "Where Funding Meets Intelligence",
  subtitle: "AI-powered platform connecting brokers, lenders, and investors. Built for brokers, businesses, lenders, and investors looking to move capital faster.",
  colors: {
    background: "#0a0a12",  // dark navy/black
    primary: "#d4a017",     // gold/amber
    text: "#ffffff",
    cardBg: "#0f0f1e",
    cardBorder: "#1a1a2e",
  },
  design: "Dark background with animated starfield dots, gold accent color, white text. Logo: gold hexagon with 'G' + 'GLINFICO / GLOBAL INVESTMENTS FINANCE'",

  nav: {
    links: ["Home", "Platform", "Solutions", "Products", "Pricing", "Contact"],
    ctaButtons: ["Sign Up", "Sign In", "Submit Deal (gold filled)"],
  },

  pages: {
    home: {
      url: "/",
      hero: {
        headline: "Where Funding Meets Intelligence",
        headlineAccent: "Intelligence",  // in gold
        body: "AI-powered platform connecting brokers, lenders, and investors.\nBuilt for brokers, businesses, lenders, and investors looking to move capital faster.",
        ctas: [
          { label: "Get Started", url: "/signup", style: "gold outlined" },
          { label: "Start Smart Funding Router", url: "/dashboard", style: "dark outlined" },
          { label: "Submit a Deal", url: "/submit", style: "dark outlined" },
          { label: "Sign In", url: "/portal", style: "dark outlined" },
          { label: "Book a Demo", url: "/demo", style: "dark outlined" },
        ],
      },
      sections: [
        {
          id: "demos",
          title: "Watch Our Demos",
          titleColor: "gold",
          items: [
            { label: "Demo 1", title: "HeyGen | GLINFICO.FOD Short Demo", type: "video" },
            { label: "Demo 2", title: "HeyGen | GLINFICO DEMO2", type: "video" },
            { label: "FOD Portal Virtual Tour", title: "HeyGen | FOD Portal Virtual Tour", type: "video" },
            { label: "Getting Started Guide", title: "HeyGen | GLINFICO.FOD Getting Started Guide", type: "video" },
          ],
        },
        {
          id: "howItWorks",
          title: "How It Works",
          steps: [
            { number: 1, label: "Submit your deal", cta: "Start →", url: "/submit" },
            { number: 2, label: "Get matched with lenders", cta: "Start →", url: "/dashboard" },
            { number: 3, label: "Close faster", cta: "Start →", url: "/portal" },
          ],
        },
        {
          id: "builtForPerformance",
          title: "Built for Performance",
          features: [
            { label: "500+ Lenders Network", cta: "Explore →", url: "/platform" },
            { label: "AI Matching Engine", cta: "Explore →", url: "/dashboard" },
            { label: "Real-Time Deal Flow", cta: "Explore →", url: "/dashboard" },
            { label: "MCA Funding", cta: "Apply →", url: "/submit" },
            { label: "Real Estate Capital", cta: "Apply →", url: "/submit" },
            { label: "M&A Deals", cta: "Apply →", url: "/submit" },
            { label: "Loan Servicing", cta: "Apply →", url: "/contact" },
          ],
        },
      ],
    },

    platform: {
      url: "/platform",
      headline: "The GLINFICO Platform",
      subheadline: "One system connecting funding, deals, and capital.",
      features: [
        { title: "AI Matching Engine", desc: "Match deals to lenders instantly with AI.", cta: "Open →", url: "/dashboard" },
        { title: "Deal Pipeline Tracking", desc: "Track every deal from submission to funding.", cta: "Open →", url: "/dashboard" },
        { title: "Lender Network Access", desc: "500+ lenders across MCA, REI, M&A, and more.", cta: "Open →", url: "/dashboard" },
        { title: "Automated Workflows", desc: "Automate outreach, scoring, and term sheets.", cta: "Open →", url: "/dashboard" },
      ],
      cta: { label: "← Return to Dashboard", url: "/dashboard" },
    },

    solutions: {
      url: "/solutions",
      headline: "Solutions",
      subheadline: "Built for brokers, businesses, lenders, and investors.",
      portalTourVideo: "HeyGen | FOD Portal Virtual Tour",
      roleCards: [
        { role: "For Brokers", desc: "Access deals and lenders", cta: "Get Started →", url: "/portal" },
        { role: "For Businesses", desc: "Get funding faster", cta: "Get Started →", url: "/submit" },
        { role: "For Investors", desc: "Review opportunities", cta: "Get Started →", url: "/deal-room" },
        { role: "For Lenders", desc: "Receive better deals", cta: "Get Started →", url: "/portal" },
      ],
      cta: { label: "← Return to Home", url: "/" },
    },

    pricing: {
      url: "/pricing",
      headline: "Simple Pricing. Powerful Results.",
      subheadline: "Choose the plan that fits your growth.",
      plans: [
        {
          name: "Starter",
          price: "$49/month",
          desc: "Perfect for new brokers and small operators entering the funding space.",
          features: ["25 leads/month", "Basic CRM access", "Standard lender matching", "Email support"],
          cta: "Get Started",
        },
        {
          name: "Growth",
          price: "$149/month",
          desc: "Built for active brokers looking to scale deal flow and lender access.",
          features: ["100 leads/month", "Advanced CRM tools", "Priority lender routing", "Pipeline dashboard"],
          cta: "Get Started",
        },
        {
          name: "Pro",
          price: "$299/month",
          badge: "Most Popular",
          desc: "The complete funding operating system for serious dealmakers.",
          features: ["Unlimited leads", "Full MCA + REI + M&A access", "AI scoring & matching", "Marketplace visibility", "White-label options"],
          cta: "Get Started",
        },
        {
          name: "Enterprise",
          price: "Custom",
          desc: "For teams, institutions, and strategic funding operations.",
          features: ["Dedicated onboarding", "Custom workflows", "API integrations", "Multi-user access", "Priority infrastructure"],
          cta: "Contact Sales",
        },
      ],
    },

    portal: {
      url: "/portal",
      headline: "GLINFICO ACCESS ENGINE",
      headlineAccent: "ACCESS ENGINE",
      subheadline: "Sign in to your role portal or access the admin console.",
      tabs: ["Portal Login", "Admin Login"],
      loginForm: {
        fields: ["Email Address", "Password"],
        cta: "Sign In",
        footer: "Don't have an account? Create one here → /signup",
      },
    },

    submit: {
      url: "/submit",
      // same as /portal (deal submission form — requires auth first)
      notes: "Redirects to Access Engine if not logged in. Authenticated users see deal submission form.",
    },

    signup: {
      url: "/signup",
      notes: "Registration flow for new portal users (brokers, businesses, investors, lenders).",
    },
  },

  footer: {
    logo: "GLINFICO / FINANCIAL OPERATIONS DIVISION",
    tagline: "AI-powered platform connecting brokers, lenders, and investors.",
    columns: {
      PLATFORM: ["Platform", "Solutions", "Products", "Pricing"],
      ACCESS: ["Dashboard", "Role Portal", "Submit a Deal"],
      LEGAL: ["Platform Policy", "Borrower Policy", "Broker Policy", "Investor Policy", "Lender Policy"],
      COMPLIANCE: ["Privacy Policy", "Terms of Use", "Disclaimer", "Success Fee Policy", "AML / Anti-Fraud"],
      CONTACT: {
        email: "contact@glinfico.com",
        phone: "Google Voice: 929-551-4282",
        address: "177A E. Main St. Suite #417, New Rochelle, NY 10801",
      },
    },
    copyright: "© 2026 GLINFICO LP — Financial Operations Division. All rights reserved. · fod.glinfico.com",
    bottomLinks: ["Privacy Policy", "Terms of Use", "Disclaimer", "AML / Anti-Fraud Statement"],
  },
};

// ============================================================
//  BCD.GLINFICO.COM — FULL SITE CAPTURE
// ============================================================

const BCD_SITE = {
  domain: "bcd.glinfico.com",
  brand: "FinVenture Pro — EST. 2024 · THE EXECUTIVE INTELLIGENCE MAGAZINE",
  tagline: "Powered by GLINFICO FINANCIAL OPERATIONS",
  poweredByBadge: {
    label: "POWERED BY GLINFICO / FINANCIAL OPERATIONS",
    linkUrl: "https://fod.glinfico.com/",
  },
  design: "White background news/magazine layout. Dark serif headlines. Red category tags. 2-column editorial layout with sidebar. Breaking news ticker at top.",
  colors: {
    background: "#ffffff",
    headline: "#111111",
    accent: "#cc0000",    // red for category labels & finance tags
    sidebar: "#f5f5f5",
    ticker: "#000000",    // black ticker bar
    tickerText: "#ffffff",
  },

  breakingTicker: [
    "FED HOLDS RATES — PCE AT 2.4% — THIRD STRAIGHT PAUSE EXPECTED IN Q3",
    "S&P 500 HITS RECORD 5,847 — AI EARNINGS BEAT CONSENSUS BY 12% AVERAGE",
    "IMF RAISES GLOBAL GROWTH FORECAST TO 3.2% FOR 2026",
    "TERM LIFE PREMIUMS HIT DECADE LOW — $500K COVERAGE FROM $28/MONTH",
    "COMMERCIAL REAL ESTATE DEBT WALL: $929 BILLION MATURES IN 2026",
    "TRANSATLANTIC BUSINESS CLASS FARES FALL 22% ON OVERCAPACITY",
  ],

  nav: {
    topBar: ["ADVERTISE", "EDITORIAL", "ACCESS GLINFICO PLATFORM →"],
    mainNav: ["FRONT PAGE", "FINANCE", "ECONOMY", "INSURANCE", "RETIREMENT", "TRAVEL", "BUSINESS CONSULTING"],
  },

  categories: ["finance", "economy", "insurance", "retirement", "travel", "business consulting"],

  contentStructure: {
    heroArticle: {
      category: "BUSINESS CONSULTING",
      headline: "The $4.7 Trillion Efficiency Gap: Why 68% of Fortune 500 Firms Are Overhauling Their Financial Operations in 2026",
      excerpt: "A seismic shift in enterprise financial consulting is forcing C-suites to confront a staggering inefficiency crisis—and the firms that act now are pulling decisively ahead.",
      author: "Diana Cross",
      date: "Jun 2, 2026",
      image: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=800&q=80",
      url: "/finVenturePro/article/56",
    },
    editorsPicks: {
      title: "EDITOR'S PICKS",
      articles: [
        {
          category: "FINANCE",
          headline: "Corporate Treasury Departments Are Sitting on $2.3 Trillion in Idle Cash — And Paying a Steep Price for It",
          excerpt: "A new wave of liquidity mismanagement is quietly eroding corporate balance sheets. Here's why CFOs can no longer afford to ignore it.",
          author: "Diana Cross",
          url: "/finVenturePro/article/50",
        },
        {
          category: "INSURANCE",
          headline: "Climate Catastrophe Costs Push Global Insured Losses Past $180 Billion in 2025, Reshaping Industry Underwriting Models",
          excerpt: "Insurers recorded $182B in catastrophe losses last year—a 34% surge from 2024—forcing a fundamental rethink of risk pricing, coverage availability, and capital strategy.",
          author: "Diana Cross",
          url: "/finVenturePro/article/45",
        },
        {
          category: "ECONOMY",
          headline: "U.S. Services Sector Contracts for Third Straight Month as ISM Index Falls to 47.3, Signaling Broader Economic Slowdown",
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
          url: "/finVenturePro/article/40",
        },
      ],
    },
    theWire: {
      title: "THE WIRE",
      viewAllUrl: "/finVenturePro/category/finance",
      articles: [
        { id: 61, category: "finance", headline: "Corporate Treasury Departments Cut Hedging Costs by 31% as AI-Driven FX Risk Platforms Reshape the $7.5 Trillion Daily Currency Market", author: "Priya Nair", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80" },
        { id: 60, category: "economy", headline: "U.S. Core Inflation Cools to 2.6% but Wage-Price Spiral Keeps Fed on Edge Ahead of Q3 Decision", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80" },
        { id: 59, category: "insurance", headline: "Climate Losses Force a $94 Billion Reckoning: How Insurers Are Repricing the Unthinkable", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80" },
        { id: 58, category: "retirement", headline: "The $1.3 Trillion Retirement Gap: Why 62% of Americans Over 55 Are Dangerously Underfunded Heading Into 2027", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80" },
        { id: 57, category: "travel", headline: "Business Travel Spending Hits $1.48 Trillion in 2026 as Corporate Fleets Pivot to Premium and AI-Driven Itineraries", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80" },
        { id: 56, category: "business consulting", headline: "The $4.7 Trillion Efficiency Gap: Why 68% of Fortune 500 Firms Are Overhauling Their Financial Operations in 2026", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=800&q=80" },
        { id: 55, category: "business consulting", headline: "The $2.3 Trillion Efficiency Gap: Why Fortune 500 Firms Are Overhauling Financial Operations in 2026", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=800&q=80" },
        { id: 54, category: "insurance", headline: "Climate Catastrophe Tab Hits $38B: How Reinsurers Are Redrawing the Global Risk Map in 2026", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80" },
        { id: 53, category: "economy", headline: "U.S. Core Inflation Cools to 2.6% in May 2026, But Fed Signals Rates Won't Fall Before Q4", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80" },
        { id: 52, category: "travel", headline: "Business Travel Spending Surges 34% Past Pre-Pandemic Levels as Corporate Road Warriors Demand Premium Experiences in 2026", author: "Lena Marchetti", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80" },
        { id: 51, category: "retirement", headline: "The $7.4 Trillion Retirement Gap: Why 62% of Americans Over 55 Are Dangerously Underfunded Heading Into 2027", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80" },
        { id: 50, category: "finance", headline: "Corporate Treasury Departments Are Sitting on $2.3 Trillion in Idle Cash — And Paying a Steep Price for It", author: "Diana Cross", date: "Jun 2, 2026", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80" },
      ],
    },
    mostRead: {
      title: "MOST READ",
      articles: [
        { rank: "01", category: "FINANCE", headline: "Corporate Treasury Departments Cut Hedging Costs by 31% as AI-Driven FX Risk Platforms Reshape the $7.5 Trillion Daily Currency Market", date: "Jun 2, 2026" },
      ],
    },
    featuredSection: {
      title: "Business Consulting",
      viewAllUrl: "/finVenturePro/category/business-consulting",
      articles: [
        { id: 56, headline: "The $4.7 Trillion Efficiency Gap: Why 68% of Fortune 500 Firms Are Overhauling Their Financial Operations in 2026", excerpt: "A seismic shift in enterprise financial consulting is forcing C-suites to confront a staggering inefficiency crisis—and the firms that act now are pulling decisively ahead.", author: "Diana Cross", date: "Jun 2, 2026" },
        { id: 55, headline: "The $2.3 Trillion Efficiency Gap: Why Fortune 500 Firms Are Overhauling Financial Operations in 2026", excerpt: "A landmark McKinsey analysis reveals that inefficient financial operations cost global enterprises $2.3 trillion annually—and the consultancies closing that gap are rewriting the rules of corporate finance.", author: "Diana Cross" },
        { id: 47, headline: "Consulting Firms Face a $47B Reckoning: AI Automation Is Eating the Billable Hour", excerpt: "The traditional consulting model is fracturing under AI pressure. Firms that fail to reprice their value proposition risk losing 34% of core revenue by 2028.", author: "Diana Cross" },
        { id: 46, headline: "The $2.3 Trillion Efficiency Gap: Why Mid-Market Firms Are Losing the Consulting ROI Battle in 2026", excerpt: "Mid-market companies are leaving an estimated $2.3 trillion in unrealized operational value on the table annually.", author: "Diana Cross" },
      ],
    },
    sponsoredAd: {
      advertiser: "GLINFICO",
      headline: "Access the GLINFICO Financial Operations Platform",
      body: "Enterprise-grade tools for deal management, lender outreach, and business consulting.",
      cta: "Visit fod.glinfico.com →",
      url: "https://fod.glinfico.com/",
    },
  },

  authors: ["Diana Cross", "Priya Nair", "Lena Marchetti"],

  urlPattern: "/finVenturePro/article/{id}",
  categoryUrlPattern: "/finVenturePro/category/{slug}",
};

// ============================================================
//  BUILD ROADMAP — What to rebuild when upgraded to Builder+
// ============================================================

const BUILD_ROADMAP = [
  {
    phase: "Phase 1",
    title: "FOD Landing Site (fod.glinfico.com)",
    priority: "HIGH",
    items: [
      "Dark starfield hero with gold/amber brand colors",
      "Nav: Home, Platform, Solutions, Products, Pricing, Contact + Sign Up / Sign In / Submit Deal CTAs",
      "Hero: 'Where Funding Meets Intelligence' with 5 CTA buttons",
      "Watch Our Demos section — 4 embedded HeyGen videos",
      "How It Works — 3 steps",
      "Built for Performance — 7 feature tiles",
      "Platform page — 4 feature cards (AI Engine, Pipeline, Lender Network, Workflows)",
      "Solutions page — role cards (Brokers, Businesses, Investors, Lenders) + portal tour video",
      "Pricing page — 4 tiers: Starter $49, Growth $149, Pro $299, Enterprise Custom",
      "Access Engine / Login page — Portal Login + Admin Login tabs",
      "Footer — 5 columns with legal links, contact info, copyright",
    ],
    techNotes: "Backend function needed for deal submission form. Stripe for subscription payments. Auth for portal access.",
  },
  {
    phase: "Phase 2",
    title: "FOD Portal — Role-Based Dashboards",
    priority: "HIGH",
    items: [
      "Broker Portal: Submit deals, track pipeline, view lender matches",
      "Borrower Portal: Deal status, document uploads, communication",
      "Lender Portal: Incoming deal flow, accept/decline, term sheet upload",
      "Investor Portal: Deal room, investment opportunities, funding status",
      "Admin Console: Full CRM (this app) + portal management",
    ],
    techNotes: "App user connectors for each role. Role-based routing using User.role field.",
  },
  {
    phase: "Phase 3",
    title: "BCD Site — FinVenture Pro Magazine (bcd.glinfico.com)",
    priority: "MEDIUM",
    items: [
      "Breaking news ticker (scrolling marquee)",
      "Masthead: FinVenture Pro — EST. 2024 + POWERED BY GLINFICO badge",
      "Top nav bar: date, ADVERTISE, EDITORIAL, ACCESS GLINFICO →",
      "Main nav: Front Page, Finance, Economy, Insurance, Retirement, Travel, Business Consulting",
      "Hero article + Editor's Picks sidebar layout",
      "The Wire — article feed grid",
      "Most Read — numbered list",
      "Featured Section — Business Consulting",
      "GLINFICO sponsored ad unit",
      "Article detail pages at /finVenturePro/article/{id}",
      "Category pages at /finVenturePro/category/{slug}",
      "All 12+ seeded articles (IDs 50–61) with full headlines/excerpts",
    ],
    techNotes: "InvokeLLM for AI article generation. Article entity needed. FinVenturePro content seeded above.",
  },
  {
    phase: "Phase 4",
    title: "AI Smart Funding Router",
    priority: "HIGH",
    items: [
      "Deal intake form → AI scores against 500+ lender criteria",
      "Match score per lender (0-100%)",
      "Auto-generate term sheet recommendations",
      "Outreach automation to top 3 matched lenders",
      "Deal room for investor review",
    ],
    techNotes: "Backend function + InvokeLLM with lender entity data. Requires Builder+ subscription.",
  },
];

// ============================================================
//  PAGE COMPONENT
// ============================================================

export default function SiteBlueprint() {
  const [activeTab, setActiveTab] = useState("fod");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Site Blueprint</h1>
          <p className="text-slate-500 mt-1">
            Complete preservation of <strong>fod.glinfico.com</strong> &amp; <strong>bcd.glinfico.com</strong> — ready to rebuild when upgraded to Builder+
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1.5">Captured June 6, 2026</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="fod">fod.glinfico.com</TabsTrigger>
          <TabsTrigger value="bcd">bcd.glinfico.com</TabsTrigger>
          <TabsTrigger value="roadmap">Build Roadmap</TabsTrigger>
        </TabsList>

        {/* ---- FOD TAB ---- */}
        <TabsContent value="fod" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                Brand & Design System
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><p className="font-semibold text-slate-700">Domain</p><p className="text-slate-500">{FOD_SITE.domain}</p></div>
              <div><p className="font-semibold text-slate-700">Brand Name</p><p className="text-slate-500">{FOD_SITE.brand}</p></div>
              <div><p className="font-semibold text-slate-700">Tagline</p><p className="text-slate-500">{FOD_SITE.tagline}</p></div>
              <div><p className="font-semibold text-slate-700">Color Palette</p>
                <div className="flex gap-2 mt-1">
                  {Object.entries(FOD_SITE.colors).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <div className="w-6 h-6 rounded border" style={{ backgroundColor: v }} />
                      <p className="text-xs text-slate-400 mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2"><p className="font-semibold text-slate-700">Design Notes</p><p className="text-slate-500">{FOD_SITE.design}</p></div>
            </CardContent>
          </Card>

          {/* Nav */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Navigation</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div><p className="font-semibold text-slate-700">Nav Links:</p><p className="text-slate-500">{FOD_SITE.nav.links.join("  ·  ")}</p></div>
              <div><p className="font-semibold text-slate-700">CTA Buttons:</p><p className="text-slate-500">{FOD_SITE.nav.ctaButtons.join("  ·  ")}</p></div>
            </CardContent>
          </Card>

          {/* Pages */}
          {Object.entries(FOD_SITE.pages).map(([key, page]) => (
            <Card key={key} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{page.url}</Badge>
                  <span className="capitalize">{key}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <pre className="whitespace-pre-wrap bg-slate-50 rounded-lg p-3 text-xs overflow-auto max-h-64">
                  {JSON.stringify(page, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}

          {/* Footer */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Footer</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <pre className="whitespace-pre-wrap bg-slate-50 rounded-lg p-3 text-xs overflow-auto max-h-64">
                {JSON.stringify(FOD_SITE.footer, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- BCD TAB ---- */}
        <TabsContent value="bcd" className="space-y-4 mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                FinVenture Pro — Brand & Design
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><p className="font-semibold text-slate-700">Domain</p><p className="text-slate-500">{BCD_SITE.domain}</p></div>
              <div><p className="font-semibold text-slate-700">Publication Name</p><p className="text-slate-500">FinVenture Pro</p></div>
              <div><p className="font-semibold text-slate-700">Est.</p><p className="text-slate-500">2024 · THE EXECUTIVE INTELLIGENCE MAGAZINE</p></div>
              <div><p className="font-semibold text-slate-700">Powered By</p><p className="text-slate-500">GLINFICO FINANCIAL OPERATIONS (badge, links to fod.glinfico.com)</p></div>
              <div className="sm:col-span-2"><p className="font-semibold text-slate-700">Design Notes</p><p className="text-slate-500">{BCD_SITE.design}</p></div>
              <div className="sm:col-span-2"><p className="font-semibold text-slate-700">Color Palette</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {Object.entries(BCD_SITE.colors).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <div className="w-6 h-6 rounded border" style={{ backgroundColor: v }} />
                      <p className="text-xs text-slate-400 mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Breaking News Ticker</CardTitle></CardHeader>
            <CardContent>
              <div className="bg-slate-900 rounded-lg p-3 text-white text-xs font-semibold">
                <span className="bg-red-600 px-2 py-0.5 rounded mr-3">BREAKING</span>
                {BCD_SITE.breakingTicker.join("  ·  ")}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Navigation</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div><p className="font-semibold text-slate-700">Top Bar:</p><p className="text-slate-500">{BCD_SITE.nav.topBar.join("  ·  ")}</p></div>
              <div><p className="font-semibold text-slate-700">Main Nav:</p><p className="text-slate-500">{BCD_SITE.nav.mainNav.join("  ·  ")}</p></div>
              <div><p className="font-semibold text-slate-700">Categories:</p><p className="text-slate-500">{BCD_SITE.categories.join(", ")}</p></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-lg">All Captured Articles (IDs 40–61)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {BCD_SITE.contentStructure.theWire.articles.map(a => (
                  <div key={a.id} className="flex gap-3 p-2 rounded-lg bg-slate-50 text-sm">
                    <Badge variant="outline" className="text-xs shrink-0 font-mono">#{a.id}</Badge>
                    <Badge className="text-xs shrink-0 bg-red-100 text-red-700">{a.category}</Badge>
                    <span className="text-slate-700 flex-1">{a.headline}</span>
                    <span className="text-slate-400 text-xs shrink-0">{a.author}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Full Content Structure</CardTitle></CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap bg-slate-50 rounded-lg p-3 text-xs overflow-auto max-h-96">
                {JSON.stringify(BCD_SITE.contentStructure, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- ROADMAP TAB ---- */}
        <TabsContent value="roadmap" className="space-y-4 mt-4">
          <p className="text-slate-500 text-sm">Upgrade to Builder+ to unlock backend functions, API integrations, Stripe payments, and custom domains. Then execute these phases in order.</p>
          {BUILD_ROADMAP.map(phase => (
            <Card key={phase.phase} className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={phase.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}>{phase.priority}</Badge>
                  <CardTitle className="text-base">{phase.phase} — {phase.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-amber-500 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                  <span className="font-semibold">Tech Notes: </span>{phase.techNotes}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}