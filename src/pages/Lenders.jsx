import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Building2, Star, X, Pencil, Trash2, Globe, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

// Category groupings
const CATEGORIES = {
  mca: { label: "MCA", types: ["mca_provider"], color: "bg-orange-100 text-orange-700" },
  cre: { label: "CRE", types: ["cre_lender", "hard_money"], color: "bg-blue-100 text-blue-700" },
  sba: { label: "SBA / Bank", types: ["bank", "credit_union", "sba_lender"], color: "bg-emerald-100 text-emerald-700" },
  equipment: { label: "Equipment", types: ["equipment_lender"], color: "bg-purple-100 text-purple-700" },
  other: { label: "Private / Other", types: ["private_lender", "other"], color: "bg-slate-100 text-slate-600" },
};

const LENDER_TYPES = [
  { value: "bank", label: "Bank" },
  { value: "credit_union", label: "Credit Union" },
  { value: "private_lender", label: "Private Lender" },
  { value: "hard_money", label: "Hard Money" },
  { value: "mca_provider", label: "MCA Provider" },
  { value: "sba_lender", label: "SBA Lender" },
  { value: "equipment_lender", label: "Equipment Lender" },
  { value: "cre_lender", label: "CRE Lender" },
  { value: "other", label: "Other" },
];

const LOAN_TYPE_OPTIONS = [
  "Business Loan", "Equipment Financing", "Commercial RE", "SBA Loan",
  "Line of Credit", "Invoice Factoring", "MCA", "Bridge Loan",
];

const fmt = (v) => {
  if (!v) return "—";
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

const EMPTY_LENDER = {
  name: "", contact_name: "", email: "", phone: "", website: "",
  status: "active", lender_type: "private_lender",
  min_loan_amount: "", max_loan_amount: "", min_credit_score: "",
  typical_rate_min: "", typical_rate_max: "", typical_term_months: "",
  funding_speed_days: "", industries_served: "", notes: "", rating: 5,
  loan_types: [], states_licensed: [],
};

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={cn("h-3.5 w-3.5", i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
      ))}
    </div>
  );
}

