import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, X, CheckSquare } from "lucide-react";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "approved", label: "Approved" },
  { value: "funded", label: "Funded" },
  { value: "lost", label: "Lost" },
];

export default function BulkActionsBar({ count, onStatusChange, onDelete, onClear }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex-wrap">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <CheckSquare className="h-4 w-4" />
        {count} lead{count !== 1 ? "s" : ""} selected
      </div>
      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="w-44 h-8 text-sm border-amber-300 bg-white">
            <SelectValue placeholder="Change status…" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="border-red-300 text-red-600 hover:bg-red-50 h-8"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-slate-500" onClick={onClear}>
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
}