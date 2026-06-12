import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Building2, DollarSign, Calendar, User, Edit, X } from "lucide-react";
import { format } from "date-fns";
import ActivityTimeline from "./ActivityTimeline";
import AddActivityForm from "./AddActivityForm";
import LeadScorePanel from "./LeadScorePanel";
import { cn } from "@/lib/utils";

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

const statuses = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "approved", label: "Approved" },
  { value: "funded", label: "Funded" },
  { value: "lost", label: "Lost" },
];

const loanTypeLabels = {
  business_loan: "Business Loan",
  equipment_financing: "Equipment Financing",
  commercial_real_estate: "Commercial Real Estate",
  sba_loan: "SBA Loan",
  line_of_credit: "Line of Credit",
  invoice_factoring: "Invoice Factoring",
  merchant_cash_advance: "Merchant Cash Advance",
  other: "Other",
};

export default function LeadDetailPanel({ lead, open, onClose, onEdit }) {
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team_members'],
    queryFn: () => base44.entities.TeamMember.filter({ status: 'active' }, 'full_name'),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', lead?.id],
    queryFn: () => base44.entities.Activity.filter({ lead_id: lead.id }, '-created_date'),
    enabled: !!lead?.id,
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: (activityData) => base44.entities.Activity.create({ ...activityData, lead_id: lead.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', lead.id] });
    },
  });

  const handleStatusChange = (newStatus) => {
    if (lead) {
      updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } });
      // Also log the status change as an activity
      addActivityMutation.mutate({
        type: "status_change",
        description: `Status changed to ${newStatus.replace(/_/g, ' ')}`,
      });
    }
  };

  const handleAddActivity = (activityData) => {
    addActivityMutation.mutate(activityData);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold text-slate-900">
                {lead.first_name} {lead.last_name}
              </SheetTitle>
              {lead.company && (
                <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                  <Building2 className="h-4 w-4" />
                  {lead.company}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit?.(lead)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Select value={lead.status} onValueChange={handleStatusChange}>
              <SelectTrigger className={cn("w-44 border", statusColors[lead.status])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <a href={`mailto:${lead.email}`} className="text-sm font-medium text-amber-600 hover:underline">
                  {lead.email}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Phone className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <a href={`tel:${lead.phone}`} className="text-sm font-medium text-amber-600 hover:underline">
                  {lead.phone || "N/A"}
                </a>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Loan Type</p>
                <p className="font-medium text-slate-800">{loanTypeLabels[lead.loan_type] || lead.loan_type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Amount Requested</p>
                <p className="font-bold text-xl text-amber-700">{formatCurrency(lead.loan_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Credit Score</p>
                <p className="font-medium text-slate-800">{lead.credit_score_range?.replace(/_/g, ' ') || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Annual Revenue</p>
                <p className="font-medium text-slate-800">{formatCurrency(lead.annual_revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Years in Business</p>
                <p className="font-medium text-slate-800">{lead.years_in_business || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Lead Source</p>
                <p className="font-medium text-slate-800 capitalize">{lead.source?.replace(/_/g, ' ') || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Assignment & Follow-up */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Assigned To</p>
                <Select
                  value={lead.assigned_to || "__unassigned__"}
                  onValueChange={(v) => updateLeadMutation.mutate({ id: lead.id, data: { assigned_to: v === "__unassigned__" ? "" : v } })}
                >
                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 focus:ring-0 shadow-none font-medium">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">— Unassigned —</SelectItem>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.full_name}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Next Follow-up</p>
                <p className="text-sm font-medium">
                  {lead.next_follow_up ? format(new Date(lead.next_follow_up), "MMM d, yyyy") : "Not scheduled"}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Notes</h3>
              <p className="text-sm text-slate-600">{lead.notes}</p>
            </div>
          )}

          {/* Activities + Score */}
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="activities" className="flex-1">Activity Log</TabsTrigger>
              <TabsTrigger value="score" className="flex-1">Lead Score</TabsTrigger>
              <TabsTrigger value="add" className="flex-1">Add Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="score" className="mt-4">
              <LeadScorePanel lead={lead} />
            </TabsContent>
            <TabsContent value="activities" className="mt-4">
              <ActivityTimeline activities={activities} />
            </TabsContent>
            <TabsContent value="add" className="mt-4">
              <AddActivityForm onSubmit={handleAddActivity} isLoading={addActivityMutation.isPending} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}