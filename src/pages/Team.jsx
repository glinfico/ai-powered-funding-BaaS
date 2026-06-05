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
import { Plus, Search, Users, TrendingUp, Target, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "loan_officer", label: "Loan Officer" },
  { value: "processor", label: "Processor" },
  { value: "closer", label: "Closer" },
  { value: "marketing", label: "Marketing" },
  { value: "support", label: "Support" },
];

const DEPARTMENTS = [
  { value: "origination", label: "Origination" },
  { value: "processing", label: "Processing" },
  { value: "closing", label: "Closing" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "management", label: "Management" },
];

const fmt = (v) => {
  if (!v) return "—";
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
};

const roleColors = {
  super_admin: "bg-red-100 text-red-700",
  admin: "bg-purple-100 text-purple-700",
  loan_officer: "bg-amber-100 text-amber-700",
  processor: "bg-blue-100 text-blue-700",
  closer: "bg-green-100 text-green-700",
  marketing: "bg-pink-100 text-pink-700",
  support: "bg-slate-100 text-slate-600",
};

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-500",
  on_leave: "bg-yellow-100 text-yellow-700",
};

const EMPTY_MEMBER = {
  full_name: "", email: "", phone: "", role: "loan_officer",
  department: "origination", status: "active",
  hire_date: "", target_monthly_volume: "", notes: "",
};

function MemberFormDialog({ open, onClose, onSubmit, member, isLoading }) {
  const [form, setForm] = useState(EMPTY_MEMBER);
  useState(() => { setForm(member ? { ...EMPTY_MEMBER, ...member } : EMPTY_MEMBER); }, [member, open]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 grid gap-1.5">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="grid gap-1.5">
            <Label>Email *</Label>
            <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@glinfico.com" />
          </div>
          <div className="grid gap-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={v => set('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Department</Label>
            <Select value={form.department} onValueChange={v => set('department', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Monthly Volume Target</Label>
            <Input type="number" value={form.target_monthly_volume} onChange={e => set('target_monthly_volume', e.target.value)} placeholder="500000" />
          </div>
          <div className="grid gap-1.5">
            <Label>Hire Date</Label>
            <Input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} />
          </div>
          <div className="col-span-2 grid gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Specialties, notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSubmit({ ...form, target_monthly_volume: Number(form.target_monthly_volume) || undefined })}
            disabled={!form.full_name || !form.email || isLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? "Saving..." : member ? "Save Changes" : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Team() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => base44.entities.TeamMember.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.TeamMember.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); setFormOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); setFormOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); setDeleting(null); },
  });

  const filtered = useMemo(() => members.filter(m => {
    const matchSearch = !search || `${m.full_name} ${m.email} ${m.department}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  }), [members, search, roleFilter]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    totalVolume: members.reduce((s, m) => s + (m.total_volume_funded || 0), 0),
    totalFunded: members.reduce((s, m) => s + (m.deals_funded || 0), 0),
  }), [members]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 mt-1">Manage loan officers, processors, and operations staff</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Total Funded", value: stats.totalFunded + " deals" },
          { label: "Team Volume", value: fmt(stats.totalVolume) },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Team Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(member => {
          const roleLabel = ROLES.find(r => r.value === member.role)?.label;
          const deptLabel = DEPARTMENTS.find(d => d.value === member.department)?.label;
          const initials = member.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

          return (
            <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <span className="text-white font-bold text-sm">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{member.full_name}</p>
                        <p className="text-xs text-slate-500">{deptLabel}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700" onClick={() => { setEditing(member); setFormOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => setDeleting(member)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge className={cn("text-xs", roleColors[member.role])}>{roleLabel}</Badge>
                      <Badge className={cn("text-xs", statusColors[member.status])}>{member.status?.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {[
                    { label: "Assigned", value: member.deals_assigned || 0 },
                    { label: "Funded", value: member.deals_funded || 0 },
                    { label: "Volume", value: fmt(member.total_volume_funded) },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-2">
                      <p className="font-bold text-slate-900 text-sm">{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {member.target_monthly_volume && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Monthly Target</span>
                      <span>{fmt(member.target_monthly_volume)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((member.total_volume_funded || 0) / member.target_monthly_volume) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  {member.email && <a href={`mailto:${member.email}`} className="text-slate-400 hover:text-amber-600 transition-colors flex items-center gap-1 text-xs">{member.email}</a>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No team members yet</p>
            <p className="text-sm mt-1">Add your loan officers and processing staff</p>
          </div>
        )}
      </div>

      <MemberFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={(d) => editing ? updateMutation.mutate({ id: editing.id, data: d }) : createMutation.mutate(d)} member={editing} isLoading={createMutation.isPending || updateMutation.isPending} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>Remove <strong>{deleting?.full_name}</strong> from the team?</AlertDialogDescription>
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