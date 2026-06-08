import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X, CheckCircle2, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isBefore, startOfDay, format, isToday, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS = {
  urgent: "text-red-600 bg-red-50",
  high: "text-orange-600 bg-orange-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-slate-500 bg-slate-50",
};

const TYPE_ICONS = {
  call: "📞",
  email: "✉️",
  follow_up: "🔁",
  document_request: "📄",
  review: "🔍",
  meeting: "📅",
  other: "📌",
};

export default function TaskNotificationBell() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dismissed_tasks") || "[]"); } catch { return []; }
  });

  // Poll every 60s
  useEffect(() => {
    const load = async () => {
      const all = await base44.entities.Task.filter({ status: "pending" });
      setTasks(all);
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const today = startOfDay(new Date());

  const notifiable = tasks.filter(t => {
    if (dismissed.includes(t.id)) return false;
    if (!t.due_date) return t.priority === "urgent" || t.priority === "high";
    const due = parseISO(t.due_date);
    return isBefore(due, today) || isToday(due) || t.priority === "urgent";
  });

  const overdueCount = tasks.filter(t =>
    t.status === "pending" && t.due_date && isBefore(parseISO(t.due_date), today)
  ).length;

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("dismissed_tasks", JSON.stringify(next));
  };

  const count = notifiable.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Task Notifications</p>
                {overdueCount > 0 && (
                  <p className="text-xs text-red-500">{overdueCount} overdue task{overdueCount > 1 ? "s" : ""}</p>
                )}
              </div>
              <Link to="/Tasks" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600 hover:text-amber-700">
                  View All <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
              {notifiable.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No urgent or overdue tasks</p>
                </div>
              ) : (
                notifiable.slice(0, 12).map(task => {
                  const isOverdue = task.due_date && isBefore(parseISO(task.due_date), today);
                  const isDueToday = task.due_date && isToday(parseISO(task.due_date));
                  return (
                    <div key={task.id} className="px-4 py-3 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm">{TYPE_ICONS[task.type] || "📌"}</span>
                            <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                          </div>
                          {task.lead_name && (
                            <p className="text-xs text-slate-400 truncate mb-1">Lead: {task.lead_name}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", PRIORITY_COLORS[task.priority || "medium"])}>
                              {task.priority?.toUpperCase()}
                            </span>
                            {isOverdue && (
                              <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-semibold">
                                <AlertCircle className="h-3 w-3" /> OVERDUE
                              </span>
                            )}
                            {isDueToday && !isOverdue && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold">
                                <Clock className="h-3 w-3" /> DUE TODAY
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => dismiss(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-500 p-0.5 flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}