import { useState } from "react";
import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import Starfield from "@/components/public/Starfield";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";

export default function FodPortal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />

      <div className="flex-1 flex items-center justify-center px-4 pt-20">
        <div className="relative w-full max-w-md">
          <Starfield />
          <div className="relative z-10 bg-[#0f0f1e] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-extrabold text-2xl">G</span>
              </div>
              <h1 className="text-2xl font-extrabold">
                GLINFICO <span className="text-amber-400">ACCESS ENGINE</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2">Sign in to your role portal or access the admin console.</p>
            </div>

            <Tabs defaultValue="portal">
              <TabsList className="grid grid-cols-2 w-full mb-6 bg-white/5 border border-white/10">
                <TabsTrigger value="portal" className="text-white data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  Portal Login
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-white data-[state=active]:bg-amber-500 data-[state=active]:text-black">
                  Admin Login
                </TabsTrigger>
              </TabsList>

              <TabsContent value="portal">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all">
                    Sign In
                  </button>
                  <p className="text-center text-slate-500 text-xs">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => base44.auth.redirectToLogin()} className="text-amber-400 hover:text-amber-300">
                      Create one here →
                    </button>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Admin Email</label>
                    <input
                      type="email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                      placeholder="admin@glinfico.com"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs uppercase tracking-wider mb-1 block">Password</label>
                    <input
                      type="password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all">
                    Access Admin Console
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}