import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = ["Home", "Platform", "Solutions", "Pricing", "Contact"];

const linkPaths = {
  Home: "/",
  Platform: "/fod/platform",
  Solutions: "/fod/solutions",
  Pricing: "/fod/pricing",
  Contact: "/fod/contact",
};

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
            <p className="text-amber-400 text-[10px] tracking-widest uppercase">FOD — Financial Operations Division</p>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l} to={linkPaths[l]}
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
              {l}
            </Link>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            <Link to="/fod/portal">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
            <Link to="/fod/submit">Submit a Deal</Link>
          </Button>
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
            <Link key={l} to={linkPaths[l]} onClick={() => setOpen(false)}
              className="block text-slate-300 hover:text-white text-sm font-medium py-1">
              {l}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1 border-white/20 text-white">
              <Link to="/fod/portal" onClick={() => setOpen(false)}>Sign In</Link>
            </Button>
            <Button asChild size="sm" className="flex-1 bg-amber-500 text-black font-semibold">
              <Link to="/fod/submit" onClick={() => setOpen(false)}>Submit Deal</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
