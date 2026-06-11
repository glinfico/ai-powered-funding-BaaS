import { useState } from "react";
import { Mail, Check } from "lucide-react";

export default function MagazineSubscribeBlock() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    // In production, wire this to your email provider / CRM
    setSubmitted(true);
  };

  return (
    <div className="border border-slate-200 bg-slate-50 p-8 mb-8 font-sans text-center">
      <div className="max-w-xl mx-auto">
        <div className="text-[9px] tracking-widest text-red-600 font-bold mb-2">FREE NEWSLETTER</div>
        <h2 className="text-2xl font-black text-black font-serif mb-1">
          Get Capital Digest in Your Inbox
        </h2>
        <p className="text-slate-500 text-sm mb-5">
          Daily executive financial intelligence — completely free. No subscriptions, no paywalls.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-emerald-700 font-semibold text-sm">
            <Check className="w-4 h-4" />
            You're in! Check your inbox for a confirmation.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 border border-slate-300 px-4 py-2.5 text-sm text-black focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="bg-black text-white font-bold text-sm px-5 py-2.5 hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Mail className="w-3.5 h-3.5" />
              Subscribe Free
            </button>
          </form>
        )}
        <p className="text-[10px] text-slate-400 mt-3">
          Powered by advertising · No credit card required · Unsubscribe anytime
        </p>
      </div>
    </div>
  );
}