import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, TrendingUp, Target, Clock, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatCard from "@/components/crm/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PipelineMetrics from "@/components/dashboard/PipelineMetrics";
import EnginesStatus from "@/components/dashboard/EnginesStatus";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];

const statusLabels = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  approved: "Approved",
  funded: "Funded",
  lost: "Lost",
};

export default function Dashboard() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals-dashboard'],
    queryFn: () => base44.entities.Deal.list('-updated_date', 500),
  });

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const totalPipelineValue = leads.reduce((sum, lead) => sum + (lead.loan_amount || 0), 0);
    const fundedLeads = leads.filter(l => l.status === 'funded');
    const fundedValue = fundedLeads.reduce((sum, lead) => sum + (lead.loan_amount || 0), 0);
    const activeLeads = leads.filter(l => !['funded', 'lost'].includes(l.status)).length;
    const conversionRate = totalLeads > 0 ? ((fundedLeads.length / totalLeads) * 100).toFixed(1) : 0;

    return { totalLeads, totalPipelineValue, fundedValue, activeLeads, conversionRate, fundedLeads: fundedLeads.length };
  }, [leads]);

  const statusDistribution = useMemo(() => {
    const distribution = {};
    leads.forEach(lead => {
      distribution[lead.status] = (distribution[lead.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: statusLabels[name] || name,
      value,
    }));
  }, [leads]);

  const loanTypeDistribution = useMemo(() => {
    const distribution = {};
    leads.forEach(lead => {
      if (lead.loan_type) {
        distribution[lead.loan_type] = (distribution[lead.loan_type] || 0) + (lead.loan_amount || 0);
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [leads]);

  const recentLeads = useMemo(() => {
    return leads.slice(0, 5);
  }, [leads]);

  const upcomingFollowUps = useMemo(() => {
    return leads
      .filter(l => l.next_follow_up && new Date(l.next_follow_up) >= new Date())
      .sort((a, b) => new Date(a.next_follow_up) - new Date(b.next_follow_up))
      .slice(0, 5);
  }, [leads]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your lending pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={Users}
          bgColor="bg-amber-500"
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(stats.totalPipelineValue)}
          icon={DollarSign}
          bgColor="bg-blue-500"
        />
        <StatCard
          title="Funded Value"
          value={formatCurrency(stats.fundedValue)}
          subtitle={`${stats.fundedLeads} deals`}
          icon={CheckCircle2}
          bgColor="bg-emerald-500"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          icon={Target}
          bgColor="bg-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Loan Type Value */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Value by Loan Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loanTypeDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-slate-600 capitalize truncate">{item.name}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${(item.value / loanTypeDistribution[0].value) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                  <div className="w-24 text-sm font-medium text-right">{formatCurrency(item.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Metrics */}
      <PipelineMetrics deals={deals} />

      {/* Engines Status */}
      <EnginesStatus />

      {/* Recent & Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                    <p className="text-sm text-slate-500">{lead.company || lead.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-600">{formatCurrency(lead.loan_amount)}</p>
                    <Badge variant="secondary" className="text-xs">{statusLabels[lead.status]}</Badge>
                  </div>
                </div>
              ))}
              {recentLeads.length === 0 && (
                <p className="text-center text-slate-400 py-8">No leads yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Upcoming Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingFollowUps.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                    <p className="text-sm text-slate-500">{lead.company || lead.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-600">
                      {format(new Date(lead.next_follow_up), "MMM d")}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(lead.next_follow_up), "EEEE")}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingFollowUps.length === 0 && (
                <p className="text-center text-slate-400 py-8">No upcoming follow-ups</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}