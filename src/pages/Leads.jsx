import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { triggerStatusAutomation, triggerNewLeadAutomation } from "@/utils/automation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, LayoutGrid, List, Filter, X } from "lucide-react";
import LeadCard from "@/components/crm/LeadCard";
import LeadForm from "@/components/crm/LeadForm";
import LeadDetailPanel from "@/components/crm/LeadDetailPanel";
import PipelineBoard from "@/components/crm/PipelineBoard";
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

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: async (newLead) => {
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
        <Button onClick={() => { setEditingLead(null); setIsFormOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-5 w-5 mr-2" />
          Add Lead
        </Button>
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

      {/* Content */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={setSelectedLead}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
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