function LenderFormDialog({ open, onClose, onSubmit, lender, isLoading }) {
  const [form, setForm] = useState(EMPTY_LENDER);
  useState(() => { setForm(lender ? { ...EMPTY_LENDER, ...lender } : EMPTY_LENDER); }, [lender, open]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lender ? "Edit Lender" : "Add Lender to Network"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 grid gap-1.5">
            <Label>Lender Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Company name" />
          </div>
          <div className="grid gap-1.5">
            <Label>Contact Name</Label>
            <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Point of contact" />
          </div>
          <div className="grid gap-1.5">
            <Label>Lender Type</Label>
            <Select value={form.lender_type} onValueChange={v => set('lender_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LENDER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@lender.com" />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Website</Label>
            <Input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://lender.com" />
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 border-t pt-3">
            <p className="text-sm font-semibold text-slate-700 mb-3">Lending Parameters</p>
          </div>
          <div className="grid gap-1.5">
            <Label>Min Loan Amount</Label>
            <Input type="number" value={form.min_loan_amount} onChange={e => set('min_loan_amount', e.target.value)} placeholder="25000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Max Loan Amount</Label>
            <Input type="number" value={form.max_loan_amount} onChange={e => set('max_loan_amount', e.target.value)} placeholder="5000000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Min Credit Score</Label>
            <Input type="number" value={form.min_credit_score} onChange={e => set('min_credit_score', e.target.value)} placeholder="600" />
          </div>
          <div className="grid gap-1.5">
            <Label>Funding Speed (days)</Label>
            <Input type="number" value={form.funding_speed_days} onChange={e => set('funding_speed_days', e.target.value)} placeholder="5" />
          </div>
          <div className="grid gap-1.5">
            <Label>Rate Min %</Label>
            <Input type="number" step="0.1" value={form.typical_rate_min} onChange={e => set('typical_rate_min', e.target.value)} placeholder="6.5" />
          </div>
          <div className="grid gap-1.5">
            <Label>Rate Max %</Label>
            <Input type="number" step="0.1" value={form.typical_rate_max} onChange={e => set('typical_rate_max', e.target.value)} placeholder="18" />
          </div>
          <div className="grid gap-1.5">
            <Label>Internal Rating (1-5)</Label>
            <Input type="number" min="1" max="5" value={form.rating} onChange={e => set('rating', parseInt(e.target.value) || 5)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Industries Served</Label>
            <Input value={form.industries_served} onChange={e => set('industries_served', e.target.value)} placeholder="All, Restaurant, Construction..." />
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label>Notes / Special Programs</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Special programs, underwriting notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSubmit({ ...form, min_loan_amount: Number(form.min_loan_amount)||undefined, max_loan_amount: Number(form.max_loan_amount)||undefined, min_credit_score: Number(form.min_credit_score)||undefined, funding_speed_days: Number(form.funding_speed_days)||undefined, typical_rate_min: Number(form.typical_rate_min)||undefined, typical_rate_max: Number(form.typical_rate_max)||undefined, rating: Number(form.rating)||5 })}
            disabled={!form.name || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? "Saving..." : lender ? "Save Changes" : "Add Lender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Lenders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [activeCategory, setActiveCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: lenders = [], isLoading } = useQuery({
    queryKey: ['lenders'],
    queryFn: () => base44.entities.Lender.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Lender.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lenders'] }); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lender.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lenders'] }); setFormOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Lender.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lenders'] }); setDeleting(null); },
  });

  const filtered = useMemo(() => lenders.filter(l => {
    const matchSearch = !search || `${l.name} ${l.contact_name} ${l.industries_served}`.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || l.lender_type === typeFilter;
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchCategory = activeCategory === 'all' || CATEGORIES[activeCategory]?.types.includes(l.lender_type);
    return matchSearch && matchType && matchStatus && matchCategory;
  }), [lenders, search, typeFilter, statusFilter, activeCategory]);

  const stats = useMemo(() => ({
    total: lenders.length,
    active: lenders.filter(l => l.status === 'active').length,
    totalVolume: lenders.reduce((s, l) => s + (l.total_volume || 0), 0),
    avgRating: lenders.length > 0 ? (lenders.reduce((s, l) => s + (l.rating || 0), 0) / lenders.length).toFixed(1) : 0,
  }), [lenders]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Lender Network</h1>
          <p className="text-slate-500 mt-1">Manage your 500+ lender relationships and matching criteria</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" /> Add Lender
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Lenders", value: stats.total, sub: "In network", Icon: Building2 },
          { label: "Active", value: stats.active, sub: "Accepting deals", Icon: Star },
          { label: "Total Volume", value: fmt(stats.totalVolume), sub: "Funded through GLINFICO", Icon: Building2 },
          { label: "Avg Rating", value: `${stats.avgRating}/5`, sub: "Network quality", Icon: Star },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm font-medium text-slate-700">{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All ({lenders.length})</TabsTrigger>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = lenders.filter(l => cat.types.includes(l.lender_type)).length;
            return <TabsTrigger key={key} value={key}>{cat.label} ({count})</TabsTrigger>;
          })}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search lenders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LENDER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending_approval">Pending</SelectItem>
          </SelectContent>
        </Select>
        {(search || typeFilter !== 'all' || statusFilter !== 'active') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('active'); }} className="text-slate-500">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Lender Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(lender => {
          const typeLabel = LENDER_TYPES.find(t => t.value === lender.lender_type)?.label;
          const catEntry = Object.entries(CATEGORIES).find(([,c]) => c.types.includes(lender.lender_type));
          const catColor = catEntry ? catEntry[1].color : "bg-slate-100 text-slate-600";
          return (
            <Card key={lender.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{lender.name}</p>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", catColor)}>{typeLabel}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => { setEditing(lender); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleting(lender)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Range</span>
                    <span className="font-medium text-slate-700">{fmt(lender.min_loan_amount)} – {fmt(lender.max_loan_amount)}</span>
                  </div>
                  {lender.typical_rate_min && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rates</span>
                      <span className="font-medium text-slate-700">{lender.typical_rate_min}% – {lender.typical_rate_max || '?'}%</span>
                    </div>
                  )}
                  {lender.min_credit_score && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Min FICO</span>
                      <span className="font-medium text-slate-700">{lender.min_credit_score}</span>
                    </div>
                  )}
                  {lender.funding_speed_days && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Speed</span>
                      <span className="font-medium text-emerald-600">{lender.funding_speed_days} days</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Stars rating={lender.rating || 5} />
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", lender.status === 'active' ? "bg-green-100 text-green-700" : lender.status === 'pending_approval' ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500")}>
                      {lender.status?.replace('_', ' ')}
                    </Badge>
                    {lender.deals_funded > 0 && (
                      <span className="text-xs text-slate-400">{lender.deals_funded} deals</span>
                    )}
                  </div>
                </div>

                {(lender.email || lender.phone || lender.website) && (
                  <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
                    {lender.email && <a href={`mailto:${lender.email}`} className="text-slate-400 hover:text-amber-600 transition-colors"><Mail className="h-4 w-4" /></a>}
                    {lender.phone && <a href={`tel:${lender.phone}`} className="text-slate-400 hover:text-amber-600 transition-colors"><Phone className="h-4 w-4" /></a>}
                    {lender.website && <a href={lender.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-amber-600 transition-colors"><Globe className="h-4 w-4" /></a>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No lenders found</p>
            <p className="text-sm mt-1">Add lenders to build your network for the AI matching engine</p>
          </div>
        )}
      </div>

      <LenderFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={(d) => editing ? updateMutation.mutate({ id: editing.id, data: d }) : createMutation.mutate(d)} lender={editing} isLoading={createMutation.isPending || updateMutation.isPending} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Lender</AlertDialogTitle>
            <AlertDialogDescription>Remove <strong>{deleting?.name}</strong> from your network?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleting.id)} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}