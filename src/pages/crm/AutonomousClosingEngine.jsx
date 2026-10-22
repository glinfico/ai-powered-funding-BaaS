import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Zap, Clock, ShieldCheck, CheckCircle2, Cpu, ArrowRight } from "lucide-react";
import { generate1000Leads } from "@/data/mockEcosystemData";

export default function AutonomousClosingEngine() {
  const [leads] = useState(() => generate1000Leads());
  const [isAutoPilotRunning, setIsAutoPilotRunning] = useState(false);
  const [autoPilotProgress, setAutoPilotProgress] = useState(0);
  const [autoPilotSuccess, setAutoPilotSuccess] = useState(false);

  const handleRunAutoPilot = () => {
    setIsAutoPilotRunning(true);
    setAutoPilotProgress(10);
    setAutoPilotSuccess(false);

    const interval = setInterval(() => {
      setAutoPilotProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAutoPilotRunning(false);
          setAutoPilotSuccess(true);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const productSLAs = [
    { type: "MCA Loan", sla: "48 Hours", description: "Automated FICO & FinGoal telemetry, instant match with 22K lenders, vault unlock, and ACH disbursement.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { type: "Real Estate (REI)", sla: "5 Days", description: "Automated title verification, DSCR cash flow analysis, escrow document generation, and closing gate release.", color: "text-blue-400", bg: "bg-blue-500/10" },
    { type: "Mergers & Acquisitions (M&A)", sla: "14 Days", description: "Deep DART financial review, automated definitive purchase agreement generation, and syndicate escrow funding.", color: "text-purple-400", bg: "bg-purple-500/10" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                Autonomous 10K+ Lead Processing & Closing Engine
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold">Zero-Touch Automated Closing Pipeline</h1>
            <p className="text-slate-400 text-xs mt-1">Guaranteed SLA enforcement: MCA in 48h, REI in 5 days, M&A in 2 weeks at 10,000+ monthly capacity</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/crm/deals" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Deals Pipeline
            </Link>
            <Link to="/portal">
              <Button variant="outline" className="border-white/10 text-xs text-slate-300 hover:bg-white/5">
                Portal Hub
              </Button>
            </Link>
          </div>
        </div>

        {autoPilotSuccess && (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 shadow-2xl animate-fade-in">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
            <div>
              <strong className="block font-bold">Autonomous Auto-Pilot Batch Complete!</strong>
              <span>Processed 10,000+ monthly leads queue. All eligible MCA deals closed in &lt;48h, REI in &lt;5d, and M&A in &lt;14d with vault security unlocked and 2.0% ALS settlement applied.</span>
            </div>
          </div>
        )}

        {/* SLA Matrix Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {productSLAs.map((item, idx) => (
            <Card key={idx} className="bg-[#0f0f1e] border-white/10 text-white p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Badge className={`${item.bg} ${item.color} border-0 text-xs font-mono px-3 py-1`}>
                    SLA: {item.sla}
                  </Badge>
                  <Clock className="h-5 w-5 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.type}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">{item.description}</p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Automation Mode:</span>
                <strong className="text-emerald-400">100% Zero-Touch</strong>
              </div>
            </Card>
          ))}
        </div>

        {/* Autonomous Execution Panel */}
        <Card className="bg-[#0f0f1e] border-white/10 text-white p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Cpu className="h-6 w-6 text-emerald-400" /> 10,000+ Monthly Lead Auto-Pilot Engine
              </h3>
              <p className="text-slate-400 text-xs max-w-2xl">
                Bypasses manual underwriting queues. Ingests raw applications, runs IDIQ credit scoring and FinGoal cash flow telemetry, matches against 22,450 lenders, auto-generates closing contracts, and executes vault-protected funding within SLA limits.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3">
              <Button
                onClick={handleRunAutoPilot}
                disabled={isAutoPilotRunning}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-8 py-4 text-sm cursor-pointer shadow-xl shadow-emerald-500/20"
              >
                <Zap className="h-4 w-4 mr-2 fill-black" />
                {isAutoPilotRunning ? `Running Auto-Pilot (${autoPilotProgress}%)...` : "⚡ Execute 10K Monthly Leads Auto-Pilot"}
              </Button>
            </div>
          </div>

          {isAutoPilotRunning && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Autonomous Processing Throughput (10K Leads Queue)...</span>
                <span className="text-emerald-400 font-mono">{autoPilotProgress}%</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${autoPilotProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
