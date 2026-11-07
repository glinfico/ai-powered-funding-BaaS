import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GLINFICO Control Center — Leads, Deals, Lenders, Investors, Commissions",
  description: "GLINFICO Control Center: bank-DB leads with consent evidence, IDIQ/FinGoal enrichment, lender & investor directories, deals pipeline, term sheets, tasks, commissions, reports and AI comms drafts. Load-test engine at /lab.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
