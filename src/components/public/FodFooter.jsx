import { Link } from "react-router-dom";

export default function FodFooter() {
  return (
    <footer className="bg-[#080810] border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-sm">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-black font-extrabold">G</span>
            </div>
            <div>
              <p className="text-white font-bold text-xs">GLINFICO</p>
              <p className="text-amber-400 text-[9px] tracking-widest uppercase">Financial Operations Division</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            AI-powered platform connecting brokers, lenders, and investors.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-white font-semibold tracking-wider text-xs uppercase">Platform</p>
          {["Platform", "Solutions", "Pricing", "Contact"].map(l => (
            <Link key={l} to={`/fod/${l.toLowerCase()}`} className="block text-slate-400 hover:text-amber-400 transition-colors text-xs">{l}</Link>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-white font-semibold tracking-wider text-xs uppercase">Access</p>
          <Link to="/fod/portal" className="block text-slate-400 hover:text-amber-400 transition-colors text-xs">Sign In</Link>
          <Link to="/fod/submit" className="block text-slate-400 hover:text-amber-400 transition-colors text-xs">Submit a Deal</Link>
          <Link to="/fod/contact" className="block text-slate-400 hover:text-amber-400 transition-colors text-xs">Contact Us</Link>
        </div>

        <div className="space-y-3">
          <p className="text-white font-semibold tracking-wider text-xs uppercase">Legal</p>
          {["Platform Policy", "Borrower Policy", "Broker Policy", "Investor Policy", "Lender Policy"].map(l => (
            <span key={l} className="block text-slate-400 text-xs cursor-default">{l}</span>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-white font-semibold tracking-wider text-xs uppercase">Contact</p>
          <p className="text-slate-400 text-xs">contact@glinfico.com</p>
          <p className="text-slate-400 text-xs">929-551-4282</p>
          <p className="text-slate-400 text-xs">177A E. Main St. Suite #417<br />New Rochelle, NY 10801</p>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 sm:px-6 py-4 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p>© 2026 GLINFICO LP — Financial Operations Division. All rights reserved. · fod.glinfico.com</p>
        <div className="flex gap-4">
          {["Privacy Policy", "Terms of Use", "Disclaimer", "AML / Anti-Fraud Statement"].map(l => (
            <span key={l} className="hover:text-slate-300 cursor-default">{l}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}