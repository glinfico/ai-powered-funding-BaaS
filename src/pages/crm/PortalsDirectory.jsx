import { Link } from 'react-router-dom';
import { ArrowUpRight, KeyRound, LockKeyhole, Users } from 'lucide-react';

const PORTALS = [
  { name: 'Staff / Admin Control Center', description: 'Existing Supabase sign-in and private CCD.', path: '/crm/dashboard', icon: LockKeyhole },
  { name: 'Borrower sign-in', description: 'Existing PFE portal entry; public front end unchanged.', path: '/portal', icon: Users },
  { name: 'Investor portal', description: 'Existing investor portal route.', path: '/portal/investor', icon: Users },
  { name: 'Broker workspace', description: 'Existing lead assignment and broker routes.', path: '/crm/brokers', icon: KeyRound },
  { name: 'Lender workspace', description: 'Existing lender directory route.', path: '/crm/lenders', icon: KeyRound },
  { name: 'Bank-lead import', description: 'Staff-only audited import; records remain pending review.', path: '/crm/bank-leads', icon: LockKeyhole, staffOnly: true },
  { name: 'DPE document vault', description: 'Staff-only private client document workflow.', path: '/crm/documents', icon: LockKeyhole, staffOnly: true },
  { name: 'Admin settings', description: 'Existing admin-only server credential vault.', path: '/crm/settings', icon: LockKeyhole, adminOnly: true },
  { name: 'Public GLINFICO site', description: 'Investor-facing PFE. This integration does not alter it.', path: '/', icon: ArrowUpRight },
];

export default function PortalsDirectory() {
  return <main className="mx-auto max-w-6xl space-y-5 p-6 md:p-8">
    <header><p className="text-xs font-bold uppercase tracking-wider text-amber-600">PRIVATE CCD · EXISTING AUTH</p><h1 className="mt-1 text-2xl font-black text-slate-900">Portals &amp; Access</h1><p className="mt-1 text-sm text-slate-500">Shortcuts to existing routes on this app. One Supabase login; no new PPG, login, or subdomain.</p></header>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><LockKeyhole className="mr-2 inline h-4 w-4" />Links do not grant roles. Existing Supabase authentication and ProtectedRoute checks remain in force.</div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{PORTALS.map((item) => { const Icon = item.icon; return <Link key={item.path} to={item.path} className="rounded-xl border border-slate-200 bg-white p-5 no-underline hover:border-amber-300">
      <Icon className="h-5 w-5 text-amber-600" /><h2 className="mt-3 font-bold text-slate-900">{item.name}</h2><p className="mt-1 text-sm text-slate-500">{item.description}</p><span className="mt-4 inline-block text-sm font-bold text-amber-700">Open existing route →</span>
    </Link>; })}</div>
  </main>;
}
