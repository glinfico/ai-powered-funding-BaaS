import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { DollarSign, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreLeadQuality } from "@/utils/leadScoring";

const stages = [
  { key: "new", label: "New", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-purple-500" },
  { key: "qualified", label: "Qualified", color: "bg-amber-500" },
  { key: "proposal_sent", label: "Proposal", color: "bg-indigo-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { key: "approved", label: "Approved", color: "bg-emerald-500" },
  { key: "funded", label: "Funded", color: "bg-green-600" },
];

const formatCurrency = (amount) => {
  if (!amount) return "$0";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

export default function PipelineBoard({ leads, onLeadClick, onStatusChange }) {
  const leadsByStage = useMemo(() => {
    const grouped = {};
    stages.forEach(stage => {
      grouped[stage.key] = leads.filter(lead => lead.status === stage.key);
    });
    return grouped;
  }, [leads]);

  const stageValues = useMemo(() => {
    const values = {};
    stages.forEach(stage => {
      values[stage.key] = leadsByStage[stage.key].reduce((sum, lead) => sum + (lead.loan_amount || 0), 0);
    });
    return values;
  }, [leadsByStage]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {stages.map(stage => (
          <div key={stage.key} className="w-72 flex-shrink-0">
            <div className="bg-slate-50 rounded-xl p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                  <h3 className="font-semibold text-slate-700">{stage.label}</h3>
                  <Badge variant="secondary" className="bg-white">
                    {leadsByStage[stage.key].length}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-slate-500 mb-4">
                {formatCurrency(stageValues[stage.key])} total value
              </div>

              <div className="space-y-3">
                {leadsByStage[stage.key].map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => onLeadClick?.(lead)}
                    className="bg-white rounded-lg p-4 border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900 group-hover:text-amber-700 transition-colors text-sm">
                        {lead.first_name} {lead.last_name}
                      </h4>
                      {(() => {
                        const { score, grade, color, bg } = scoreLeadQuality(lead);
                        return (
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", bg, color)}>
                            {score} {grade}
                          </span>
                        );
                      })()}
                    </div>
                    {lead.company && (
                      <p className="text-sm text-slate-500 mb-2 truncate">{lead.company}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-slate-700">{formatCurrency(lead.loan_amount)}</span>
                    </div>
                    {lead.assigned_to && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <User className="h-3 w-3" />
                        {lead.assigned_to}
                      </div>
                    )}
                  </div>
                ))}
                {leadsByStage[stage.key].length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}