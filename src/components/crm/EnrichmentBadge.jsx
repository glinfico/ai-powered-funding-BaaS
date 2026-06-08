import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, ShieldCheck, ShieldAlert, Brain, AlertTriangle } from "lucide-react";

const fmt = (v) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;

export default function EnrichmentBadge({ lead, compact = false }) {
  const ddScore = lead.due_diligence_score;
  const enrichStatus = lead.enrichment_status;
  const ddStatus = lead.due_diligence_status;

  if (!enrichStatus || enrichStatus === 'not_started') return null;

  if (enrichStatus === 'pending' || ddStatus === 'pending') {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-blue-200 text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        {compact ? 'Analyzing...' : 'AI Analysis Running...'}
      </Badge>
    );
  }

  if (enrichStatus === 'failed') {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-red-200 text-red-500">
        <AlertTriangle className="h-3 w-3" />
        Enrichment Failed
      </Badge>
    );
  }

  // Completed
  const ddColor = ddScore >= 75 ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
    : ddScore >= 50 ? 'text-amber-700 border-amber-200 bg-amber-50'
    : ddScore != null ? 'text-red-700 border-red-200 bg-red-50'
    : 'text-blue-700 border-blue-200 bg-blue-50';

  const tooltipContent = [
    ddScore != null && `DD Score: ${ddScore}/100`,
    lead.credit_idq_score != null && `Credit: ${lead.credit_idq_score}/100`,
    lead.verified_annual_revenue && `Rev Est: ${fmt(lead.verified_annual_revenue)}`,
    lead.property_estimated_value && `Prop Value: ${fmt(lead.property_estimated_value)}`,
    lead.property_ltv != null && `LTV: ${lead.property_ltv.toFixed(1)}%`,
  ].filter(Boolean).join(' · ');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs gap-1 cursor-default ${ddColor}`}>
            {ddScore >= 75 ? <ShieldCheck className="h-3 w-3" /> : ddScore != null ? <ShieldAlert className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
            {compact
              ? (ddScore != null ? `DD ${ddScore}` : 'Enriched')
              : (ddScore != null ? `DD Score: ${ddScore}/100` : 'AI Enriched ✓')}
          </Badge>
        </TooltipTrigger>
        {tooltipContent && (
          <TooltipContent>
            <p className="text-xs">{tooltipContent}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}