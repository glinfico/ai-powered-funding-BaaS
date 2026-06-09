import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, DollarSign, TrendingUp, Clock, CheckCircle2, X, Pencil, Trash2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { triggerNewDealLeadSync } from "@/utils/automation";
import { calcCommission, suggestApprovedAmount } from "@/utils/commissionCalc";

const STAGES = [
  { value: "submitted", label: "Submitted", color: "bg-slate-100 text-slate-700" },
  { value: "under_review", label: "Under Review", color: "bg-blue-100 text-blue-700" },
  { value: "docs_requested", label: "Docs Requested", color: "bg-yellow-100 text-yellow-700" },
  { value: "docs_received", label: "Docs Received", color: "bg-orange-100 text-orange-700" },
  { value: "lender_matched", label: "Lender Matched", color: "bg-purple-100 text-purple-700" },
  { value: "term_sheet_sent", label: "Term Sheet Sent", color: "bg-indigo-100 text-indigo-700" },
  { value: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  { value: "funded", label: "Funded", color: "bg-green-100 text-green-700" },
  { value: "declined", label: "Declined", color: "bg-red-100 text-red-700" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-slate-100 text-slate-500" },
];

const LOAN_TYPES = [
  { value: "business_loan", label: "Business Loan" },
  { value: "equipment_financing", label: "Equipment Financing" },
  { value: "commercial_real_estate", label: "Commercial RE" },
  { value: "sba_loan", label: "SBA Loan" },
  { value: "line_of_credit", label: "Line of Credit" },
  { value: "invoice_factoring", label: "Invoice Factoring" },
  { value: "merchant_cash_advance", label: "MCA" },
  { value: "mca", label: "MCA (Alt)" },
  { value: "bridge_loan", label: "Bridge Loan" },
  { value: "other", label: "Other" },
];

const SOURCES = [
  { value: "direct", label: "Direct" },
  { value: "broker", label: "Broker" },
  { value: "lead_provider", label: "Lead Provider" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

const fmt = (v) => {
  if (!v) return "—";
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

const EMPTY_DEAL = {
  borrower_name: "", borrower_email: "", borrower_phone: "",
  loan_type: "business_loan", loan_amount: "", stage: "submitted",
  source: "direct", priority: "medium", industry: "", state: "",
  broker_name: "", lender_name: "", assigned_admin: "", notes: "",
  credit_score: "", annual_revenue: "", years_in_business: "", term_months: "", interest_rate: "",
};

function DealFormDialog({ open, onClose, onSubmit, deal, isLoading }) {
  const [form, setForm] = useState(EMPTY_DEAL);

  useState(() => { setForm(deal ? { ...EMPTY_DEAL, ...deal } : EMPTY_DEAL); }, [deal, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? "Edit Deal" : "New Deal"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 grid gap-1.5">
            <Label>Borrower Name *</Label>
            <Input value={form.borrower_name} onChange={e => set('borrower_name', e.target.value)} placeholder="Business or individual name" />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={form.borrower_email} onChange={e => set('borrower_email', e.target.value)} placeholder="borrower@email.com" />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={form.borrower_phone} onChange={e => set('borrower_phone', e.target.value)} placeholder="(555) 000-0000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Loan Type *</Label>
            <Select value={form.loan_type} onValueChange={v => set('loan_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LOAN_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Requested Amount *</Label>
            <Input type="number" value={form.loan_amount} onChange={e => set('loan_amount', e.target.value)} placeholder="500000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Stage</Label>
            <Select value={form.stage} onValueChange={v => set('stage', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={v => set('source', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={v => set('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Industry</Label>
            <Input value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="Restaurant, Construction..." />
          </div>
          <div className="grid gap-1.5">
            <Label>State</Label>
            <Input value={form.state} onChange={e => set('state', e.target.value)} placeholder="TX, CA, NY..." />
          </div>
          <div className="grid gap-1.5">
            <Label>Credit Score</Label>
            <Input type="number" value={form.credit_score} onChange={e => set('credit_score', e.target.value)} placeholder="680" />
          </div>
          <div className="grid gap-1.5">
            <Label>Annual Revenue</Label>
            <Input type="number" value={form.annual_revenue} onChange={e => set('annual_revenue', e.target.value)} placeholder="1200000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Yrs in Business</Label>
            <Input type="number" value={form.years_in_business} onChange={e => set('years_in_business', e.target.value)} placeholder="5" />
          </div>
          <div className="grid gap-1.5">
            <Label>Term (months)</Label>
            <Input type="number" value={form.term_months} onChange={e => set('term_months', e.target.value)} placeholder="60" />
          </div>
          <div className="grid gap-1.5">
            <Label>Broker Name</Label>
            <Input value={form.broker_name} onChange={e => set('broker_name', e.target.value)} placeholder="Submitting broker" />
          </div>
          <div className="grid gap-1.5">
            <Label>Assigned Admin</Label>
            <Input value={form.assigned_admin} onChange={e => set('assigned_admin', e.target.value)} placeholder="Team member" />
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Deal notes, special considerations..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSubmit({ ...form, loan_amount: Number(form.loan_amount) || 0, credit_score: Number(form.credit_score) || undefined, annual_revenue: Number(form.annual_revenue) || undefined, years_in_business: Number(form.years_in_business) || undefined, term_months: Number(form.term_months) || undefined })}
            disabled={!form.borrower_name || !form.loan_amount || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? "Saving..." : deal ? "Save Changes" : "Create Deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DealRow({ deal, onEdit, onDelete }) {
  const stage = STAGES.find(s => s.value === deal.stage) || STAGES[0];
  const loanType = LOAN_TYPES.find(t => t.value === deal.loan_type);
  const commission = calcCommission(deal);
  const suggested = suggestApprovedAmount(deal);

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900">{deal.borrower_name}</p>
          {deal.priority === 'urgent' && <span className="text-xs text-red-600 font-bold">URGENT</span>}
          {deal.broker_name && <span className="text-xs text-slate-400">via {deal.broker_name}</span>}
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{loanType?.label} · {deal.industry || deal.state || "—"}</p>
        {commission.amount > 0 && (
          <p className="text-xs text-amber-600 mt-0.5">
            Commission ({commission.label}): {fmt(commission.amount)} → PayPal at closing
          </p>
        )}
      </div>
      <div className="hidden md:block text-right w-32">
        <p className="font-bold text-slate-900">{fmt(deal.loan_amount)}</p>
        {deal.approved_amount
          ? <p className="text-xs text-green-600 font-medium">✓ Approved: {fmt(deal.approved_amount)}</p>
          : suggested
            ? <p className="text-xs text-blue-500">AI suggest: {fmt(suggested)}</p>
            : null}
      </div>
      <Badge className={cn("text-xs hidden sm:flex", stage.color)}>{stage.label}</Badge>
      <div className="text-xs text-slate-400 hidden lg:block w-20 text-right">
        {deal.created_date ? format(new Date(deal.created_date), 'MMM d') : "—"}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => onEdit(deal)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => onDelete(deal)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Deals() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Deal.create(d),
    onSuccess: (newDeal) => {
      triggerNewDealLeadSync(newDeal);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setFormOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Deal.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deals'] }); setFormOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Deal.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deals'] }); setDeleting(null); },
  });

  const filtered = useMemo(() => deals.filter(d => {
    const matchSearch = !search || `${d.borrower_name} ${d.broker_name} ${d.industry}`.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || d.stage === stageFilter;
    return matchSearch && matchStage;
  }), [deals, search, stageFilter]);

  const stats = useMemo(() => ({
    total: deals.length,
    active: deals.filter(d => !['funded','declined','withdrawn'].includes(d.stage)).length,
    funded: deals.filter(d => d.stage === 'funded').length,
    pipeline: deals.reduce((s, d) => s + (d.loan_amount || 0), 0),
    fundedVolume: deals.filter(d => d.stage === 'funded').reduce((s, d) => s + (d.approved_amount || d.loan_amount || 0), 0),
  }), [deals]);

  const handleSubmit = (data) => {
    // Auto-calculate approved amount from revenue if not manually set
    if (!data.approved_amount && data.annual_revenue) {
      data.approved_amount = suggestApprovedAmount(data);
    }
    // Auto-calculate commission
    const { amount: commAmount, rate: commRate } = calcCommission(data);
    data.commission_amount = commAmount;
    data.commission_rate = commRate * 100;

    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500 mt-1">Full application pipeline — broker, direct & lead provider submissions</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" /> New Deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Deals", value: stats.total, icon: ChevronRight, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Active", value: stats.active, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Funded", value: stats.funded, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pipeline", value: fmt(stats.pipeline), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Funded Vol.", value: fmt(stats.fundedVolume), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search deals, borrowers, brokers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || stageFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStageFilter('all'); }} className="text-slate-500">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Deal List */}
      <div className="space-y-2">
        {/* Header */}
        <div className="hidden md:flex items-center gap-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex-1">Borrower</div>
          <div className="w-28 text-right">Amount</div>
          <div className="w-28 hidden sm:block">Stage</div>
          <div className="w-20 hidden lg:block text-right">Date</div>
          <div className="w-16" />
        </div>
        {filtered.map(deal => (
          <DealRow key={deal.id} deal={deal} onEdit={(d) => { setEditing(d); setFormOpen(true); }} onDelete={setDeleting} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No deals yet</p>
            <p className="text-sm mt-1">Add your first deal or import from Leads</p>
          </div>
        )}
      </div>

      <DealFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit} deal={editing} isLoading={createMutation.isPending || updateMutation.isPending} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>Delete deal for <strong>{deleting?.borrower_name}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleting.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}