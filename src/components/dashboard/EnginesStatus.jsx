import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Brain, Users, ShieldCheck, Banknote, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ENGINES = [
  {
    id: "scoring",
    name: "Scoring Engine",
    icon: Brain,
    color: "text-amber-500",
    bg: "bg-amber-50",
    description: "Grades leads A–F based on financials, completeness & AI due diligence",
    status: "active",
    source: "client",
  },
  {
    id: "matching",
    name: "Matching Engine",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-50",
    description: "Matches deals to best-fit lenders by loan type, credit, amount & geography",
    status: "active",
    source: "client",
  },
  {
    id: "underwriting",
    name: "Underwriting Engine",
    icon: ShieldCheck,
    color: "text-purple-500",
    bg: "bg-purple-50",
    description: "AI due diligence: business credit, revenue verification, property LTV",
    status: "active",
    source: "function",
    fn: "enrichLead",
  },
  {
    id: "deal_automation",
    name: "Deal Automation Engine",
    icon: Zap,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    description: "Auto-advances stale deal stages & reassigns unresponsive lenders in 24h",
    status: "active",
    source: "function",
    fn: "autoAdvanceDeal",
  },
  {
    id: "closing",
    name: "Closing Engine",
    icon: Banknote,
    color: "text-rose-500",
    bg: "bg-rose-50",
    description: "American Eagle soft closing or bank closing — triggered at Approved stage",
    status: "coming_soon",
    source: "external",
  },
];

export default function EnginesStatus() {
  const [runningEngine, setRunningEngine] = useState(null);
  const [engineResults, setEngineResults] = useState({});

  const runEngine = async (engine) => {
    if (engine.source !== 'function' || !engine.fn) return;
    setRunningEngine(engine.id);
    try {
      const res = await base44.functions.invoke(engine.fn, {});
      setEngineResults(prev => ({ ...prev, [engine.id]: { ok: true, data: res.data } }));
    } catch (err) {
      setEngineResults(prev => ({ ...prev, [engine.id]: { ok: false, error: err.message } }));
    }
    setRunningEngine(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Platform Engines Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ENGINES.map(engine => {
            const Icon = engine.icon;
            const result = engineResults[engine.id];
            const isRunning = runningEngine === engine.id;

            return (
              <div
                key={engine.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${engine.bg}`}>
                  <Icon className={`h-4 w-4 ${engine.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{engine.name}</p>
                    {engine.status === 'active' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Coming Soon</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{engine.description}</p>
                  {result && (
                    <div className={`mt-1.5 text-xs px-2 py-1 rounded-lg ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {result.ok ? (
                        <span>
                          ✓ {result.data?.summary || `Advanced: ${result.data?.advanced ?? 0} · Reassigned: ${result.data?.reassigned ?? 0}`}
                        </span>
                      ) : (
                        <span>✗ {result.error}</span>
                      )}
                    </div>
                  )}
                </div>
                {engine.source === 'function' && engine.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 h-8 text-xs"
                    disabled={isRunning}
                    onClick={() => runEngine(engine)}
                  >
                    {isRunning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    )}
                    {isRunning ? '' : 'Run'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}