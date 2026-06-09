import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Clock, Loader2, CheckCircle2, Play } from "lucide-react";

export default function TaskReminderSettings() {
  const [enabled, setEnabled] = useState(true);
  const [overdueAfter, setOverdueAfter] = useState("1");
  const [sendHour, setSendHour] = useState("8");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await base44.functions.invoke("sendTaskReminders", {});
      setTestResult({
        ok: true,
        msg: `Ran successfully — ${res.data?.overdue_tasks ?? 0} overdue tasks, ${res.data?.due_today ?? 0} due today, ${res.data?.emails_sent ?? 0} emails sent.`
      });
    } catch (err) {
      setTestResult({ ok: false, msg: err.message });
    }
    setTestLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-blue-500" />
            Task Reminder Engine
          </CardTitle>
          <CardDescription className="mt-1">
            Automatically emails team members about overdue and due-today tasks. Runs daily at your configured time via the <span className="font-medium text-amber-600">Daily Task Reminders</span> automation.
          </CardDescription>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Daily Send Time</Label>
            <Select value={sendHour} onValueChange={setSendHour}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 13 }, (_, i) => i + 6).map(h => (
                  <SelectItem key={h} value={String(h)}>
                    {h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Escalate overdue tasks after (days)</Label>
            <Input
              type="number"
              min="1"
              max="7"
              value={overdueAfter}
              onChange={e => setOverdueAfter(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-semibold text-slate-700 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" /> How it works
          </p>
          <ul className="text-slate-500 text-xs space-y-1 ml-6 list-disc">
            <li>Every morning, the engine scans all pending tasks with a due date</li>
            <li>Sends personalized email summaries to each team member</li>
            <li>Escalates urgent/high priority tasks overdue by {overdueAfter}+ day(s) to admin</li>
            <li>Tasks are grouped by: overdue vs. due today</li>
          </ul>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testLoading}
            className="gap-2"
          >
            {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {testLoading ? "Running..." : "Run Now (Test)"}
          </Button>

          {testResult && (
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {testResult.ok && <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />}
              {testResult.msg}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}