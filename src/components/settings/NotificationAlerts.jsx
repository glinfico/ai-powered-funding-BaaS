import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Bell, Plus, Pencil, Trash2 } from "lucide-react";

const EVENT_OPTIONS = [
  { value: "new_lead", label: "🆕 New Lead Added", color: "bg-blue-100 text-blue-700" },
  { value: "lead_funded", label: "✅ Lead Funded", color: "bg-green-100 text-green-700" },
  { value: "lead_lost", label: "❌ Lead Lost", color: "bg-red-100 text-red-700" },
  { value: "status_change", label: "🔄 Status Changed", color: "bg-amber-100 text-amber-700" },
  { value: "high_value_lead", label: "💰 High-Value Lead", color: "bg-purple-100 text-purple-700" },
  { value: "stale_lead", label: "⏰ Stale Lead", color: "bg-slate-100 text-slate-700" },
];

const EMPTY_ALERT = {
  name: "", event: "new_lead", channels: ["email"], recipients: [], is_active: true,
  threshold_amount: "", stale_days: "", notes: "",
};

function AlertDialog2({ open, onClose, onSubmit, alert, isLoading }) {
  const [form, setForm] = useState(EMPTY_ALERT);
  const [recipientInput, setRecipientInput] = useState("");

  useEffect(() => {
    if (alert) setForm({ ...EMPTY_ALERT, ...alert, threshold_amount: alert.threshold_amount || "", stale_days: alert.stale_days || "" });
    else setForm(EMPTY_ALERT);
    setRecipientInput("");
  }, [alert, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addRecipient = () => {
    const email = recipientInput.trim();
    if (email && !form.recipients.includes(email)) {
      set("recipients", [...(form.recipients || []), email]);
      setRecipientInput("");
    }
  };

  const removeRecipient = (email) => set("recipients", form.recipients.filter(e => e !== email));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{alert ? "Edit Alert" : "New Notification Alert"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid gap-1.5">
            <Label>Alert Name *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Notify on new funded deal" />
          </div>
          <div className="grid gap-1.5">
            <Label>Trigger Event *</Label>
            <Select value={form.event} onValueChange={v => set("event", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.event === "high_value_lead" && (
            <div className="grid gap-1.5">
              <Label>Minimum Loan Amount ($)</Label>
              <Input type="number" value={form.threshold_amount} onChange={e => set("threshold_amount", e.target.value)} placeholder="e.g. 500000" />
            </div>
          )}
          {form.event === "stale_lead" && (
            <div className="grid gap-1.5">
              <Label>Days Without Contact</Label>
              <Input type="number" value={form.stale_days} onChange={e => set("stale_days", e.target.value)} placeholder="e.g. 7" />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label>Email Recipients</Label>
            <div className="flex gap-2">
              <Input value={recipientInput} onChange={e => setRecipientInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addRecipient())} placeholder="email@company.com" />
              <Button type="button" variant="outline" onClick={addRecipient}>Add</Button>
            </div>
            {form.recipients?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {form.recipients.map(r => (
                  <Badge key={r} variant="secondary" className="flex items-center gap-1">
                    {r}
                    <button onClick={() => removeRecipient(r)} className="ml-1 text-slate-400 hover:text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Notes</Label>
            <Input value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Optional description" />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={v => set("is_active", v)} />
            <Label>Alert is active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!form.name || !form.event || isLoading}
            onClick={() => onSubmit({ ...form, threshold_amount: form.threshold_amount ? parseFloat(form.threshold_amount) : undefined, stale_days: form.stale_days ? parseInt(form.stale_days) : undefined })}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? "Saving..." : alert ? "Save Changes" : "Create Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function NotificationAlerts() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [deletingAlert, setDeletingAlert] = useState(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["notification-alerts"],
    queryFn: () => base44.entities.NotificationAlert.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NotificationAlert.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notification-alerts"] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NotificationAlert.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notification-alerts"] }); setDialogOpen(false); setEditingAlert(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificationAlert.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notification-alerts"] }); setDeletingAlert(null); },
  });

  const toggle = (alert) => updateMutation.mutate({ id: alert.id, data: { ...alert, is_active: !alert.is_active } });

  const handleSubmit = (form) => {
    if (editingAlert) updateMutation.mutate({ id: editingAlert.id, data: form });
    else createMutation.mutate(form);
  };

  const eventMeta = (event) => EVENT_OPTIONS.find(o => o.value === event) || { label: event, color: "bg-slate-100 text-slate-700" };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-amber-500" />
            Team Notification Alerts
          </CardTitle>
          <CardDescription className="mt-1">
            Get notified when key pipeline events occur. <span className="font-medium text-amber-600">{alerts.filter(a => a.is_active).length} active</span> of {alerts.length} alerts.
          </CardDescription>
        </div>
        <Button onClick={() => { setEditingAlert(null); setDialogOpen(true); }} className="bg-amber-600 hover:bg-amber-700 flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add Alert
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No alerts configured yet. Add one to stay on top of your pipeline.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => {
              const meta = eventMeta(alert.event);
              return (
                <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${alert.is_active ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100 opacity-60"}`}>
                  <Switch checked={alert.is_active} onCheckedChange={() => toggle(alert)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{alert.name}</p>
                      <Badge className={`text-xs font-normal ${meta.color}`}>{meta.label}</Badge>
                      {alert.recipients?.length > 0 && (
                        <Badge variant="outline" className="text-xs font-normal">{alert.recipients.length} recipient{alert.recipients.length > 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                    {alert.threshold_amount && <p className="text-xs text-slate-500 mt-0.5">Threshold: ${alert.threshold_amount.toLocaleString()}</p>}
                    {alert.stale_days && <p className="text-xs text-slate-500 mt-0.5">After {alert.stale_days} days without contact</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={() => { setEditingAlert(alert); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => setDeletingAlert(alert)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog2
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingAlert(null); }}
        onSubmit={handleSubmit}
        alert={editingAlert}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deletingAlert} onOpenChange={() => setDeletingAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>Delete "<strong>{deletingAlert?.name}</strong>"? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deletingAlert.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}