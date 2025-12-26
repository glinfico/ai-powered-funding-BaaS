import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PipelineBoard from "@/components/crm/PipelineBoard";
import LeadDetailPanel from "@/components/crm/LeadDetailPanel";
import LeadForm from "@/components/crm/LeadForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Pipeline() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsFormOpen(false);
      setEditingLead(null);
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsFormOpen(false);
    },
  });

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setIsFormOpen(true);
    setSelectedLead(null);
  };

  const handleSubmit = (data) => {
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, data });
    } else {
      createLeadMutation.mutate(data);
    }
  };

  // Filter out lost leads from the pipeline view
  const pipelineLeads = leads.filter(lead => lead.status !== 'lost');

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-slate-500 mt-1">Visual overview of your lending pipeline</p>
        </div>
        <Button onClick={() => { setEditingLead(null); setIsFormOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-5 w-5 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Pipeline Board */}
      <PipelineBoard
        leads={pipelineLeads}
        onLeadClick={setSelectedLead}
      />

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onEdit={handleEdit}
      />

      {/* Lead Form Dialog */}
      <LeadForm
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingLead(null); }}
        onSubmit={handleSubmit}
        lead={editingLead}
        isLoading={createLeadMutation.isPending || updateLeadMutation.isPending}
      />
    </div>
  );
}