import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = ["Platform", "Solutions", "Pricing", "Contact"];

export default function FodNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0a12]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-black font-extrabold text-lg">G</span>
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm tracking-wide">GLINFICO</p>
            <p className="text-amber-400 text-[10px] tracking-widest uppercase">AI-Powered Funding Platform</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l} to={`/fod/${l.toLowerCase()}`}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              {l}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/fod/portal">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">Sign In</Button>
          </Link>
          <Link to="/fod/submit">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">Submit a Deal</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-slate-300" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0a0a12] border-t border-white/10 px-4 py-4 space-y-3">
          {links.map(l => (
            <Link key={l} to={`/fod/${l.toLowerCase()}`} onClick={() => setOpen(false)}
              className="block text-slate-300 hover:text-white text-sm font-medium py-1">
              {l}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link to="/fod/portal" onClick={() => setOpen(false)} className="flex-1">
              <Button variant="outline" size="sm" className="w-full border-white/20 text-white">Sign In</Button>
            </Link>
            <Link to="/fod/submit" onClick={() => setOpen(false)} className="flex-1">
              <Button size="sm" className="w-full bg-amber-500 text-black font-semibold">Submit Deal</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}