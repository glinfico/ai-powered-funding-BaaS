import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, PlusCircle, CheckCircle2, Building2, Search, Layers } from "lucide-react";

const INITIAL_PACKAGES = [
  {
    id: "PKG-9942-MCA",
    type: "MCA Portfolio (14 Merchants)",
    principal: 450000,
    askingPrice: 425000,
    yield: "19.4% APR",
    term: "6 Months Remaining",
    riskGrade: "Grade A",
    sellerId: "I-10492",
    status: "Active"
  },
  {
    id: "PKG-8810-CRE",
    type: "Commercial Real Estate Bridge Note",
    principal: 1200000,
    askingPrice: 1180000,
    yield: "14.2% APR",
    term: "18 Months Remaining",
    riskGrade: "Grade A+",
    sellerId: "L-44912",
    status: "Active"
  },
  {
    id: "PKG-3312-MA",
    type: "M&A Working Capital Tranche",
    principal: 750000,
    askingPrice: 700000,
    yield: "22.1% APR",
    term: "12 Months Remaining",
    riskGrade: "Grade B+",
    sellerId: "I-59302",
    status: "Active"
  }
];

const MYCAPITAL_INVESTORS = [
  { id: "I-10492", name: "Matrix Partners", location: "Waltham, MA", type: "Venture Capital", updated: "10/20/2026" },
  { id: "I-29301", name: "IDG Ventures", location: "San Francisco, CA", type: "Venture Capital", updated: "10/20/2026" },
  { id: "I-44102", name: "SVB Capital", location: "Menlo Park, CA", type: "Private Equity", updated: "10/20/2026" },
  { id: "I-88120", name: "Littlejohn & Co.", location: "Greenwich, CT", type: "Private Equity", updated: "10/20/2026" },
  { id: "I-59302", name: "Riverside Central Europe Partners LLC", location: "New York, NY", type: "Private Equity", updated: "10/20/2026" },
  { id: "I-77140", name: "A.M. Pappas & Associates, LLC", location: "Research Triangle Park, NC", type: "Venture Capital", updated: "10/20/2026" },
  { id: "I-66210", name: "Frontline Strategy LLC", location: "New York, NY", type: "Venture Capital", updated: "10/20/2026" },
  { id: "I-33890", name: "Housatonic Partners", location: "San Francisco, CA", type: "Private Equity", updated: "10/20/2026" },
  { id: "I-99201", name: "Heritage Partners Inc.", location: "Boston, MA", type: "Private Equity", updated: "10/20/2026" },
  { id: "I-55412", name: "Triton Pacific Capital LLC", location: "Los Angeles, CA", type: "Private Equity", updated: "10/20/2026" }
];

