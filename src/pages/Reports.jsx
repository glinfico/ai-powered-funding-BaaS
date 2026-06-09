import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, FunnelChart, Funnel, LabelList
} from "recharts";
import { TrendingUp, DollarSign, Users, Target, CheckCircle2, Clock, AlertTriangle, Star, BarChart2 } from "lucide-react";
import { format, subMonths } from "date-fns";
import WeeklyConversionChart from "@/components/reports/WeeklyConversionChart";

const STATUS_LABELS = { new: "New", contacted: "Contacted", qualified: "Qualified", proposal_sent: "Proposal", negotiation: "Negotiation", approved: "Approved", funded: "Funded", lost: "Lost" };
const LOAN_TYPE_LABELS = { business_loan: "Business", equipment_financing: "Equipment", commercial_real_estate: "CRE", sba_loan: "SBA", line_of_credit: "LOC", invoice_factoring: "Invoice", merchant_cash_advance: "MCA", other: "Other" };
const SOURCE_LABELS = { website: "Website", referral: "Referral", cold_call: "Cold Call", partner: "Partner", social_media: "Social", email_campaign: "Email", trade_show: "Trade Show", other: "Other" };
const CREDIT_LABELS = { "excellent_750+": "750+", "good_700-749": "700-749", "fair_650-699": "650-699", "poor_below_650": "<650", unknown: "Unknown" };
const PRIORITY_COLORS = { urgent: "#ef4444", high: "#f59e0b", medium: "#3b82f6", low: "#94a3b8" };
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#84cc16'];

