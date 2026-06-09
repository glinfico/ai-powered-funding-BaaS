import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DollarSign, User, TrendingUp, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreLeadQuality } from "@/utils/leadScoring";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const stages = [
  { key: "new", label: "New", color: "bg-blue-500", light: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  { key: "contacted", label: "Contacted", color: "bg-purple-500", light: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  { key: "qualified", label: "Qualified", color: "bg-amber-500", light: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  { key: "proposal_sent", label: "Proposal", color: "bg-indigo-500", light: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-500", light: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  { key: "approved", label: "Approved", color: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  { key: "funded", label: "Funded", color: "bg-green-600", light: "bg-green-50 border-green-200", text: "text-green-700" },
];

const fmt = (v) => {
  if (!v) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const priorityDot = { urgent: "bg-red-500", high: "bg-amber-500", medium: "bg-blue-400", low: "bg-slate-300" };

function LeadCard({ lead, onClick, onMove, stages, currentStageIdx }) {
  const { score, grade, color, bg } = scoreLeadQuality(lead);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => onClick?.(lead)}
      className="bg-white rounded-xl p-3.5 border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all duration-150 cursor-pointer group relative"
    >
      {/* Score badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <h4 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors text-sm leading-tight truncate">
            {lead.first_name} {lead.last_name}
          </h4>
          {lead.company && <p className="text-xs text-slate-400 truncate mt-0.5">{lead.company}</p>}
        </div>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0", bg, color)}>
          {score} {grade}
        </span>
      </div>

      {/* Amount */}
      <div className="flex items-center gap-1.5 mb-2">
        <DollarSign className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        <span className="font-semibold text-slate-800 text-sm">{fmt(lead.loan_amount)}</span>
        {lead.loan_type && (
          <span className="text-xs text-slate-400 truncate">· {lead.loan_type.replace(/_/g, ' ')}</span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {lead.priority && (
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityDot[lead.priority] || "bg-slate-300")} title={lead.priority} />
          )}
          {lead.assigned_to && (
            <span className="text-xs text-slate-400 truncate max-w-[80px]">{lead.assigned_to}</span>
          )}
        </div>
        {/* Move to next stage button */}
        {currentStageIdx < stages.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onMove?.(lead, stages[currentStageIdx + 1].key); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-0.5 text-slate-400 hover:text-amber-600 font-medium"
            title={`Move to ${stages[currentStageIdx + 1].label}`}
          >
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {lead.credit_score_range && lead.credit_score_range !== 'unknown' && (
        <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-400">
          {lead.credit_score_range.replace(/_/g, ' ')}
        </div>
      )}
    </div>
  );
}

export default function PipelineBoard({ leads, onLeadClick, onStatusChange }) {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState("amount"); // "amount" | "score" | "date"
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const handleMove = async (lead, newStatus) => {
    await base44.entities.Lead.update(lead.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    onStatusChange?.(lead, newStatus);
  };

  const leadsByStage = useMemo(() => {
    const grouped = {};
    stages.forEach(stage => {
      let stageLeads = leads.filter(lead => lead.status === stage.key);
      if (sortBy === "amount") stageLeads = stageLeads.sort((a, b) => (b.loan_amount || 0) - (a.loan_amount || 0));
      else if (sortBy === "score") stageLeads = stageLeads.sort((a, b) => scoreLeadQuality(b).score - scoreLeadQuality(a).score);
      else if (sortBy === "date") stageLeads = stageLeads.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
      grouped[stage.key] = stageLeads;
    });
    return grouped;
  }, [leads, sortBy]);

  const stageValues = useMemo(() => {
    const values = {};
    stages.forEach(stage => {
      values[stage.key] = leadsByStage[stage.key].reduce((sum, lead) => sum + (lead.loan_amount || 0), 0);
    });
    return values;
  }, [leadsByStage]);

  const totalValue = useMemo(() => leads.reduce((s, l) => s + (l.loan_amount || 0), 0), [leads]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{leads.length} leads</span>
          <span>·</span>
          <span className="text-amber-600 font-semibold">{fmt(totalValue)} pipeline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Sort:</span>
          {[
            { key: "amount", label: "Amount" },
            { key: "score", label: "Score" },
            { key: "date", label: "Newest" },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg border transition-all",
                sortBy === s.key ? "bg-amber-100 border-amber-300 text-amber-700 font-semibold" : "border-slate-200 text-slate-500 hover:border-slate-300"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {stages.map((stage, stageIdx) => {
            const stageLeads = leadsByStage[stage.key];
            const isCollapsed = collapsed[stage.key];

            return (
              <div key={stage.key} className={cn("flex-shrink-0 transition-all", isCollapsed ? "w-16" : "w-64")}>
                {/* Column header */}
                <div
                  className={cn("rounded-xl border p-3 mb-2 cursor-pointer select-none", stage.light)}
                  onClick={() => toggleCollapse(stage.key)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", stage.color)} />
                      {!isCollapsed && (
                        <span className={cn("font-semibold text-sm truncate", stage.text)}>{stage.label}</span>
                      )}
                      <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/80", stage.text)}>
                        {stageLeads.length}
                      </span>
                    </div>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 flex-shrink-0 transition-transform", isCollapsed && "-rotate-90")} />
                  </div>
                  {!isCollapsed && stageLeads.length > 0 && (
                    <p className={cn("text-xs mt-1.5 font-medium", stage.text)}>{fmt(stageValues[stage.key])}</p>
                  )}
                </div>

                {/* Cards */}
                {!isCollapsed && (
                  <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-0.5">
                    {stageLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={onLeadClick}
                        onMove={handleMove}
                        stages={stages}
                        currentStageIdx={stageIdx}
                      />
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-slate-300 text-xs border border-dashed border-slate-200 rounded-xl">
                        Empty
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}