import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Zap } from "lucide-react";
import { DEFAULT_AUTOMATION_RULES } from "@/utils/automation";
import NotificationAlerts from "@/components/settings/NotificationAlerts";
import TaskReminderSettings from "@/components/settings/TaskReminderSettings";

const STATUS_OPTIONS = [
  { value: "any", label: "Any Status Change" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "approved", label: "Approved" },
  { value: "funded", label: "Funded" },
  { value: "lost", label: "Lost" },
];

const TASK_TYPES = [
  { value: "follow_up", label: "Follow Up" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "document_request", label: "Document Request" },
  { value: "review", label: "Review" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

const EMPTY_RULE = {
  name: "", description: "", trigger: "status_change",
  trigger_status: "new", task_title: "", task_description: "",
  task_type: "follow_up", task_priority: "medium", due_days_offset: 1, is_active: true,
};

function RuleDialog({ open, onClose, onSubmit, rule, isLoading }) {
  const [form, setForm] = useState(EMPTY_RULE);

  useEffect(() => {
    setForm(rule ? { ...rule } : EMPTY_RULE);
  }, [rule, open]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Automation Rule" : "New Automation Rule"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid gap-1.5">
            <Label>Rule Name *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Follow up after contact" />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="What does this rule do?" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Trigger</Label>
              <Select value={form.trigger} onValueChange={v => set('trigger', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="status_change">Status Change</SelectItem>
                  <SelectItem value="new_lead">New Lead Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.trigger === 'status_change' && (
              <div className="grid gap-1.5">
                <Label>When status becomes</Label>
                <Select value={form.trigger_status || 'new'} onValueChange={v => set('trigger_status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Task to Auto-Create</p>
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Task Title *</Label>
                <Input value={form.task_title} onChange={e => set('task_title', e.target.value)} placeholder="e.g. Initial Outreach Call" />
              </div>
              <div className="grid gap-1.5">
                <Label>Task Instructions</Label>
                <Textarea value={form.task_description || ''} onChange={e => set('task_description', e.target.value)} placeholder="What should be done?" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <Label>Type</Label>
                  <Select value={form.task_type} onValueChange={v => set('task_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Priority</Label>
                  <Select value={form.task_priority} onValueChange={v => set('task_priority', v)}>
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
                  <Label>Due in (days)</Label>
                  <Input type="number" min="1" max="30" value={form.due_days_offset} onChange={e => set('due_days_offset', parseInt(e.target.value) || 1)} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
            <Label className="cursor-pointer">Rule is active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSubmit(form)}
            disabled={!form.name || !form.task_title || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? "Saving..." : rule ? "Save Changes" : "Create Rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);
  const [seedAttempted, setSeedAttempted] = useState(false);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => base44.entities.AutomationRule.list(),
  });

  useEffect(() => {
    if (!isLoading && rules.length === 0 && !seedAttempted) {
      setSeedAttempted(true);
      Promise.all(DEFAULT_AUTOMATION_RULES.map(r => base44.entities.AutomationRule.create(r)))
        .then(() => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }));
    }
  }, [isLoading, rules.length, seedAttempted]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automation-rules'] }); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automation-rules'] }); setDialogOpen(false); setEditingRule(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['automation-rules'] }); setDeletingRule(null); },
  });

  const toggleRule = (rule) => {
    updateMutation.mutate({ id: rule.id, data: { ...rule, is_active: !rule.is_active } });
  };

  const handleSubmit = (form) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const activeCount = rules.filter(r => r.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure automation rules and CRM workflows</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-amber-500" />
              Automation Rules
            </CardTitle>
            <CardDescription className="mt-1">
              Automatically create tasks when leads are added or change status. <span className="font-medium text-amber-600">{activeCount} active</span> of {rules.length} rules.
            </CardDescription>
          </div>
          <Button onClick={() => { setEditingRule(null); setDialogOpen(true); }} className="bg-amber-600 hover:bg-amber-700 flex-shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || (rules.length === 0 && !seedAttempted) ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors border ${rule.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                >
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => toggleRule(rule)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{rule.name}</p>
                      <Badge variant="outline" className="text-xs font-normal">
                        {rule.trigger === 'new_lead' ? '⚡ New Lead' : `→ ${rule.trigger_status}`}
                      </Badge>
                      <Badge className="text-xs bg-amber-100 text-amber-700 font-normal">
                        {rule.task_type?.replace('_', ' ')} · +{rule.due_days_offset}d · {rule.task_priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">Creates: "<span className="italic">{rule.task_title}</span>"</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700"
                      onClick={() => { setEditingRule(rule); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() => setDeletingRule(rule)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskReminderSettings />
      <NotificationAlerts />

      <RuleDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingRule(null); }}
        onSubmit={handleSubmit}
        rule={editingRule}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deletingRule} onOpenChange={() => setDeletingRule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "<strong>{deletingRule?.name}</strong>"? This won't remove tasks already created by this rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingRule.id)} className="bg-red-600 hover:bg-red-700">
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}