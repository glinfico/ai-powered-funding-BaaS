import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";

export default function FodContact() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <FodNav />

      <section className="relative pt-32 pb-16 px-4 text-center overflow-hidden">
        <Starfield />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4">
            Get in <span className="text-amber-400">Touch</span>
          </h1>
          <p className="text-slate-300 text-xl">Book a demo or reach out to our team.</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">First Name</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm" placeholder="John" />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Last Name</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm" placeholder="Smith" />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Email</label>
            <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm" placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Company</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm" placeholder="Your Company" />
          </div>
          <div>
            <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Message</label>
            <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm resize-none" placeholder="Tell us about your funding needs..." />
          </div>
          <button className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all">
            Book a Demo
          </button>

          <div className="pt-4 border-t border-white/10 grid sm:grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-slate-500 text-xs uppercase mb-1">Email</p>
              <p className="text-amber-400">contact@glinfico.com</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase mb-1">Phone</p>
              <p className="text-white">929-551-4282</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase mb-1">Office</p>
              <p className="text-white text-xs">177A E. Main St. #417<br />New Rochelle, NY 10801</p>
            </div>
          </div>
        </div>
      </section>

      <FodFooter />
    </div>
  );
}