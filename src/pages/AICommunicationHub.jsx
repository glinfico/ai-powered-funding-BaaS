import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Send, Copy, RefreshCw, Mail, Users, Building2, Briefcase, Zap, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const RECIPIENT_TYPES = [
  { value: "borrower", label: "Borrower", icon: Users, color: "text-blue-600 bg-blue-50" },
  { value: "lender", label: "Lender", icon: Building2, color: "text-emerald-600 bg-emerald-50" },
  { value: "broker", label: "Broker", icon: Briefcase, color: "text-purple-600 bg-purple-50" },
  { value: "team", label: "Internal Team", icon: Users, color: "text-slate-600 bg-slate-50" },
];

const CONTEXT_TYPES = [
  { value: "deal_update", label: "Deal Status Update" },
  { value: "doc_request", label: "Document Request" },
  { value: "approval", label: "Approval Notification" },
  { value: "decline", label: "Decline Notice" },
  { value: "term_sheet", label: "Term Sheet Delivery" },
  { value: "lender_match", label: "Lender Match Alert" },
  { value: "status_update", label: "General Status Update" },
  { value: "pipeline_summary", label: "Pipeline Summary" },
  { value: "custom", label: "Custom Message" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "urgent", label: "Urgent" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
];

const URGENCY_COLORS = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

export default function AICommunicationHub() {
  const [recipientType, setRecipientType] = useState("borrower");
  const [contextType, setContextType] = useState("deal_update");
  const [tone, setTone] = useState("professional");
  const [selectedDealId, setSelectedDealId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [generatedMsg, setGeneratedMsg] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentHistory, setSentHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  const { data: deals = [] } = useQuery({
    queryKey: ['deals-comm'],
    queryFn: () => base44.entities.Deal.list('-created_date', 100),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-comm'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  const selectedDeal = deals.find(d => d.id === selectedDealId);
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedMsg(null);
    try {
      const res = await base44.functions.invoke('aiCommunication', {
        action: 'draft',
        recipient_type: recipientType,
        context_type: contextType,
        tone,
        deal_id: selectedDealId || undefined,
        lead_id: selectedLeadId || undefined,
        recipient_email: recipientEmail || undefined,
        recipient_name: recipientName || undefined,
        custom_context: customContext || undefined,
        send_immediately: false,
      });
      setGeneratedMsg(res.data.message);
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const handleSend = async () => {
    if (!generatedMsg) return;
    setIsSending(true);
    try {
      const res = await base44.functions.invoke('aiCommunication', {
        action: 'send',
        recipient_type: recipientType,
        context_type: contextType,
        tone,
        deal_id: selectedDealId || undefined,
        lead_id: selectedLeadId || undefined,
        recipient_email: recipientEmail || undefined,
        recipient_name: recipientName || undefined,
        custom_context: customContext || undefined,
        send_immediately: true,
      });
      if (res.data.sent) {
        setSentHistory(prev => [{
          id: Date.now(),
          subject: generatedMsg.subject,
          recipient: recipientName || recipientEmail || recipientType,
          type: contextType,
          time: new Date().toLocaleTimeString(),
          urgency: generatedMsg.urgency_level
        }, ...prev.slice(0, 9)]);
        setGeneratedMsg(null);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSending(false);
  };

  const handleCopy = () => {
    if (!generatedMsg) return;
    navigator.clipboard.writeText(`Subject: ${generatedMsg.subject}\n\n${generatedMsg.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Communication Hub</h1>
          <p className="text-slate-500 mt-0.5">Generate & send AI-powered messages to borrowers, lenders, brokers and team</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2">
          <Zap className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold text-violet-700">Claude Sonnet AI</span>
        </div>
      </div>

      <Tabs defaultValue="compose">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="compose" className="gap-2"><Bot className="h-4 w-4" />Compose</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><Mail className="h-4 w-4" />Sent History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Config Panel */}
            <div className="space-y-5">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">Message Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient Type */}
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Who are you communicating with?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {RECIPIENT_TYPES.map(rt => (
                        <button
                          key={rt.value}
                          onClick={() => setRecipientType(rt.value)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all",
                            recipientType === rt.value
                              ? "border-violet-500 bg-violet-50 text-violet-700"
                              : "border-slate-200 hover:border-slate-300 text-slate-600"
                          )}
                        >
                          <rt.icon className="h-4 w-4" />
                          {rt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Context Type */}
                  <div className="grid gap-1.5">
                    <Label>Communication Purpose</Label>
                    <Select value={contextType} onValueChange={setContextType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONTEXT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tone */}
                  <div className="grid gap-1.5">
                    <Label>Message Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-900">Context & Recipient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Link to Deal */}
                  <div className="grid gap-1.5">
                    <Label>Link to Deal (optional)</Label>
                    <Select value={selectedDealId || "none"} onValueChange={v => setSelectedDealId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Select a deal..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No deal</SelectItem>
                        {deals.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.borrower_name} — ${(d.loan_amount || 0).toLocaleString()} ({(d.stage || '').replace(/_/g, ' ')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDeal && (
                      <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                        Stage: <strong>{(selectedDeal.stage || '').replace(/_/g, ' ')}</strong> · Lender: {selectedDeal.lender_name || 'Unassigned'} · {selectedDeal.industry || ''}
                      </div>
                    )}
                  </div>

                  {/* Link to Lead */}
                  <div className="grid gap-1.5">
                    <Label>Link to Lead (optional)</Label>
                    <Select value={selectedLeadId || "none"} onValueChange={v => setSelectedLeadId(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Select a lead..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No lead</SelectItem>
                        {leads.slice(0, 50).map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.first_name} {l.last_name} — {l.company || 'Unknown Co'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipient Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Recipient Name</Label>
                      <Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="John Smith" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Recipient Email</Label>
                      <Input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="john@email.com" />
                    </div>
                  </div>

                  {/* Custom Context */}
                  <div className="grid gap-1.5">
                    <Label>Additional Context (optional)</Label>
                    <Textarea
                      value={customContext}
                      onChange={e => setCustomContext(e.target.value)}
                      placeholder="Add any specific details, conditions, or instructions for the AI..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
                  >
                    {isGenerating ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> AI is writing...</>
                    ) : (
                      <><Bot className="h-4 w-4" /> Generate with AI</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: Generated Message */}
            <div className="space-y-4">
              {!generatedMsg && !isGenerating && (
                <div className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-slate-500 font-medium">Configure your message and click Generate</p>
                  <p className="text-slate-400 text-sm mt-1">AI will craft a professional, context-aware message</p>
                </div>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed border-violet-200 rounded-2xl bg-violet-50/30">
                  <RefreshCw className="h-10 w-10 text-violet-500 animate-spin mb-4" />
                  <p className="text-violet-700 font-semibold">Claude AI is crafting your message...</p>
                  <p className="text-violet-500 text-sm mt-1">Analyzing deal context and generating personalized content</p>
                </div>
              )}

              {generatedMsg && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        AI-Generated Message
                      </CardTitle>
                      <Badge className={cn("text-xs", URGENCY_COLORS[generatedMsg.urgency_level] || URGENCY_COLORS.medium)}>
                        {generatedMsg.urgency_level} urgency
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Subject */}
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject Line</p>
                      <p className="text-sm font-semibold text-slate-900">{generatedMsg.subject}</p>
                    </div>

                    {/* Body */}
                    <div className="bg-white border border-slate-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Message Body</p>
                      <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{generatedMsg.body}</pre>
                    </div>

                    {/* Key Points */}
                    {generatedMsg.key_points?.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Key Points</p>
                        <ul className="space-y-1">
                          {generatedMsg.key_points.map((pt, i) => (
                            <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                              <span className="text-blue-400 mt-0.5">•</span> {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA + Follow-up */}
                    {generatedMsg.call_to_action && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                        <Zap className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-700">Call to Action</p>
                          <p className="text-xs text-amber-600 mt-0.5">{generatedMsg.call_to_action}</p>
                        </div>
                      </div>
                    )}
                    {generatedMsg.recommended_follow_up_days && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Follow up in {generatedMsg.recommended_follow_up_days} day{generatedMsg.recommended_follow_up_days !== 1 ? 's' : ''} if no response
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSend}
                        disabled={isSending || !recipientEmail}
                        className={cn(
                          "gap-1.5 flex-1",
                          recipientEmail ? "bg-violet-600 hover:bg-violet-700" : "bg-slate-300 cursor-not-allowed"
                        )}
                        title={!recipientEmail ? "Add recipient email to send" : ""}
                      >
                        {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {isSending ? 'Sending...' : recipientEmail ? 'Send Now' : 'Add Email to Send'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Sent Communications (This Session)</CardTitle>
            </CardHeader>
            <CardContent>
              {sentHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No messages sent this session</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sentHistory.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.subject}</p>
                        <p className="text-xs text-slate-500">To: {item.recipient} · {item.type.replace(/_/g, ' ')}</p>
                      </div>
                      <Badge className={cn("text-xs", URGENCY_COLORS[item.urgency] || URGENCY_COLORS.medium)}>
                        {item.urgency}
                      </Badge>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}