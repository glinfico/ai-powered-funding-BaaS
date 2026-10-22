import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Shield, UserCheck, Eye, ExternalLink, CheckCircle2, Layers } from "lucide-react";
import { generate1000Leads } from "@/data/mockEcosystemData";

const MOCK_BROKERS = [
  { id: "P-10001", name: "Apex Financial Group", tier: "Senior Syndicate", activeDeals: 14 },
  { id: "P-10002", name: "Titan Capital Partners", tier: "Elite Broker", activeDeals: 22 },
  { id: "P-10003", name: "Vanguard Debt Solutions", tier: "Standard", activeDeals: 8 },
  { id: "P-10004", name: "Summit Commercial Credit", tier: "Senior Syndicate", activeDeals: 19 },
  { id: "P-10005", name: "BlueRidge Funding LLC", tier: "Elite Broker", activeDeals: 31 }
];

export default function BrokerAssignment() {
  const [leads, setLeads] = useState(() => generate1000Leads());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("P-10002");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAssignLead = (leadId, brokerId) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assignedBroker: brokerId } : l));
    const brokerObj = MOCK_BROKERS.find(b => b.id === brokerId);
    setSuccessMsg(`Successfully assigned lead ${leadId} to broker ${brokerObj ? brokerObj.name : brokerId} (${brokerId})!`);
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const handleAdminImpersonate = (portalType, accountId) => {
    localStorage.setItem(`glinfico_admin_impersonate_${portalType}`, accountId);
    if (portalType === 'borrower') {
      window.location.href = `/portal/borrower?impersonate=${accountId}`;
    } else {
      window.location.href = `/portal/investor?impersonate=${accountId}`;
    }
  };

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads.slice(0, 30);
    return leads.filter(l => 
      l.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.assignedBroker.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 30);
  }, [leads, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-mono">
                Admin & Agent Master Control
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold">Broker Lead Assignment & Portal Impersonation</h1>
            <p className="text-slate-400 text-xs mt-1">Assign leads to institutional brokers and override/view any borrower or investor portal</p>
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

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Admin Portal Impersonation Override */}
        <Card className="bg-[#0f0f1e] border-white/10 text-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold">Admin Portal Impersonation Override</h3>
              <p className="text-slate-400 text-xs">Instantly log into any borrower or investor account to inspect telemetry, credit reports, and active deal status.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-mono block uppercase">Borrower Account</span>
                <h4 className="font-bold text-sm">Acme Principal LLC (BL-80001)</h4>
                <p className="text-xs text-slate-400">IDIQ FICO: 724 | Rev: $148,500/mo</p>
              </div>
              <Button
                onClick={() => handleAdminImpersonate('borrower', 'BL-80001')}
                className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-xs border border-emerald-500/30 cursor-pointer"
              >
                Impersonate Portal →
              </Button>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-mono block uppercase">Investor Account</span>
                <h4 className="font-bold text-sm">Matrix Partners (I-10492)</h4>
                <p className="text-xs text-slate-400">Active VC Syndicate | Waltham, MA</p>
              </div>
              <Button
                onClick={() => handleAdminImpersonate('investor', 'I-10492')}
                className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold text-xs border border-emerald-500/30 cursor-pointer"
              >
                Impersonate Portal →
              </Button>
            </div>
          </div>
        </Card>

        {/* Section 2: Broker Lead Assignment Hub */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f0f1e] p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 w-full md:w-96">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads by name, ID, or broker..."
                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500"
              />
            </div>
            <p className="text-xs text-slate-400">Assigning across <strong className="text-emerald-400">{MOCK_BROKERS.length} Active Brokers</strong></p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="bg-[#0f0f1e] border-white/10 text-white p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border-emerald-500/30">
                      {lead.id}
                    </Badge>
                    <span className="text-[11px] text-slate-400">Current: <strong className="text-blue-300">{lead.assignedBroker}</strong></span>
                  </div>
                  <h4 className="font-bold text-sm mb-1">{lead.businessName}</h4>
                  <div className="space-y-1 text-xs bg-white/5 p-3 rounded-xl mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Requested:</span>
                      <strong className="text-emerald-400">${lead.requestedAmount.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credit Score:</span>
                      <strong className="text-amber-400">{lead.creditScore}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400">Assign to Broker:</label>
                  <select
                    value={lead.assignedBroker}
                    onChange={(e) => handleAssignLead(lead.id, e.target.value)}
                    className="w-full bg-[#15152a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    {MOCK_BROKERS.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.name} ({broker.id})
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
