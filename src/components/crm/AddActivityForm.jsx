import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const activityTypes = [
  { value: "call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
];

export default function AddActivityForm({ onSubmit, isLoading }) {
  const [type, setType] = useState("note");
  const [description, setDescription] = useState("");
  const [outcome, setOutcome] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit({ type, description, outcome });
    setDescription("");
    setOutcome("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-xl">
      <div className="space-y-2">
        <Label>Activity Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the activity..."
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Outcome (optional)</Label>
        <Input
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="What was the result?"
        />
      </div>
      <Button type="submit" disabled={isLoading || !description.trim()} className="w-full bg-amber-600 hover:bg-amber-700">
        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Add Activity
      </Button>
    </form>
  );
}