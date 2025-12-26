import { format } from "date-fns";
import { Phone, Mail, Calendar, FileText, TrendingUp, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  status_change: TrendingUp,
  document_upload: Upload,
};

const activityColors = {
  call: "bg-green-100 text-green-600",
  email: "bg-blue-100 text-blue-600",
  meeting: "bg-purple-100 text-purple-600",
  note: "bg-slate-100 text-slate-600",
  status_change: "bg-amber-100 text-amber-600",
  document_upload: "bg-indigo-100 text-indigo-600",
};

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type] || FileText;
        return (
          <div key={activity.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                activityColors[activity.type] || "bg-slate-100 text-slate-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              {index < activities.length - 1 && (
                <div className="w-0.5 h-full bg-slate-200 my-2" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-700 capitalize">
                  {activity.type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400">
                  {format(new Date(activity.created_date), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              <p className="text-sm text-slate-600">{activity.description}</p>
              {activity.outcome && (
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-medium">Outcome:</span> {activity.outcome}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}