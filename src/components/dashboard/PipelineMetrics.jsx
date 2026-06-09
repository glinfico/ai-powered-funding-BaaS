import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const STAGE_ORDER = [
  { id: "submitted", label: "Submitted", color: "#94a3b8" },
  { id: "under_review", label: "Under Review", color: "#3b82f6" },
  { id: "docs_requested", label: "Docs Requested", color: "#f59e0b" },
  { id: "docs_received", label: "Docs Received", color: "#f97316" },
  { id: "lender_matched", label: "Lender Matched", color: "#8b5cf6" },
  { id: "term_sheet_sent", label: "Term Sheet", color: "#6366f1" },
  { id: "approved", label: "Approved", color: "#10b981" },
  { id: "funded", label: "Funded", color: "#059669" },
];

const fmt = (v) => {
  if (!v) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

function hoursAgo(isoDate) {
  if (!isoDate) return 0;
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

export default function PipelineMetrics({ deals = [] }) {
  const stageData = useMemo(() => {
    return STAGE_ORDER.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage.id);
      return {
        ...stage,
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + (d.loan_amount || 0), 0),
      };
    }).filter(s => s.count > 0);
  }, [deals]);

  const velocityData = useMemo(() => {
    // Avg hours stuck per stage (from active deals only)
    const active = deals.filter(d => !['funded','declined','withdrawn'].includes(d.stage));
    const byStage = {};
    active.forEach(d => {
      if (!byStage[d.stage]) byStage[d.stage] = [];
      byStage[d.stage].push(hoursAgo(d.updated_date || d.created_date));
    });
    return STAGE_ORDER
      .filter(s => byStage[s.id])
      .map(s => ({
        name: s.label.split(' ')[0],
        avg_hours: Math.round(byStage[s.id].reduce((a, b) => a + b, 0) / byStage[s.id].length),
        color: s.color,
      }));
  }, [deals]);

  const alerts = useMemo(() => {
    const stalled = deals.filter(d =>
      d.stage === 'lender_matched' && hoursAgo(d.updated_date || d.created_date) >= 24
    );
    const overdue_docs = deals.filter(d =>
      d.stage === 'docs_requested' && hoursAgo(d.updated_date || d.created_date) >= 72
    );
    const high_value_pending = deals.filter(d =>
      !['funded','declined','withdrawn'].includes(d.stage) && (d.loan_amount || 0) >= 500_000
    );
    return { stalled, overdue_docs, high_value_pending };
  }, [deals]);

  const conversionRate = useMemo(() => {
    const total = deals.filter(d => !['withdrawn'].includes(d.stage)).length;
    const funded = deals.filter(d => d.stage === 'funded').length;
    return total > 0 ? ((funded / total) * 100).toFixed(1) : 0;
  }, [deals]);

  return (
    <div className="space-y-6">
      {/* Alert row */}
      {(alerts.stalled.length > 0 || alerts.overdue_docs.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {alerts.stalled.length > 0 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">{alerts.stalled.length} Lender{alerts.stalled.length !== 1 ? 's' : ''} Unresponsive</p>
                <p className="text-amber-600 text-xs mt-0.5">Matched &gt;24h ago, no move — auto-reassign engine running</p>
              </div>
            </div>
          )}
          {alerts.overdue_docs.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <Clock className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">{alerts.overdue_docs.length} Docs Overdue</p>
                <p className="text-red-600 text-xs mt-0.5">Documents requested &gt;72h ago</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800 text-sm">{conversionRate}% Conversion</p>
              <p className="text-emerald-600 text-xs mt-0.5">{alerts.high_value_pending.length} high-value deals active</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Count by Stage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    formatter={(val, name) => [
                      name === 'count' ? `${val} deals` : fmt(val),
                      name === 'count' ? 'Deals' : 'Volume'
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stageData.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Stage value summary */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {stageData.slice(0, 4).map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-500 truncate">{s.label}</span>
                  <span className="font-medium text-slate-700 ml-auto">{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Avg. Time Stuck per Stage (Velocity) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Avg. Hours Stuck per Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {velocityData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No active deals to measure</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="h" />
                    <Tooltip formatter={(v) => [`${v}h avg`, 'Time in Stage']} />
                    <Bar dataKey="avg_hours" radius={[4, 4, 0, 0]}>
                      {velocityData.map((s, i) => (
                        <Cell key={i} fill={s.avg_hours > 48 ? '#ef4444' : s.avg_hours > 24 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />On track &nbsp;
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />&gt;24h &nbsp;
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />&gt;48h
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}