import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { triggerStatusAutomation, triggerNewLeadAutomation, matchLeadToLender, runLeadEnrichment } from "@/utils/automation";
import { suggestApprovedAmount } from "@/utils/commissionCalc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, LayoutGrid, List, X, Download, Upload, Calculator, Sparkles } from "lucide-react";
import { exportLeadsToCSV } from "@/utils/exportLeads";
import LeadBulkUpload from "@/components/crm/LeadBulkUpload";
import LeadCard from "@/components/crm/LeadCard";
import LeadForm from "@/components/crm/LeadForm";
import LeadDetailPanel from "@/components/crm/LeadDetailPanel";
import PipelineBoard from "@/components/crm/PipelineBoard";
import BulkActionsBar from "@/components/crm/BulkActionsBar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const statuses = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "approved", label: "Approved" },
  { value: "funded", label: "Funded" },
  { value: "lost", label: "Lost" },
];

const loanTypes = [
  { value: "all", label: "All Loan Types" },
  { value: "business_loan", label: "Business Loan" },
  { value: "equipment_financing", label: "Equipment Financing" },
  { value: "commercial_real_estate", label: "Commercial Real Estate" },
  { value: "sba_loan", label: "SBA Loan" },
  { value: "line_of_credit", label: "Line of Credit" },
  { value: "invoice_factoring", label: "Invoice Factoring" },
  { value: "merchant_cash_advance", label: "Merchant Cash Advance" },
  { value: "other", label: "Other" },
];

