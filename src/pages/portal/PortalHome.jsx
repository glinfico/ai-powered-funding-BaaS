import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, X, Loader2, KeyRound } from 'lucide-react';

export default function PortalHome() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    {
      id: 'borrower',
      title: 'Borrower & Client Portal',
      desc: 'Track active loan applications, upload bank telemetry, and review live term sheets.',
      icon: '🏢',
      path: '/portal/borrower',
      color: 'border-blue-500/30 hover:border-blue-500 text-blue-400',
      bg: 'bg-blue-500/10',
      idPlaceholder: 'e.g. APP-2026-8941'
    },
    {
      id: 'broker',
      title: 'Broker & Partner Portal',
      desc: 'Manage assigned leads, submit deals to institutional lenders, and track commissions.',
      icon: '🤝',
      path: '/portal/broker',
      color: 'border-amber-500/30 hover:border-amber-500 text-amber-400',
      bg: 'bg-amber-500/10',
      idPlaceholder: 'e.g. BRK-5042'
    },
    {
      id: 'lender',
      title: 'Lender Matching Desk',
      desc: 'Access incoming capital partner deal flow, match underwriting criteria, and manage tranches.',
      icon: '🏛️',
      path: '/portal/lender',
      color: 'border-purple-500/30 hover:border-purple-500 text-purple-400',
      bg: 'bg-purple-500/10',
      idPlaceholder: 'e.g. LND-3091'
    },
    {
      id: 'investor',
      title: 'Investor & LP Syndicate',
      desc: 'Review AI-Comm broadcasted debt tranches, evaluate portfolios, and execute syndications.',
      icon: '💼',
      path: '/portal/investor',
      color: 'border-emerald-500/30 hover:border-emerald-500 text-emerald-400',
      bg: 'bg-emerald-500/10',
      idPlaceholder: 'e.g. I-10492'
    }
  ];

  const handleCardClick = (role) => {
    setSelectedRole(role);
    setEmail('');
    setAccountId('');
    setError('');
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      setLoading(false);
      if (!email || !accountId) {
        setError('Please enter both your Workspace Email and Assigned Account ID #.');
        return;
      }
      // Securely pass account context and route to private workspace
      navigate(selectedRole.path, { state: { accountId, email } });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 md:p-12">
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2.5 rounded-xl text-slate-950 font-black text-lg">GL</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">GLINFICO Master Portal Gateway</h1>
            <p className="text-xs text-slate-400">Secure External Workspace Network</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" /> 256-Bit Encrypted Gateway
        </div>
      </div>

      {/* Main Selection Grid */}
      <div className="max-w-4xl mx-auto w-full my-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Select Workspace & Authenticate</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Choose your portal role and enter your Assigned Account ID to populate your secure private workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleCardClick(role)}
              className={`group bg-slate-900 border ${role.color} p-8 rounded-2xl transition-all cursor-pointer flex flex-col justify-between shadow-xl hover:scale-[1.01]`}
            >
              <div>
                <div className={`w-12 h-12 rounded-xl ${role.bg} flex items-center justify-center text-2xl mb-6`}>
                  {role.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">{role.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">{role.desc}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                Authenticate with ID <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign-In Modal */}
      {selectedRole && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-2xl relative shadow-2xl">
            <button
              onClick={() => setSelectedRole(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl ${selectedRole.bg} flex items-center justify-center text-xl`}>
                {selectedRole.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold">{selectedRole.title}</h3>
                <p className="text-xs text-slate-400">Enter your assigned account credentials</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Workspace Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Assigned Account ID #
                </label>
                <input
                  type="text"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder={selectedRole.idPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-wider focus:outline-none focus:border-amber-500 uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1">Used to populate your personalized workspace records.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-amber-500/10"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
                Load Private Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center border-t border-slate-900 pt-6 text-xs text-slate-500">
        © 2026 GLINVESTCO Holding & GLINCO FINANCIAL • Secure External Workspace Gateway
      </div>
    </div>
  );
}