const fmt = (v) => {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

function KpiCard({ label, value, sub, Icon, color, bg }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-600">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const [dateRange, setDateRange] = useState("all");

  const { data: allLeads = [], isLoading } = useQuery({
    queryKey: ['leads-reports'],
    queryFn: () => base44.entities.Lead.list('-created_date', 2000),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals-reports'],
    queryFn: () => base44.entities.Deal.list('-created_date', 500),
  });

  // Date range filter
  const leads = useMemo(() => {
    if (dateRange === "all") return allLeads;
    const months = parseInt(dateRange);
    const cutoff = subMonths(new Date(), months).toISOString();
    return allLeads.filter(l => (l.created_date || '') >= cutoff);
  }, [allLeads, dateRange]);

  const stats = useMemo(() => {
    const total = leads.length;
    const funded = leads.filter(l => l.status === 'funded').length;
    const lost = leads.filter(l => l.status === 'lost').length;
    const active = leads.filter(l => !['funded', 'lost'].includes(l.status)).length;
    const totalValue = leads.reduce((s, l) => s + (l.loan_amount || 0), 0);
    const fundedValue = leads.filter(l => l.status === 'funded').reduce((s, l) => s + (l.loan_amount || 0), 0);
    const winRate = (funded + lost) > 0 ? Math.round((funded / (funded + lost)) * 100) : 0;
    const avgDeal = total > 0 ? totalValue / total : 0;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = tasks.filter(t => t.status === 'pending' && t.due_date && t.due_date < new Date().toISOString().split('T')[0]).length;
    const dealsFunded = deals.filter(d => d.stage === 'funded').length;
    const dealsPipeline = deals.filter(d => !['funded', 'declined', 'withdrawn'].includes(d.stage)).length;
    return { total, funded, lost, active, totalValue, fundedValue, winRate, avgDeal, pendingTasks, overdueTasks, dealsFunded, dealsPipeline };
  }, [leads, tasks, deals]);

  const pipelineData = useMemo(() => {
    const order = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'approved', 'funded', 'lost'];
    return order.map(s => ({
      name: STATUS_LABELS[s],
      Leads: leads.filter(l => l.status === s).length,
      Value: leads.filter(l => l.status === s).reduce((sum, l) => sum + (l.loan_amount || 0), 0),
    }));
  }, [leads]);

  const sourceData = useMemo(() => {
    const counts = {};
    leads.forEach(l => { if (l.source) counts[l.source] = (counts[l.source] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: SOURCE_LABELS[k] || k, value: v })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const loanTypeData = useMemo(() => {
    const data = {};
    leads.forEach(l => {
      if (l.loan_type) {
        if (!data[l.loan_type]) data[l.loan_type] = { count: 0, value: 0, funded: 0 };
        data[l.loan_type].count++;
        data[l.loan_type].value += (l.loan_amount || 0);
        if (l.status === 'funded') data[l.loan_type].funded++;
      }
    });
    return Object.entries(data).map(([k, v]) => ({
      name: LOAN_TYPE_LABELS[k] || k,
      Leads: v.count,
      Value: v.value,
      WinRate: v.count > 0 ? Math.round((v.funded / v.count) * 100) : 0,
    })).sort((a, b) => b.Leads - a.Leads);
  }, [leads]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), 11 - i);
      const key = format(d, 'yyyy-MM');
      return {
        month: format(d, 'MMM'),
        'New': leads.filter(l => l.created_date?.startsWith(key)).length,
        'Funded': leads.filter(l => l.status === 'funded' && l.created_date?.startsWith(key)).length,
      };
    });
  }, [leads]);

  const creditDistData = useMemo(() => {
    const order = ['excellent_750+', 'good_700-749', 'fair_650-699', 'poor_below_650', 'unknown'];
    return order.map(k => ({
      name: CREDIT_LABELS[k],
      count: leads.filter(l => l.credit_score_range === k).length,
      value: leads.filter(l => l.credit_score_range === k).reduce((s, l) => s + (l.loan_amount || 0), 0),
    })).filter(d => d.count > 0);
  }, [leads]);

  const priorityData = useMemo(() => {
    return ['urgent', 'high', 'medium', 'low'].map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      count: leads.filter(l => l.priority === p).length,
      value: leads.filter(l => l.priority === p).reduce((s, l) => s + (l.loan_amount || 0), 0),
      fill: PRIORITY_COLORS[p],
    })).filter(d => d.count > 0);
  }, [leads]);

  const topAssignees = useMemo(() => {
    const data = {};
    leads.forEach(l => {
      if (!l.assigned_to) return;
      if (!data[l.assigned_to]) data[l.assigned_to] = { leads: 0, funded: 0, value: 0 };
      data[l.assigned_to].leads++;
      if (l.status === 'funded') data[l.assigned_to].funded++;
      data[l.assigned_to].value += (l.loan_amount || 0);
    });
    return Object.entries(data)
      .map(([name, d]) => ({ name, ...d, rate: d.leads > 0 ? Math.round((d.funded / d.leads) * 100) : 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [leads]);

  // Velocity: funnel stages with drop-off
  const funnelData = useMemo(() => {
    const stages = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'approved', 'funded'];
    return stages.map(s => {
      const count = leads.filter(l => {
        const stageOrder = stages.indexOf(l.status);
        return stageOrder >= stages.indexOf(s);
      }).length;
      return { name: STATUS_LABELS[s], value: count };
    });
  }, [leads]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const kpis = [
    { label: "Total Leads", value: stats.total, sub: "All time", Icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pipeline Value", value: fmt(stats.totalValue), sub: "Requested total", Icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Funded Value", value: fmt(stats.fundedValue), sub: "Closed & funded", Icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Win Rate", value: `${stats.winRate}%`, sub: "Funded / (Funded+Lost)", Icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Avg Deal Size", value: fmt(stats.avgDeal), sub: "Per lead", Icon: DollarSign, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Overdue Tasks", value: stats.overdueTasks, sub: `${stats.pendingTasks} total pending`, Icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lead Reports</h1>
          <p className="text-slate-500 mt-1">Pipeline analytics, conversion intelligence, and performance metrics</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1">Last Month</SelectItem>
            <SelectItem value="3">Last 3 Months</SelectItem>
            <SelectItem value="6">Last 6 Months</SelectItem>
            <SelectItem value="12">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Pipeline Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [n === 'Value' ? fmt(v) : v, n]} />
                    <Bar dataKey="Leads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Volume — 12 Months</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="New" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Funded" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Lead Sources</CardTitle></CardHeader>
              <CardContent>
                {sourceData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                          {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {sourceData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-slate-600 text-xs">{item.name}</span>
                          </div>
                          <span className="font-semibold text-slate-900 text-xs">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="text-center py-10 text-slate-400 text-sm">No source data yet</div>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Loan Type Breakdown</CardTitle></CardHeader>
              <CardContent>
                {loanTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={loanTypeData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={58} />
                      <Tooltip />
                      <Bar dataKey="Leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="text-center py-10 text-slate-400 text-sm">No data yet</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── FUNNEL ── */}
        <TabsContent value="funnel" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 mt-2">
                  {funnelData.map((stage, i) => {
                    const pct = funnelData[0].value > 0 ? Math.round((stage.value / funnelData[0].value) * 100) : 0;
                    const dropOff = i > 0 && funnelData[i - 1].value > 0
                      ? Math.round(((funnelData[i - 1].value - stage.value) / funnelData[i - 1].value) * 100) : 0;
                    return (
                      <div key={stage.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 font-medium">{stage.name}</span>
                          <div className="flex items-center gap-3 text-xs">
                            {i > 0 && dropOff > 0 && (
                              <span className="text-red-500">-{dropOff}% drop</span>
                            )}
                            <span className="font-semibold text-slate-800">{stage.value}</span>
                            <span className="text-slate-400 w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: `hsl(${160 - i * 20}, 70%, ${45 + i * 3}%)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Credit Score Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={creditDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [n === 'value' ? fmt(v) : v, n === 'value' ? 'Total Value' : 'Lead Count']} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Priority Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {priorityData.map(p => (
                  <div key={p.name} className="text-center p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: p.fill }} />
                    <p className="font-bold text-slate-900 text-xl">{p.count}</p>
                    <p className="text-sm font-medium text-slate-600">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{fmt(p.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── BREAKDOWN ── */}
        <TabsContent value="breakdown" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Loan Type Win Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loanTypeData.map(lt => (
                  <div key={lt.name} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-slate-600 font-medium">{lt.name}</div>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${lt.WinRate}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-semibold text-slate-700">{lt.WinRate}%</span>
                    </div>
                    <div className="w-20 text-right text-xs text-slate-400">{lt.Leads} leads · {fmt(lt.Value)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Pipeline Value by Stage</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v) => [fmt(v), 'Value']} />
                    <Bar dataKey="Value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Credit Score vs. Volume</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={creditDistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v) => [fmt(v), 'Value']} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Loan Value" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TEAM ── */}
        <TabsContent value="team" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Top Performers by Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topAssignees.length > 0 ? (
                <div className="space-y-3">
                  {topAssignees.map((a, i) => (
                    <div key={a.name} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{a.name}</p>
                        <p className="text-xs text-slate-400">{a.leads} leads · {a.funded} funded · {a.rate}% win rate</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-amber-600">{fmt(a.value)}</p>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((a.value / topAssignees[0].value) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-10">No assigned leads yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WEEKLY ── */}
        <TabsContent value="weekly">
          <WeeklyConversionChart leads={leads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}