export default function SecondaryMarketplace() {
  const [activeTab, setActiveTab] = useState("packages");
  const [packages, setPackages] = useState(INITIAL_PACKAGES);
  const [investorDirectory, setInvestorDirectory] = useState(MYCAPITAL_INVESTORS);
  const [searchTerm, setSearchTerm] = useState("");
  const [investorAccount, setInvestorAccount] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [showSellModal, setShowSellModal] = useState(false);
  const [newPkg, setNewPkg] = useState({
    type: "MCA Portfolio",
    principal: "",
    askingPrice: "",
    yield: "",
    term: "",
    riskGrade: "Grade A"
  });

  useEffect(() => {
    const saved = localStorage.getItem("glinfico_investor_account");
    if (saved) {
      try {
        setInvestorAccount(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleBuyPackage = (pkg) => {
    if (!investorAccount) {
      alert("Please sign into your Investor Portal first to acquire loan packages.");
      window.location.href = "/portal/investor";
      return;
    }
    const fee = Math.round(pkg.askingPrice * 0.02);
    setSuccessMsg(`Successfully acquired package ${pkg.id} for $${pkg.askingPrice.toLocaleString()}! Portfolio updated under ID ${investorAccount.code}. ALS Platform Transaction Fee (2.0%): $${fee.toLocaleString()}.`);
    setTimeout(() => setSuccessMsg(""), 6000);
  };

  const handleListPackage = (e) => {
    e.preventDefault();
    if (!investorAccount) {
      alert("Please sign into your Investor Portal to list packages.");
      window.location.href = "/portal/investor";
      return;
    }

    const created = {
      id: `PKG-${Math.floor(1000 + Math.random() * 9000)}-TR`,
      type: newPkg.type,
      principal: Number(newPkg.principal),
      askingPrice: Number(newPkg.askingPrice),
      yield: newPkg.yield || "16.0% APR",
      term: newPkg.term || "12 Months",
      riskGrade: newPkg.riskGrade,
      sellerId: investorAccount.code,
      status: "Active"
    };

    setPackages([created, ...packages]);
    setShowSellModal(false);
    setNewPkg({ type: "MCA Portfolio", principal: "", askingPrice: "", yield: "", term: "", riskGrade: "Grade A" });
    setSuccessMsg(`Your loan package ${created.id} was successfully listed on the Secondary Marketplace under 2.0% ALS settlement terms!`);
    setTimeout(() => setSuccessMsg(""), 6000);
  };

  const filteredInvestors = investorDirectory.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />

      <div className="flex-1 px-4 py-16 relative">
        <Starfield />

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium">ALS Debt & Liquidity Exchange (2.0% Fee)</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Secondary <span className="text-emerald-400">Loan Marketplace & 3,000+ Investor Network</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Trade MCA portfolios and CRE debt notes with 2.0% ALS harmonized transaction settlement.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {investorAccount ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-right">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Investor ID</span>
                  <span className="text-sm font-extrabold">{investorAccount.code}</span>
                </div>
              ) : (
                <Link to="/portal/investor">
                  <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs">
                    Investor Portal Sign In →
                  </Button>
                </Link>
              )}
              <Button 
                onClick={() => setShowSellModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 py-3 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" /> List Loan Package
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
            <button
              onClick={() => setActiveTab("packages")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "packages" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="h-4 w-4" /> Loan Packages for Sale ({packages.length})
            </button>
            <button
              onClick={() => setActiveTab("investors")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "investors" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" /> MyCapital 3,000+ Investor Directory
            </button>
          </div>

          {successMsg && (
            <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center gap-3 shadow-lg">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sell Modal */}
          {showSellModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="bg-[#0f0f1e] border-white/20 text-white max-w-lg w-full p-6 shadow-2xl">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-xl font-bold">List Loan Package on Secondary Market</CardTitle>
                  <p className="text-slate-400 text-xs mt-1">Platform Fee: Harmonized 2.0% ALS transaction fee at settlement.</p>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleListPackage} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Asset Class / Type</label>
                      <input
                        type="text"
                        required
                        value={newPkg.type}
                        onChange={(e) => setNewPkg({ ...newPkg, type: e.target.value })}
                        placeholder="e.g. MCA Portfolio (10 Merchants)"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Principal Balance ($)</label>
                        <input
                          type="number"
                          required
                          value={newPkg.principal}
                          onChange={(e) => setNewPkg({ ...newPkg, principal: e.target.value })}
                          placeholder="250000"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Asking Price ($)</label>
                        <input
                          type="number"
                          required
                          value={newPkg.askingPrice}
                          onChange={(e) => setNewPkg({ ...newPkg, askingPrice: e.target.value })}
                          placeholder="240000"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Target Yield</label>
                        <input
                          type="text"
                          value={newPkg.yield}
                          onChange={(e) => setNewPkg({ ...newPkg, yield: e.target.value })}
                          placeholder="18.5% APR"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Risk Grade</label>
                        <select
                          value={newPkg.riskGrade}
                          onChange={(e) => setNewPkg({ ...newPkg, riskGrade: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#15152a] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
                        >
                          <option value="Grade A+">Grade A+</option>
                          <option value="Grade A">Grade A</option>
                          <option value="Grade B+">Grade B+</option>
                          <option value="Grade B">Grade B</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3">
                        Publish Listing
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowSellModal(false)} className="text-slate-400 hover:text-white">
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 1: Loan Packages */}
          {activeTab === "packages" && (
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="bg-[#0f0f1e] border-white/10 text-white p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs font-mono">
                        {pkg.id}
                      </Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0 font-semibold">
                        {pkg.riskGrade}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold mb-1">{pkg.type}</h3>
                    <p className="text-slate-400 text-xs mb-4">Seller Investor ID: <strong className="text-white">{pkg.sellerId}</strong></p>

                    <div className="space-y-2 bg-white/5 rounded-xl p-4 mb-6 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Principal Balance:</span>
                        <strong className="text-white">${pkg.principal.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Asking Price:</span>
                        <strong className="text-emerald-400 text-sm">${pkg.askingPrice.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Yield:</span>
                        <strong className="text-amber-400">{pkg.yield}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ALS Fee (2.0%):</span>
                        <span className="text-slate-300">${Math.round(pkg.askingPrice * 0.02).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handleBuyPackage(pkg)}
                    className="w-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black font-bold py-2.5 transition-all border border-emerald-500/30 text-xs cursor-pointer"
                  >
                    Acquire Package Tranche →
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Tab 2: MyCapital Investor Directory (3000+ US PE/VC) */}
          {activeTab === "investors" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0f0f1e] p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 w-full md:w-96">
                  <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search investors by name, city, or ID..."
                    className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500"
                  />
                </div>
                <p className="text-xs text-slate-400">Showing verified MyCapital US PE/VC database (<strong className="text-emerald-400">3,000+ Total</strong>)</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {filteredInvestors.map((inv) => (
                  <Card key={inv.id} className="bg-[#0f0f1e] border-white/10 text-white p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px] border-emerald-500/30 font-mono">
                          {inv.id}
                        </Badge>
                        <Badge variant="outline" className="text-slate-300 border-white/10 text-[10px]">
                          {inv.type}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm">{inv.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">📍 {inv.location}</p>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={() => alert(`Connecting with ${inv.name} (${inv.id}) for deal syndication.`)}
                      className="border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5"
                    >
                      Connect →
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <FodFooter />
    </div>
  );
}
