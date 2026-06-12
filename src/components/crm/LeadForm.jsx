import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";

const loanTypes = [
  { value: "business_loan", label: "Business Loan" },
  { value: "equipment_financing", label: "Equipment Financing" },
  { value: "commercial_real_estate", label: "Commercial Real Estate" },
  { value: "sba_loan", label: "SBA Loan" },
  { value: "line_of_credit", label: "Line of Credit" },
  { value: "invoice_factoring", label: "Invoice Factoring" },
  { value: "merchant_cash_advance", label: "Merchant Cash Advance" },
  { value: "other", label: "Other" },
];

const creditScoreRanges = [
  { value: "excellent_750+", label: "Excellent (750+)" },
  { value: "good_700-749", label: "Good (700-749)" },
  { value: "fair_650-699", label: "Fair (650-699)" },
  { value: "poor_below_650", label: "Poor (Below 650)" },
  { value: "unknown", label: "Unknown" },
];

const sources = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "cold_call", label: "Cold Call" },
  { value: "partner", label: "Partner" },
  { value: "social_media", label: "Social Media" },
  { value: "email_campaign", label: "Email Campaign" },
  { value: "trade_show", label: "Trade Show" },
  { value: "other", label: "Other" },
];

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

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function LeadForm({ open, onClose, onSubmit, lead, isLoading }) {
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team_members'],
    queryFn: () => base44.entities.TeamMember.filter({ status: 'active' }, 'full_name'),
  });
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    loan_type: "business_loan",
    loan_amount: "",
    credit_score_range: "unknown",
    annual_revenue: "",
    years_in_business: "",
    status: "new",
    source: "website",
    assigned_to: "",
    priority: "medium",
    notes: "",
    next_follow_up: "",
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        loan_type: lead.loan_type || "business_loan",
        loan_amount: lead.loan_amount || "",
        credit_score_range: lead.credit_score_range || "unknown",
        annual_revenue: lead.annual_revenue || "",
        years_in_business: lead.years_in_business || "",
        status: lead.status || "new",
        source: lead.source || "website",
        assigned_to: lead.assigned_to || "",
        priority: lead.priority || "medium",
        notes: lead.notes || "",
        next_follow_up: lead.next_follow_up || "",
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        company: "",
        loan_type: "business_loan",
        loan_amount: "",
        credit_score_range: "unknown",
        annual_revenue: "",
        years_in_business: "",
        status: "new",
        source: "website",
        assigned_to: "",
        priority: "medium",
        notes: "",
        next_follow_up: "",
      });
    }
  }, [lead, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      loan_amount: formData.loan_amount ? parseFloat(formData.loan_amount) : null,
      annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
      years_in_business: formData.years_in_business ? parseFloat(formData.years_in_business) : null,
    };
    onSubmit(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {lead ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="ABC Corporation"
              />
            </div>
          </div>

          {/* Loan Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Loan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loan_type">Loan Type *</Label>
                <Select value={formData.loan_type} onValueChange={(v) => handleChange("loan_type", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loan_amount">Loan Amount</Label>
                <Input
                  id="loan_amount"
                  type="number"
                  value={formData.loan_amount}
                  onChange={(e) => handleChange("loan_amount", e.target.value)}
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_score_range">Credit Score</Label>
                <Select value={formData.credit_score_range} onValueChange={(v) => handleChange("credit_score_range", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {creditScoreRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_revenue">Annual Revenue</Label>
                <Input
                  id="annual_revenue"
                  type="number"
                  value={formData.annual_revenue}
                  onChange={(e) => handleChange("annual_revenue", e.target.value)}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_in_business">Years in Business</Label>
                <Input
                  id="years_in_business"
                  type="number"
                  value={formData.years_in_business}
                  onChange={(e) => handleChange("years_in_business", e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Lead Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Lead Management</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(v) => handleChange("source", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => handleChange("priority", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select value={formData.assigned_to || "__unassigned__"} onValueChange={(v) => handleChange("assigned_to", v === "__unassigned__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">— Unassigned —</SelectItem>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.full_name}>{m.full_name} ({m.role?.replace(/_/g, ' ')})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_follow_up">Next Follow-up</Label>
                <Input
                  id="next_follow_up"
                  type="date"
                  value={formData.next_follow_up}
                  onChange={(e) => handleChange("next_follow_up", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about this lead..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {lead ? "Update Lead" : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}