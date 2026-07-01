import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Phone,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Link as LinkIcon,
  BarChart3,
  MoreHorizontal,
  X,
  Briefcase,
  Mail,
  Play,
  Volume2,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textArea";
import {
  listCallFlows,
  getCallFlow,
  createCallFlow,
  previewCallFlowVoice,
  updateCallFlow,
  deleteCallFlow,
  listCallFlowSessions,
  listWorkspaces,
  type CallFlow,
  type CallFlowQuestion,
  type CallSessionResult,
  type Workspace,
} from "@/lib/backend-api";

const NEW_WS = "__new__";
const NO_WS = "__none__";

const VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"];

function callLinkFor(token: string, workspaceId?: number | null) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const ws = workspaceId != null ? `?workspace=${workspaceId}` : "";
  return `${origin}/call/${token}${ws}`;
}

export default function CallFlowContainer() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<CallFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CallFlow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [resultsFor, setResultsFor] = useState<CallFlow | null>(null);

  const openDetail = (id: number) =>
    navigate({ to: "/call-flows/$id", params: { id: String(id) } });

  const load = useCallback(async () => {
    try {
      const res = await listCallFlows({ pageSize: 100 });
      setFlows(res.data);
    } catch {
      toast.error("Failed to load call flows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = async (flow: CallFlow) => {
    try {
      const full = await getCallFlow(flow.id);
      setEditing(full);
      setShowForm(true);
    } catch {
      toast.error("Failed to load call flow");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this call flow? This also removes its call results.")) return;
    try {
      await deleteCallFlow(id);
      toast.success("Call flow deleted");
      void load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const copyLink = (flow: CallFlow) => {
    void navigator.clipboard.writeText(callLinkFor(flow.publicToken, flow.workspaceId));
    toast.success("Call link copied");
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Phone className="h-5 w-5" /> Call Flows
          </h1>
          <p className="text-sm text-muted-foreground">
            Build voice screening &amp; onboarding interviews. Share a link, score answers automatically.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> New Call Flow
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : flows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Phone className="mb-3 h-12 w-12 opacity-30" />
            <p>No call flows yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Voice</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Calls</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.map((f) => (
                <TableRow
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(f.id)}
                >
                  <TableCell className="font-medium">{f.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{f.voice}</Badge>
                  </TableCell>
                  <TableCell>{f._count?.questions ?? f.questions?.length ?? 0}</TableCell>
                  <TableCell>{f._count?.sessions ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.scheduledAt
                      ? new Date(f.scheduledAt).toLocaleString()
                      : "Anytime"}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => copyLink(f)}
                      >
                        <LinkIcon className="h-3.5 w-3.5" /> Link
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setResultsFor(f)}>
                            <BarChart3 className="mr-2 h-3.5 w-3.5" /> View results
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void openEdit(f)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => void handleDelete(f.id)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <CallFlowForm
          flow={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}

      {resultsFor && (
        <ResultsDialog flow={resultsFor} onClose={() => setResultsFor(null)} />
      )}
    </div>
  );
}

// ─── Create / Edit form ───────────────────────────────────────────────

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function CallFlowForm({
  flow,
  onClose,
  onSaved,
}: {
  flow: CallFlow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(flow?.title ?? "");
  const [voice, setVoice] = useState(flow?.voice ?? "alloy");
  const [voiceSpeed, setVoiceSpeed] = useState<number>(flow?.voiceSpeed ?? 1);
  const [previewing, setPreviewing] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState(
    flow?.systemInstruction ??
      "You are a friendly, professional interviewer conducting a screening call. Speak clearly and keep the conversation on track.",
  );
  const [scriptIntro, setScriptIntro] = useState(flow?.scriptIntro ?? "");
  const [webhookUrl, setWebhookUrl] = useState(flow?.webhookUrl ?? "");
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(flow?.scheduledAt));
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceChoice, setWorkspaceChoice] = useState<string>(
    flow?.workspaceId != null ? String(flow.workspaceId) : NO_WS,
  );
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [emails, setEmails] = useState<string[]>(flow?.invitedEmails ?? []);
  const [emailInput, setEmailInput] = useState("");
  const [questions, setQuestions] = useState<CallFlowQuestion[]>(
    flow?.questions?.length
      ? flow.questions.map((q) => ({
          prompt: q.prompt,
          expectedAnswer: q.expectedAnswer ?? "",
          weight: q.weight ?? 1,
        }))
      : [{ prompt: "", expectedAnswer: "", weight: 1 }],
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listWorkspaces()
      .then(setWorkspaces)
      .catch(() => {
        /* selector just stays empty */
      });
  }, []);

  const updateQuestion = (i: number, patch: Partial<CallFlowQuestion>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const addQuestion = () =>
    setQuestions((qs) => [...qs, { prompt: "", expectedAnswer: "", weight: 1 }]);
  const removeQuestion = (i: number) =>
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const addEmail = () => {
    const v = emailInput.trim().toLowerCase();
    if (!v) return;
    if (!/.+@.+\..+/.test(v)) {
      toast.error("Enter a valid email");
      return;
    }
    if (!emails.includes(v)) setEmails((e) => [...e, v]);
    setEmailInput("");
  };
  const removeEmail = (email: string) =>
    setEmails((e) => e.filter((x) => x !== email));

  // Synthesize a sample sentence so you can hear the chosen voice + speed.
  const handlePreviewVoice = async () => {
    if (previewing) return;
    setPreviewing(true);
    try {
      const res = await previewCallFlowVoice({ voice, speed: voiceSpeed });
      if (!res.audioBase64) {
        toast.error("Voice preview unavailable (TTS not configured).");
        return;
      }
      const audio = new Audio(`data:${res.mimeType};base64,${res.audioBase64}`);
      audio.playbackRate = 1; // speed is already baked into the synthesized audio
      await audio.play();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to preview voice");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!systemInstruction.trim()) return toast.error("System instruction is required");
    if (workspaceChoice === NEW_WS && !newWorkspaceName.trim()) {
      return toast.error("Enter a name for the new workspace");
    }

    const cleanQuestions = questions
      .filter((q) => q.prompt.trim())
      .map((q) => ({
        prompt: q.prompt.trim(),
        expectedAnswer: q.expectedAnswer?.trim() || undefined,
        weight: q.weight || 1,
      }));

    // Fold any half-typed email into the list on save.
    const allEmails = [...emails];
    const pending = emailInput.trim().toLowerCase();
    if (pending && /.+@.+\..+/.test(pending) && !allEmails.includes(pending)) {
      allEmails.push(pending);
    }

    const payload = {
      title: title.trim(),
      voice,
      voiceSpeed,
      systemInstruction: systemInstruction.trim(),
      scriptIntro: scriptIntro.trim() || undefined,
      webhookUrl: webhookUrl.trim() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      questions: cleanQuestions,
      invitedEmails: allEmails,
      workspaceId:
        workspaceChoice !== NEW_WS && workspaceChoice !== NO_WS
          ? Number(workspaceChoice)
          : null,
      newWorkspaceName:
        workspaceChoice === NEW_WS ? newWorkspaceName.trim() : undefined,
    };

    setSubmitting(true);
    try {
      if (flow) {
        await updateCallFlow(flow.id, payload);
        toast.success("Call flow updated");
      } else {
        await createCallFlow(payload);
        toast.success("Call flow created");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{flow ? "Edit call flow" : "New call flow"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Front-desk onboarding screening"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Voice</Label>
              <div className="flex gap-2">
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((v) => (
                      <SelectItem key={v} value={v} className="capitalize">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePreviewVoice}
                  disabled={previewing}
                  title="Listen to a sample"
                  aria-label="Listen to a sample"
                >
                  {previewing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tap play to hear this voice & speed.
              </p>
            </div>
            <div>
              <Label>Start date (optional)</Label>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 flex-1 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm transition-colors hover:border-foreground/20"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {scheduledAt ? (
                        new Date(scheduledAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground">Pick a date</span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-auto p-0">
                    <CalendarWidget
                      mode="single"
                      captionLayout="dropdown"
                      selected={scheduledAt ? new Date(scheduledAt) : undefined}
                      onSelect={(date) => {
                        if (!date) return setScheduledAt("");
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        const time = scheduledAt.slice(11, 16) || "09:00";
                        setScheduledAt(`${yyyy}-${mm}-${dd}T${time}`);
                      }}
                    />
                    {scheduledAt && (
                      <button
                        type="button"
                        onClick={() => setScheduledAt("")}
                        className="w-full border-t px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
                      >
                        Clear date
                      </button>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    aria-label="Start time"
                    className="w-[130px] pl-8"
                    value={scheduledAt.slice(11, 16) || ""}
                    onChange={(e) => {
                      const time = e.target.value || "09:00";
                      const datePart =
                        scheduledAt.slice(0, 10) ||
                        new Date().toISOString().slice(0, 10);
                      setScheduledAt(`${datePart}T${time}`);
                    }}
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Leave blank to allow calls anytime.
              </p>
            </div>
          </div>

          <div>
            <Label className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5" /> Talking speed
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {voiceSpeed.toFixed(2)}×
              </span>
            </Label>
            <input
              type="range"
              min={1}
              max={2}
              step={0.05}
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(Number(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Normal (1×)</span>
              <span>Faster (2×)</span>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Workspace
            </Label>
            <Select value={workspaceChoice} onValueChange={setWorkspaceChoice}>
              <SelectTrigger>
                <SelectValue placeholder="Where calls are logged as tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_WS}>No workspace (don't create tasks)</SelectItem>
                <SelectItem value={NEW_WS}>+ Create new workspace…</SelectItem>
                {workspaces.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {workspaceChoice === NEW_WS && (
              <Input
                className="mt-2"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="New workspace name"
              />
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Each completed call becomes a task here, assigned to the caller if their email matches a member.
            </p>
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Invited emails (optional)
            </Label>
            <div className="flex flex-wrap gap-1.5 rounded-md border p-2">
              {emails.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                onBlur={addEmail}
                placeholder={emails.length ? "" : "Type an email and press Enter"}
                className="min-w-[12rem] flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The people you expect to take this call. There's always an open shareable link too.
            </p>
          </div>

          <div>
            <Label>System instruction *</Label>
            <Textarea
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              rows={3}
              placeholder="How the AI interviewer should behave..."
            />
          </div>

          <div>
            <Label>Opening script (optional)</Label>
            <Textarea
              value={scriptIntro}
              onChange={(e) => setScriptIntro(e.target.value)}
              rows={2}
              placeholder="What the interviewer says to open the call..."
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add question
              </Button>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              Add an expected answer to have that question scored automatically (0–100). Leave it blank to skip scoring.
            </p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-md border p-3">
                  <div className="mb-2 flex items-start gap-2">
                    <span className="mt-2 text-xs font-medium text-muted-foreground">
                      {i + 1}.
                    </span>
                    <Input
                      value={q.prompt}
                      onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                      placeholder="Question prompt"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => removeQuestion(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[1fr_90px] gap-2 pl-6">
                    <Input
                      value={q.expectedAnswer ?? ""}
                      onChange={(e) =>
                        updateQuestion(i, { expectedAnswer: e.target.value })
                      }
                      placeholder="Expected answer (optional → enables scoring)"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={q.weight ?? 1}
                      onChange={(e) =>
                        updateQuestion(i, { weight: Number(e.target.value) || 1 })
                      }
                      placeholder="Weight"
                      title="Scoring weight"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Webhook URL (optional)</Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/calls"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Receives <code>call_flow.created</code> and <code>call.completed</code> (with scores) events.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : flow ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Results dialog ───────────────────────────────────────────────────

function ResultsDialog({ flow, onClose }: { flow: CallFlow; onClose: () => void }) {
  const [sessions, setSessions] = useState<CallSessionResult[] | null>(null);

  useEffect(() => {
    listCallFlowSessions(flow.id)
      .then(setSessions)
      .catch(() => toast.error("Failed to load results"));
  }, [flow.id]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{flow.title} — call results</DialogTitle>
        </DialogHeader>

        {flow.invitedEmails?.length ? (
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Expected callers</p>
            <div className="flex flex-wrap gap-1.5">
              {flow.invitedEmails.map((e) => {
                const did = sessions?.some((s) => s.callerEmail === e);
                return (
                  <span
                    key={e}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                      did
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {e}
                    {did ? " ✓" : " · pending"}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        {!sessions ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No calls completed yet.
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium">
                    {s.callerEmail || s.callerName || `Call #${s.id}`}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                    {s.taskId != null && (
                      <span className="ml-2 text-xs text-blue-600">
                        · logged as task #{s.taskId}
                      </span>
                    )}
                  </div>
                  {s.totalScore != null && (
                    <Badge variant="outline">Score: {Math.round(s.totalScore)}%</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {s.answers.map((a) => (
                    <div key={a.id} className="text-sm">
                      <p className="font-medium">{a.question.prompt}</p>
                      <p className="text-muted-foreground">{a.transcribedAnswer || "—"}</p>
                      {a.score != null && (
                        <p className="text-xs text-emerald-600">
                          {Math.round(a.score)}/100
                          {a.reasoning ? ` — ${a.reasoning}` : ""}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
