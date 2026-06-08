import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { TrendingUp, DollarSign, Users, Target, CheckCircle2, Clock } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import WeeklyConversionChart from "@/components/reports/WeeklyConversionChart";

const STATUS_LABELS = {
  new: "New", contacted: "Contacted", qualified: "Qualified",
  proposal_sent: "Proposal", negotiation: "Negotiation",
  approved: "Approved", funded: "Funded", lost: "Lost",
};

const LOAN_TYPE_LABELS = {
  business_loan: "Business", equipment_financing: "Equipment",
  commercial_real_estate: "CRE", sba_loan: "SBA",
  line_of_credit: "LOC", invoice_factoring: "Invoice",
  merchant_cash_advance: "MCA", other: "Other",
};

const SOURCE_LABELS = {
  website: "Website", referral: "Referral", cold_call: "Cold Call",
  partner: "Partner", social_media: "Social", email_campaign: "Email",
  trade_show: "Trade Show", other: "Other",
};

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#84cc16'];

const fmt = (v) => {
  if (!v) return '$0';
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

export default function Reports() {
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const stats = useMemo(() => {
    const total = leads.length;
    const funded = leads.filter(l => l.status === 'funded').length;
    const lost = leads.filter(l => l.status === 'lost').length;
    const totalValue = leads.reduce((s, l) => s + (l.loan_amount || 0), 0);
    const fundedValue = leads.filter(l => l.status === 'funded').reduce((s, l) => s + (l.loan_amount || 0), 0);
    const winRate = (funded + lost) > 0 ? Math.round((funded / (funded + lost)) * 100) : 0;
    const avgDeal = total > 0 ? totalValue / total : 0;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return { total, funded, lost, totalValue, fundedValue, winRate, avgDeal, pendingTasks, completedTasks };
  }, [leads, tasks]);

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
    return Object.entries(counts)
      .map(([k, v]) => ({ name: SOURCE_LABELS[k] || k, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [leads]);

  const loanTypeData = useMemo(() => {
    const data = {};
    leads.forEach(l => {
      if (l.loan_type) {
        if (!data[l.loan_type]) data[l.loan_type] = { count: 0, value: 0 };
        data[l.loan_type].count++;
        data[l.loan_type].value += (l.loan_amount || 0);
      }
    });
    return Object.entries(data)
      .map(([k, v]) => ({ name: LOAN_TYPE_LABELS[k] || k, Leads: v.count, Value: v.value }))
      .sort((a, b) => b.Leads - a.Leads);
  }, [leads]);

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const key = format(d, 'yyyy-MM');
      return {
        month: format(d, 'MMM'),
        'New Leads': leads.filter(l => l.created_date?.startsWith(key)).length,
        Funded: leads.filter(l => l.status === 'funded' && l.created_date?.startsWith(key)).length,
      };
    });
  }, [leads]);

  const conversionData = useMemo(() => {
    const stages = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'approved', 'funded'];
    return stages.map(s => ({
      stage: STATUS_LABELS[s],
      count: leads.filter(l => l.status === s || ['approved','funded'].includes(l.status) && stages.indexOf(l.status) >= stages.indexOf(s)).length,
    }));
  }, [leads]);

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Leads", value: stats.total, sub: "All time", Icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pipeline Value", value: fmt(stats.totalValue), sub: "Requested total", Icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Funded Value", value: fmt(stats.fundedValue), sub: "Closed & funded", Icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Win Rate", value: `${stats.winRate}%`, sub: "Funded / (Funded+Lost)", Icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Avg Deal Size", value: fmt(stats.avgDeal), sub: "Per lead", Icon: DollarSign, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Pending Tasks", value: stats.pendingTasks, sub: "Needs action", Icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-1">Pipeline analytics and performance metrics</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <WeeklyConversionChart leads={leads} />
        </TabsContent>

        <TabsContent value="overview">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${k.bg} mb-2`}>
                <k.Icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs font-medium text-slate-600">{k.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Leads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lead Sources</CardTitle>
          </CardHeader>
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
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600 text-xs">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900 text-xs">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">No source data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Volume — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="New Leads" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Funded" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Loan Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loanTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={loanTypeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="Leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-slate-400 text-sm">No loan type data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}