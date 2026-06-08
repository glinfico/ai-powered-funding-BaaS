import { scoreLeadQuality } from "@/utils/leadScoring";
import { cn } from "@/lib/utils";

export default function LeadScoreBadge({ lead, size = "sm" }) {
  const { score, grade, color, bg, ring } = scoreLeadQuality(lead);

  if (size === "lg") {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl p-4 ring-2", bg, ring)}>
        <div className="text-center">
          <div className={cn("text-4xl font-black", color)}>{score}</div>
          <div className="text-xs text-slate-400 font-medium">/ 100</div>
        </div>
        <div>
          <div className={cn("text-2xl font-black", color)}>Grade {grade}</div>
          <div className="text-xs text-slate-500">Lead Quality Score</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ring-1", bg, color, ring)}>
      <span>{score}</span>
      <span className="opacity-60">/100</span>
      <span className="ml-0.5 font-black">{grade}</span>
    </div>
  );
}