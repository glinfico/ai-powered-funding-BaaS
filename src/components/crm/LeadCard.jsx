import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Building2, DollarSign, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import LeadScoreBadge from "@/components/crm/LeadScorebadge";

const statusColors = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-purple-50 text-purple-700 border-purple-200",
  qualified: "bg-amber-50 text-amber-700 border-amber-200",
  proposal_sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  negotiation: "bg-orange-50 text-orange-700 border-orange-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  funded: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-slate-50 text-slate-500 border-slate-200",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function LeadCard({ lead, onClick, onEdit, onDelete }) {
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const loanTypeLabels = {
    business_loan: "Business Loan",
    equipment_financing: "Equipment Financing",
    commercial_real_estate: "Commercial RE",
    sba_loan: "SBA Loan",
    line_of_credit: "Line of Credit",
    invoice_factoring: "Invoice Factoring",
    merchant_cash_advance: "MCA",
    other: "Other",
  };

  return (
    <div 
      className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-lg hover:border-amber-200/50 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick?.(lead)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
              {lead.first_name} {lead.last_name}
            </h3>
            <Badge className={cn("text-xs border", priorityColors[lead.priority || 'medium'])}>
              {lead.priority || 'medium'}
            </Badge>
          </div>
          {lead.company && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Building2 className="h-3.5 w-3.5" />
              {lead.company}
            </div>
          )}
        </div>
        <LeadScoreBadge lead={lead} size="sm" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(lead); }}>Edit Lead</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(lead); }} className="text-red-600">Delete Lead</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <DollarSign className="h-4 w-4 text-amber-500" />
            <span className="font-medium">{formatCurrency(lead.loan_amount)}</span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">{loanTypeLabels[lead.loan_type] || lead.loan_type}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {lead.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate max-w-[140px]">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <Badge className={cn("text-xs border", statusColors[lead.status])}>
          {lead.status?.replace(/_/g, ' ')}
        </Badge>
        {lead.assigned_to && (
          <span className="text-xs text-slate-400">Assigned: {lead.assigned_to}</span>
        )}
      </div>
    </div>
  );
}