import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2, Clock, Circle, Phone, Mail,
  FileText, Calendar, Users, Zap, Trash2, ArrowRight, Eye
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const typeConfig = {
  follow_up: { icon: ArrowRight, label: "Follow Up", color: "text-amber-600" },
  call: { icon: Phone, label: "Call", color: "text-blue-500" },
  email: { icon: Mail, label: "Email", color: "text-green-600" },
  document_request: { icon: FileText, label: "Docs", color: "text-orange-500" },
  review: { icon: Eye, label: "Review", color: "text-purple-600" },
  meeting: { icon: Users, label: "Meeting", color: "text-pink-600" },
  other: { icon: Circle, label: "Other", color: "text-slate-500" },
};

const priorityBorderColor = {
  urgent: "border-l-red-500",
  high: "border-l-amber-400",
  medium: "border-l-blue-400",
  low: "border-l-slate-300",
};

const priorityBadgeColor = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-600",
};

export default function TaskCard({ task, onStatusChange, onDelete }) {
  const typeInfo = typeConfig[task.type] || typeConfig.other;
  const TypeIcon = typeInfo.icon;
  const isOverdue = task.status === 'pending' && task.due_date && isBefore(new Date(task.due_date), startOfDay(new Date()));
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';

  return (
    <Card className={cn(
      "border-0 shadow-sm border-l-4 transition-all hover:shadow-md",
      priorityBorderColor[task.priority] || priorityBorderColor.medium,
      isCompleted && "opacity-55"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onStatusChange(task, isCompleted ? 'pending' : 'completed')}
            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-slate-300 hover:text-green-400 transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-slate-900 leading-tight", isCompleted && "line-through text-slate-400")}>
                  {task.title}
                </p>
                {task.lead_name && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    <span className="text-slate-400">Lead:</span> {task.lead_name}
                  </p>
                )}
                {task.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                {task.auto_generated && (
                  <Badge className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Auto
                  </Badge>
                )}
                <Badge className={cn("text-xs", priorityBadgeColor[task.priority] || priorityBadgeColor.medium)}>
                  {task.priority}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className={cn("flex items-center gap-1 text-xs font-medium", typeInfo.color)}>
                <TypeIcon className="h-3.5 w-3.5" />
                {typeInfo.label}
              </div>

              {task.due_date && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-red-600 font-semibold" : "text-slate-500"
                )}>
                  <Calendar className="h-3.5 w-3.5" />
                  {isOverdue && "Overdue · "}
                  {format(new Date(task.due_date), 'MMM d, yyyy')}
                </div>
              )}

              {isInProgress && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">In Progress</Badge>
              )}

              {task.status === 'pending' && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  onClick={() => onStatusChange(task, 'in_progress')}
                >
                  Start →
                </button>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-300 hover:text-red-500 flex-shrink-0 transition-colors"
            onClick={() => onDelete(task)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}