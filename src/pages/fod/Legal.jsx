import { useState } from "react";
import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import BorrowerConsentForm from "@/components/legal/BorrowerConsentForm";

const SECTIONS = [
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Use" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "aml", label: "AML / Anti-Fraud" },
  { id: "borrower", label: "Borrower Policy" },
  { id: "borrower_consent", label: "Borrower Consent Form" },
  { id: "broker", label: "Broker Policy" },
  { id: "lender", label: "Lender Policy" },
  { id: "investor", label: "Investor Policy" },
];

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    updated: "June 1, 2026",
    body: `
## 1. Introduction
GLINFICO LP ("GLINFICO," "we," "our," or "us") is committed to protecting your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard information when you visit our website, platform, or use any of our services (collectively, the "Services"). By accessing or using our Services, you agree to the terms of this Privacy Policy.

## 2. Information We Collect
**Information You Provide:** We collect information you voluntarily provide, including name, email address, phone number, business name, financial data (loan amounts, revenue, credit range), and any documents submitted through our platform.

**Automatically Collected Information:** When you access our Services, we may automatically collect device information, IP addresses, browser type, pages visited, and usage patterns via cookies and similar technologies.

**Third-Party Data:** We may receive information from credit bureaus, data enrichment providers, and business verification services to supplement your profile.

## 3. How We Use Your Information
- To process and evaluate loan applications and match you with appropriate lenders or investors
- To communicate with you regarding your account, transactions, and updates
- To comply with legal obligations, including KYC, AML, and regulatory requirements
- To improve our platform, develop new features, and conduct analytics
- To prevent fraud, unauthorized access, and other illegal activities

## 4. Information Sharing
We do not sell your personal information. We may share data with:
- **Lenders and Investors** you are matched with, solely to evaluate and process your application
- **Service Providers** who assist with operations (cloud hosting, analytics, email, etc.)
- **Regulatory Authorities** when required by applicable law
- **Business Transfers** in connection with mergers, acquisitions, or asset sales

## 5. Data Retention
We retain personal data for as long as necessary to fulfill the purposes described in this policy, comply with legal obligations, and resolve disputes. Financial records may be retained for up to 7 years per applicable law.

## 6. Your Rights
Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict processing of your personal data. To exercise these rights, contact us at privacy@glinfico.com.

## 7. Security
We implement industry-standard technical and organizational measures to protect your data, including encryption in transit and at rest. No method of transmission is 100% secure; we cannot guarantee absolute security.

## 8. Contact
GLINFICO LP · 177A E. Main St. Suite #417, New Rochelle, NY 10801 · privacy@glinfico.com
    `
  },
  terms: {
    title: "Terms of Use",
    updated: "June 1, 2026",
    body: `
## 1. Acceptance of Terms
By accessing or using the GLINFICO LP platform and Financial Operations Division ("FOD") services, you agree to be bound by these Terms of Use. If you do not agree, do not use our Services.

## 2. Eligibility
You must be at least 18 years of age and legally authorized to conduct business in the United States to use our Services. By using our platform, you represent and warrant that you meet these requirements.

## 3. Description of Services
GLINFICO operates a financial technology platform that facilitates connections between borrowers, brokers, lenders, and investors for the purpose of commercial financing. We are not a lender, bank, or credit provider. All credit decisions are made solely by participating lenders.

## 4. User Accounts
You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.

## 5. Prohibited Uses
You may not use our Services to:
- Submit false, misleading, or fraudulent information
- Violate any applicable federal, state, or local law or regulation
- Infringe on intellectual property rights
- Transmit malware, spam, or disruptive code
- Engage in money laundering or any activity prohibited by BSA/AML regulations

## 6. Intellectual Property
All content, trademarks, logos, and software on the GLINFICO platform are the property of GLINFICO LP or its licensors. You may not copy, reproduce, or distribute any content without express written permission.

## 7. Disclaimers
Our Services are provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee approval of any loan application or the terms offered by any lender.

## 8. Limitation of Liability
To the maximum extent permitted by law, GLINFICO LP shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the Services.

## 9. Governing Law
These Terms are governed by the laws of the State of New York, without regard to conflict-of-law provisions. Any disputes shall be resolved in the courts of Westchester County, New York.

## 10. Modifications
We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms.

## 11. Contact
legal@glinfico.com · 177A E. Main St. Suite #417, New Rochelle, NY 10801
    `
  },
  disclaimer: {
    title: "Disclaimer",
    updated: "June 1, 2026",
    body: `
## General Disclaimer
The information provided on the GLINFICO LP platform and website is for general informational purposes only and does not constitute financial, legal, tax, or investment advice. GLINFICO LP is not a licensed bank, credit union, insurance company, investment adviser, or broker-dealer.

## Not a Lending Commitment
Nothing on this platform constitutes a commitment to lend. All financing decisions are made solely and exclusively by the participating lenders in our network. Interest rates, terms, and approval decisions are determined by individual lenders based on their own underwriting criteria.

## Forward-Looking Statements
Certain information on this platform may include forward-looking statements or projections. These statements involve known and unknown risks and should not be relied upon as guarantees of future performance.

## Third-Party Links
Our platform may contain links to third-party websites. GLINFICO LP is not responsible for the content, privacy practices, or accuracy of any third-party site.

## No Guarantee of Results
Past performance of funded deals, match rates, or funding speed does not guarantee future results. Individual outcomes vary based on applicant qualifications and market conditions.

## Regulatory Notice
GLINFICO LP operates in compliance with applicable federal and state laws. Users are responsible for ensuring their use of the platform complies with laws applicable in their jurisdiction.
    `
  },
  aml: {
    title: "AML / Anti-Fraud Statement",
    updated: "June 1, 2026",
    body: `
## Anti-Money Laundering (AML) Policy
GLINFICO LP is committed to full compliance with the Bank Secrecy Act (BSA), the USA PATRIOT Act, and all applicable anti-money laundering regulations. We maintain a robust AML compliance program designed to detect, prevent, and report suspicious activity.

## Know Your Customer (KYC)
All users are subject to identity verification procedures. We collect and verify identity information in accordance with FinCEN Customer Due Diligence (CDD) requirements, including beneficial ownership verification for business entities.

## Suspicious Activity
GLINFICO LP monitors transactions and user behavior for signs of money laundering, fraud, and terrorist financing. Suspicious activity is reported to the Financial Crimes Enforcement Network (FinCEN) as required by law.

## Prohibited Activities
The following are strictly prohibited on our platform:
- Structuring transactions to avoid reporting thresholds
- Use of third-party funds without disclosure
- Misrepresentation of the source of funds or business purpose
- Any activity that facilitates money laundering or terrorist financing

## Sanctions Compliance
GLINFICO LP screens all users and transactions against OFAC (Office of Foreign Assets Control) sanctions lists and does not conduct business with sanctioned individuals, entities, or countries.

## Fraud Prevention
We employ multi-layer fraud detection including AI-driven document verification, behavioral analytics, and third-party credit and identity bureau checks. Fraudulent activity will result in immediate account termination and referral to law enforcement.

## Reporting
To report suspected fraud or AML concerns: compliance@glinfico.com · 929-551-4282
    `
  },
  borrower: {
    title: "Borrower Policy",
    updated: "June 1, 2026",
    body: `
## Borrower Eligibility
To use GLINFICO's platform as a borrower, you must be a legally operating business entity or sole proprietor in the United States, with the authority to seek financing on behalf of your organization.

## Accurate Information
You agree to provide complete, accurate, and truthful information in all loan applications and supporting documents. Misrepresentation of financial data, business history, or ownership is grounds for immediate disqualification and may constitute fraud.

## Application Process
Submitting an application through GLINFICO does not guarantee funding. Your application will be reviewed and, if qualified, matched with one or more lenders from our network. Each lender will conduct their own independent underwriting.

## Fees and Costs
GLINFICO does not charge borrowers direct fees for platform access or deal submission. Lender fees, origination costs, and interest rates are disclosed directly by the lender upon offer. Review all terms carefully before accepting any financing offer.

## Consent to Credit Inquiry
By submitting an application, you authorize GLINFICO and its participating lenders to obtain business and personal credit reports as permitted by law (soft pulls for pre-qualification; hard pulls only upon explicit consent).

## Communication
You consent to receive communications from GLINFICO and matched lenders via email, phone, and SMS related to your application. Standard messaging rates may apply.

## Data Use
Your application data may be shared with lenders in our network solely for underwriting purposes. Refer to our Privacy Policy for full details on data handling.
    `
  },
  broker: {
    title: "Broker Policy",
    updated: "June 1, 2026",
    body: `
## Broker Eligibility and Registration
Brokers using the GLINFICO platform must be licensed or otherwise legally authorized to originate or refer commercial loans in their operating jurisdiction. By registering, you represent that you are in compliance with all applicable licensing requirements.

## Submission Standards
All deal submissions must be complete, accurate, and submitted with the borrower's knowledge and consent. Brokers are prohibited from submitting applications without prior authorization from the borrower.

## Exclusive Submissions
Brokers agree not to submit the same deal simultaneously to GLINFICO and competing platforms without disclosure. Duplicate or simultaneous submissions may result in deal disqualification and account suspension.

## Commissions and Compensation
Broker compensation is agreed upon on a deal-by-deal basis with individual lenders and is not guaranteed by GLINFICO. Commission structures, referral fees, and fee disclosures must comply with applicable state and federal law. GLINFICO is not responsible for commission disputes between brokers and lenders.

## Confidentiality
Brokers agree to keep all lender criteria, match data, and deal terms confidential and not to disclose such information to third parties without authorization.

## Conduct Standards
Brokers must adhere to professional conduct standards, including non-discrimination, fair representation, and ethical marketing. GLINFICO reserves the right to remove any broker from the platform for conduct violations.

## Account Management
Brokers are responsible for maintaining up-to-date contact and licensing information in their account profiles. Outdated or inaccurate information may result in account suspension.
    `
  },
  lender: {
    title: "Lender Policy",
    updated: "June 1, 2026",
    body: `
## Lender Eligibility
Lenders joining the GLINFICO network must be legally licensed and in good standing to provide commercial lending products in the states they serve. Proof of licensure may be required upon onboarding.

## Deal Matching
GLINFICO uses AI-driven criteria matching to present deals aligned with your stated lending parameters (loan types, amounts, credit thresholds, industries, geography). Lenders are responsible for maintaining accurate criteria in their profiles.

## Underwriting and Decisions
All credit and underwriting decisions are made solely by the lender. GLINFICO does not make credit decisions, co-sign loans, or guarantee repayment of any funded transaction.

## Borrower Data Confidentiality
Borrower information shared with lenders through the platform is confidential and may only be used for the purpose of evaluating and funding the specific deal presented. Lenders may not use borrower data for marketing or any purpose unrelated to the matched deal.

## Fair Lending
All lenders on the GLINFICO platform must comply with the Equal Credit Opportunity Act (ECOA), Fair Housing Act (where applicable), and all other fair lending laws. Discriminatory underwriting practices are strictly prohibited.

## Performance Standards
GLINFICO monitors lender response times, funding rates, and borrower satisfaction. Lenders who fail to meet minimum performance standards may be removed from the network.

## Fees
Lenders agree to the GLINFICO network fee structure as outlined in their individual lender agreements. Fees are assessed on funded transactions only.
    `
  },
  investor: {
    title: "Investor Policy",
    updated: "June 1, 2026",
    body: `
## Investor Eligibility
Access to investment opportunities on the GLINFICO platform is limited to accredited investors as defined under SEC Rule 501 of Regulation D, or qualified institutional buyers (QIBs) as applicable. By accessing the investor portal, you represent and warrant that you meet the applicable eligibility requirements.

## Nature of Investments
Investment opportunities presented through GLINFICO involve commercial loans and structured finance products. All investments carry inherent risk, including the risk of partial or total loss of principal. Past performance does not guarantee future results.

## Not a Registered Offering
GLINFICO LP does not act as a registered broker-dealer, investment adviser, or securities dealer. Information presented on the platform does not constitute an offer to sell or a solicitation to buy any security.

## Due Diligence
Investors are solely responsible for conducting their own independent due diligence on all investment opportunities. GLINFICO provides informational summaries only and does not verify the completeness or accuracy of all deal data.

## Risk Disclosure
Commercial lending investments are subject to credit risk, interest rate risk, liquidity risk, and regulatory risk. You should consult with qualified financial, legal, and tax advisers before making any investment decision.

## Confidentiality
All deal information, borrower data, and lender terms shared with investors are confidential. Investors may not disclose, reproduce, or redistribute deal information outside the platform.

## Compliance
Investors must comply with all applicable securities laws, tax reporting requirements, and regulatory obligations in their jurisdiction. GLINFICO reserves the right to restrict access for non-compliant users.
    `
  }
};

