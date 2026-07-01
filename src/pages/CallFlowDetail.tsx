import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Link as LinkIcon,
  Loader2,
  Briefcase,
  Mail,
  Clock,
  Webhook,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Settings,
  ScrollText,
  Users,
  PanelRightClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCallFlow,
  listCallFlowSessions,
  type CallFlow,
  type CallSessionResult,
} from "@/lib/backend-api";

function callLinkFor(flow: CallFlow) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const ws = flow.workspaceId != null ? `?workspace=${flow.workspaceId}` : "";
  return `${origin}/call/${flow.publicToken}${ws}`;
}

export default function CallFlowDetail() {
  const params = useParams({ strict: false });
  const id = Number((params as { id?: string }).id);
  const navigate = useNavigate();

  const [flow, setFlow] = useState<CallFlow | null>(null);
  const [sessions, setSessions] = useState<CallSessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings panel slides in from the right of the Script card (hidden by default).
  const [settingsOpen, setSettingsOpen] = useState(false);

  // filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoredOnly, setScoredOnly] = useState("all");

  useEffect(() => {
    if (!id) return;
    Promise.all([getCallFlow(id), listCallFlowSessions(id)])
      .then(([f, s]) => {
        setFlow(f);
        setSessions(s);
      })
      .catch(() => toast.error("Failed to load call flow"))
      .finally(() => setLoading(false));
  }, [id]);

  const copyLink = useCallback(() => {
    if (!flow) return;
    void navigator.clipboard.writeText(callLinkFor(flow));
    toast.success("Call link copied");
  }, [flow]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (scoredOnly === "scored" && s.totalScore == null) return false;
      if (q) {
        const hay = `${s.callerEmail ?? ""} ${s.callerName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, query, statusFilter, scoredOnly]);

  // group by caller email/name for the Users tab
  const callers = useMemo(() => {
    const map = new Map<
      string,
      { key: string; email: string | null; name: string | null; calls: CallSessionResult[] }
    >();
    for (const s of filtered) {
      const key = (s.callerEmail || s.callerName || `#${s.id}`).toLowerCase();
      if (!map.has(key)) {
        map.set(key, { key, email: s.callerEmail, name: s.callerName, calls: [] });
      }
      map.get(key)!.calls.push(s);
    }
    return Array.from(map.values());
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate({ to: "/call-flows" })}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <p className="mt-6 text-center text-muted-foreground">Call flow not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/call-flows" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <Phone className="h-5 w-5" /> {flow.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {sessions.length} call{sessions.length === 1 ? "" : "s"} ·{" "}
              <Badge variant="outline" className="capitalize">{flow.voice}</Badge>
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <LinkIcon className="mr-1 h-4 w-4" /> Copy call link
        </Button>
      </div>

      {/* Details — Script with a Settings panel that slides in from the right */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Script (always visible) */}
            <div className="min-w-0 flex-1 space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Script
                </h3>
                {!settingsOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSettingsOpen(true)}
                    title="Show settings"
                    aria-label="Show settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">System instruction</p>
                <p className="whitespace-pre-wrap">{flow.systemInstruction}</p>
              </div>
              {flow.scriptIntro && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Opening script</p>
                  <p className="whitespace-pre-wrap">{flow.scriptIntro}</p>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Questions ({flow.questions?.length ?? 0})
                </p>
                <ol className="list-decimal space-y-2 pl-5">
                  {(flow.questions ?? []).map((q, i) => (
                    <li key={i}>
                      <span>{q.prompt}</span>
                      {q.expectedAnswer ? (
                        <span className="block text-xs text-emerald-600">
                          Expected: {q.expectedAnswer} · weight {q.weight ?? 1}
                        </span>
                      ) : (
                        <span className="block text-xs text-muted-foreground">Not scored</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Settings (slides in from the right) */}
            {settingsOpen && (
              <div className="w-full shrink-0 space-y-3 border-t bg-muted/10 p-5 text-sm duration-300 animate-in fade-in slide-in-from-right-6 md:max-w-xs md:border-l md:border-t-0">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSettingsOpen(false)}
                    title="Hide settings"
                    aria-label="Hide settings"
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Workspace:</span>
                  {flow.workspaceId != null ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm font-medium"
                      onClick={() =>
                        navigate({
                          to: "/workspace/project/$projectId",
                          params: { projectId: String(flow.workspaceId) },
                        })
                      }
                    >
                      {flow.workspace?.name ?? `#${flow.workspaceId}`}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </div>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {flow.scheduledAt
                    ? `Opens ${new Date(flow.scheduledAt).toLocaleString()}`
                    : "Open anytime"}
                </p>
                <p className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-muted-foreground" />
                  {flow.webhookUrl ? flow.webhookUrl : "No webhook"}
                </p>
                <div>
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> Invited emails
                  </p>
                  {flow.invitedEmails?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {flow.invitedEmails.map((e) => {
                        const did = sessions.some((s) => s.callerEmail === e);
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
                  ) : (
                    <p className="text-muted-foreground">None — open link only</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search caller name or email…"
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="ABANDONED">Abandoned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scoredOnly} onValueChange={setScoredOnly}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any score</SelectItem>
            <SelectItem value="scored">Scored only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs" className="gap-1.5">
            <ScrollText className="h-4 w-4" />
            Logs ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            Users ({callers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No calls match.</p>
          ) : (
            filtered.map((s) => <LogRow key={s.id} session={s} />)
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-4 space-y-3">
          {callers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No callers yet.</p>
          ) : (
            callers.map((c) => (
              <Card key={c.key}>
                <CardContent className="pt-5 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{c.email || c.name || "Anonymous"}</span>
                    <Badge variant="outline">
                      {c.calls.length} call{c.calls.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {c.calls.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {new Date(s.createdAt).toLocaleString()}
                          {s.taskId != null && ` · task #${s.taskId}`}
                        </span>
                        <span>
                          {s.totalScore != null ? `${Math.round(s.totalScore)}%` : s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LogRow({ session }: { session: CallSessionResult }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardContent className="pt-5 text-sm">
        <button
          className="flex w-full items-center justify-between text-left"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">
              {session.callerEmail || session.callerName || `Call #${session.id}`}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(session.createdAt).toLocaleString()}
            </span>
            {session.taskId != null && (
              <span className="text-xs text-blue-600">· task #{session.taskId}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{session.status}</Badge>
            {session.totalScore != null && (
              <Badge variant="outline">{Math.round(session.totalScore)}%</Badge>
            )}
          </div>
        </button>

        {open && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {session.summary && (
              <div className="rounded-md bg-primary/5 p-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Summary</p>
                <p className="text-sm">{session.summary}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Scored answers</p>
              {session.answers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No answers recorded.</p>
              ) : (
                session.answers.map((a) => (
                  <div key={a.id} className="mb-2">
                    <p className="font-medium">{a.question.prompt}</p>
                    <p className="text-muted-foreground">{a.transcribedAnswer || "—"}</p>
                    {a.score != null && (
                      <p className="text-xs text-emerald-600">
                        {Math.round(a.score)}/100
                        {a.reasoning ? ` — ${a.reasoning}` : ""}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
            {session.transcript?.length ? (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Full transcript</p>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md bg-muted/20 p-2 text-xs">
                  {session.transcript.map((t, i) => (
                    <p key={i}>
                      <span className="font-medium">
                        {t.role === "assistant" ? "Interviewer: " : "Caller: "}
                      </span>
                      <span className="text-muted-foreground">{t.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
