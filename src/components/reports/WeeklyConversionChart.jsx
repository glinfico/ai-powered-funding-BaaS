import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from "recharts";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";

const fmt = (v) => {
  if (!v) return '$0';
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

export default function WeeklyConversionChart({ leads }) {
  const weeklyData = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(new Date(), 7 - i));
      const weekEnd = addWeeks(weekStart, 1);
      const weekLabel = format(weekStart, 'MMM d');

      const weekLeads = leads.filter(l => {
        const d = new Date(l.created_date);
        return d >= weekStart && d < weekEnd;
      });

      const newCount = weekLeads.length;
      const funded = weekLeads.filter(l => l.status === 'funded').length;
      const lost = weekLeads.filter(l => l.status === 'lost').length;
      const closed = funded + lost;
      const conversionRate = closed > 0 ? Math.round((funded / closed) * 100) : 0;
      const totalAmount = weekLeads.reduce((s, l) => s + (l.loan_amount || 0), 0);

      return { week: weekLabel, 'New Leads': newCount, Funded: funded, Lost: lost, 'Conv. Rate %': conversionRate, 'Loan Volume': totalAmount };
    });
  }, [leads]);

  const funnelData = useMemo(() => {
    const stages = [
      { key: 'new', label: 'New' },
      { key: 'contacted', label: 'Contacted' },
      { key: 'qualified', label: 'Qualified' },
      { key: 'proposal_sent', label: 'Proposal' },
      { key: 'negotiation', label: 'Negotiation' },
      { key: 'approved', label: 'Approved' },
      { key: 'funded', label: 'Funded' },
    ];
    const totalNew = leads.filter(l => true).length || 1;
    return stages.map(s => {
      const count = leads.filter(l => l.status === s.key).length;
      return { stage: s.label, Leads: count, Rate: Math.round((count / totalNew) * 100) };
    });
  }, [leads]);

  const totalOriginated = leads.reduce((s, l) => s + (l.loan_amount || 0), 0);
  const totalFunded = leads.filter(l => l.status === 'funded').length;
  const totalNew = leads.filter(l => l.status === 'new').length;
  const convRate = (totalFunded + leads.filter(l => l.status === 'lost').length) > 0
    ? Math.round((totalFunded / (totalFunded + leads.filter(l => l.status === 'lost').length)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "New → Funded Rate", value: `${convRate}%`, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Originated", value: fmt(totalOriginated), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Leads in 'New'", value: totalNew, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Funded", value: totalFunded, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((k, i) => (
          <div key={i} className={`${k.bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-600 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly New Leads & Funded */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Lead Intake vs. Funded — Last 8 Weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="New Leads" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Funded" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Conversion Rate + Loan Volume */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Conversion Rate (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="Conv. Rate %" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Loan Volume Originated</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="Loan Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Drop-off */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pipeline Funnel — New to Funded</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnelData.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 flex-shrink-0">{stage.stage}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-2 transition-all"
                    style={{ width: `${Math.max(stage.Rate, 2)}%`, background: i === funnelData.length - 1 ? '#10b981' : '#f59e0b' }}
                  >
                    <span className="text-xs font-semibold text-white">{stage.Leads}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-500 w-10 text-right">{stage.Rate}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}