function renderBody(text) {
  return text.trim().split("\n").map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      return <h2 key={i} className="text-lg font-bold text-white mt-8 mb-3 border-b border-white/10 pb-2">{trimmed.replace("## ", "")}</h2>;
    }
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return <p key={i} className="text-amber-300 font-semibold mt-4 mb-1">{trimmed.replace(/\*\*/g, "")}</p>;
    }
    if (trimmed.startsWith("- ")) {
      return <li key={i} className="text-slate-400 text-sm ml-4 mb-1 list-disc">{trimmed.replace("- ", "")}</li>;
    }
    if (trimmed === "") return <div key={i} className="h-2" />;
    // Inline bold
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-slate-400 text-sm leading-relaxed mb-2">
        {parts.map((part, j) =>
          part.startsWith("**") ? <strong key={j} className="text-slate-200">{part.replace(/\*\*/g, "")}</strong> : part
        )}
      </p>
    );
  });
}

export default function FodLegal() {
  const params = new URLSearchParams(window.location.search);
  const initial = params.get("section") || "privacy";
  const [active, setActive] = useState(initial);
  const section = CONTENT[active];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <FodNav />

      <section className="relative pt-32 pb-10 px-4 text-center overflow-hidden">
        <Starfield />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">Legal &amp; Compliance</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Policies &amp; Terms</h1>
          <p className="text-slate-400 text-base">GLINFICO LP is committed to transparency, regulatory compliance, and protecting all platform participants.</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 flex flex-col lg:flex-row gap-8">
        {/* Sidebar nav */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-3 sticky top-24">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 py-2">Documents</p>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                  active === s.id
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 min-h-[600px]">
          {active === "borrower_consent" ? (
            <>
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-white">Borrower Consent Form</h2>
                  <p className="text-slate-500 text-xs mt-1">Data Authorization — Credit, Revenue &amp; Property Verification</p>
                </div>
                <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/20 font-medium">
                  Required
                </span>
              </div>
              <BorrowerConsentForm />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                  <p className="text-slate-500 text-xs mt-1">Last updated: {section.updated}</p>
                </div>
                <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/20 font-medium">
                  GLINFICO LP
                </span>
              </div>
              <div className="prose-sm">
                {renderBody(section.body)}
              </div>
            </>
          )}
          {active !== "borrower_consent" && (
            <div className="mt-12 pt-6 border-t border-white/10 text-xs text-slate-600">
              <p>GLINFICO LP · 177A E. Main St. Suite #417, New Rochelle, NY 10801 · legal@glinfico.com · 929-551-4282</p>
              <p className="mt-1">This document is provided for informational purposes. Consult qualified legal counsel for advice specific to your situation.</p>
            </div>
          )}
        </main>
      </div>

      <FodFooter />
    </div>
  );
}