export default function Leads() {
  const queryClient = useQueryClient();
  const [view, setView] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [deletingLead, setDeletingLead] = useState(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: async (newLead) => {
      // Run enrichment first: Credit IDQ soft pull + revenue lookup
      runLeadEnrichment(newLead); // fire-and-forget so UI doesn't block
      await matchLeadToLender(newLead);
      await triggerNewLeadAutomation(newLead);
      if (newLead.status && newLead.status !== 'new') {
        await triggerStatusAutomation(newLead, newLead.status);
      } else {
        await triggerStatusAutomation(newLead, 'new');
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsFormOpen(false);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: async (updatedLead, variables) => {
      const original = leads.find(l => l.id === variables.id);
      if (original && original.status !== variables.data.status) {
        await triggerStatusAutomation(updatedLead || { ...original, ...variables.data }, variables.data.status);
        await autoCreateDocTask({ ...original, ...variables.data }, variables.data.status);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsFormOpen(false);
      setEditingLead(null);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setDeletingLead(null);
      setSelectedLead(null);
    },
  });

  // ── Bulk actions ──────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkStatusChange = async (newStatus) => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => base44.entities.Lead.update(id, { status: newStatus })));
    // Auto doc-request task if moving to qualified or proposal_sent
    if (["qualified", "proposal_sent"].includes(newStatus)) {
      const affectedLeads = leads.filter(l => ids.includes(l.id));
      await Promise.all(affectedLeads.map(l => triggerStatusAutomation({ ...l, status: newStatus }, newStatus)));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    await Promise.all([...selectedIds].map(id => base44.entities.Lead.delete(id)));
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  // ── Bulk enrich unenriched leads ──────────────────────────────
  const [enriching, setEnriching] = useState(false);
  const handleBulkEnrich = async () => {
    const targets = leads.filter(l => l.enrichment_status === 'not_started' || l.enrichment_status === 'failed');
    if (!targets.length) return;
    setEnriching(true);
    // Stagger to avoid rate limits: enrich 3 at a time with delay
    const batchSize = 3;
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(lead => runLeadEnrichment(lead)));
      if (i + batchSize < targets.length) {
        await new Promise(res => setTimeout(res, 3000));
      }
    }
    setEnriching(false);
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  // ── Calculate approved amounts for all leads missing one ──────
  const handleCalcApprovedAmounts = async () => {
    const targets = filteredLeads.filter(l => !l.approved_amount && l.annual_revenue);
    await Promise.all(targets.map(l => {
      const suggested = suggestApprovedAmount(l);
      if (suggested) return base44.entities.Lead.update(l.id, { approved_amount: suggested });
    }));
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  // ── Auto doc-request task on status change ─────────────────────
  const autoCreateDocTask = async (lead, newStatus) => {
    if (newStatus === "proposal_sent" || newStatus === "qualified") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 2);
      await base44.entities.Task.create({
        lead_id: lead.id,
        lead_name: `${lead.first_name} ${lead.last_name}`,
        title: `Document Request — ${lead.first_name} ${lead.last_name}`,
        description: "Collect: 3-month bank statements, 2-year tax returns, government ID, and business license.",
        type: "document_request",
        status: "pending",
        priority: "high",
        due_date: dueDate.toISOString().slice(0, 10),
        auto_generated: true,
        trigger_event: `status_${newStatus}`,
      });
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchQuery === "" || 
        `${lead.first_name} ${lead.last_name} ${lead.email} ${lead.company}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesLoanType = loanTypeFilter === "all" || lead.loan_type === loanTypeFilter;
      return matchesSearch && matchesStatus && matchesLoanType;
    });
  }, [leads, searchQuery, statusFilter, loanTypeFilter]);

  const handleSubmit = (data) => {
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, data });
    } else {
      createLeadMutation.mutate(data);
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
    setSelectedLead(null);
  };

  const handleDelete = (lead) => {
    setDeletingLead(lead);
  };

  const confirmDelete = () => {
    if (deletingLead) {
      deleteLeadMutation.mutate(deletingLead.id);
    }
  };

  const hasFilters = statusFilter !== "all" || loanTypeFilter !== "all" || searchQuery !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setLoanTypeFilter("all");
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 mt-1">{leads.length} total leads in your pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCalcApprovedAmounts} title="Auto-calculate approved amounts from annual revenue">
            <Calculator className="h-4 w-4 mr-2" />
            Calc Amounts
          </Button>
          {leads.filter(l => l.enrichment_status === 'not_started' || l.enrichment_status === 'failed').length > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkEnrich} disabled={enriching} title="Run AI enrichment on all unenriched leads" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <Sparkles className="h-4 w-4 mr-2" />
              {enriching ? 'Enriching...' : `Enrich ${leads.filter(l => l.enrichment_status === 'not_started' || l.enrichment_status === 'failed').length} Leads`}
            </Button>
          )}
          <Button variant="outline" onClick={() => exportLeadsToCSV(filteredLeads, `leads_${new Date().toISOString().slice(0,10)}.csv`)}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV ({filteredLeads.length})
          </Button>
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => { setEditingLead(null); setIsFormOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-5 w-5 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={loanTypeFilter} onValueChange={setLoanTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Loan Type" />
            </SelectTrigger>
            <SelectContent>
              {loanTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <div className="border-l pl-3 ml-auto">
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="grid">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="pipeline">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        count={selectedIds.size}
        onStatusChange={handleBulkStatusChange}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Content */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="relative group/wrap">
              <input
                type="checkbox"
                checked={selectedIds.has(lead.id)}
                onChange={() => toggleSelect(lead.id)}
                onClick={e => e.stopPropagation()}
                className="absolute top-3 left-3 z-10 h-4 w-4 rounded border-slate-300 accent-amber-500 opacity-0 group-hover/wrap:opacity-100 transition-opacity"
                style={{ opacity: selectedIds.has(lead.id) ? 1 : undefined }}
              />
              <LeadCard
                lead={lead}
                onClick={setSelectedLead}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <p className="text-lg">No leads found</p>
              <p className="text-sm mt-1">Try adjusting your filters or add a new lead</p>
            </div>
          )}
        </div>
      ) : (
        <PipelineBoard
          leads={filteredLeads}
          onLeadClick={setSelectedLead}
        />
      )}

      {/* Bulk Upload */}
      <LeadBulkUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onImported={() => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setBulkUploadOpen(false); }}
      />

      {/* Lead Form Dialog */}
      <LeadForm
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingLead(null); }}
        onSubmit={handleSubmit}
        lead={editingLead}
        isLoading={createLeadMutation.isPending || updateLeadMutation.isPending}
      />

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onEdit={handleEdit}
      />

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Leads</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected lead{selectedIds.size !== 1 ? "s" : ""}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLead} onOpenChange={() => setDeletingLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingLead?.first_name} {deletingLead?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}