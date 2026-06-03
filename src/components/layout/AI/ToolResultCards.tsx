import { cn } from "@/lib/utils";
import type { AiChatResponse, ToolResult } from "@/lib/backend-api";
import {
  BarChart3,
  Check,
  Circle,
  ClipboardList,
  ExternalLink,
  FolderOpen,
  Layers,
  Megaphone,
  MessageSquare,
  Send,
  Sparkles,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

function isRecord(v: unknown): v is Record<string, unknown> { return Boolean(v) && typeof v === "object" && !Array.isArray(v); }
function asArray(v: unknown): unknown[] | null { return Array.isArray(v) ? v : null; }

// ── Multi-step AI Plan Visualization ──

const TOOL_META: Record<string, { icon: ReactNode; label: string; category: string }> = {
  "workspace.create":       { icon: <FolderOpen className="h-3.5 w-3.5" />, label: "Create workspace", category: "Workspace" },
  "workspace.createBundle": { icon: <FolderOpen className="h-3.5 w-3.5" />, label: "Create workspace bundle", category: "Workspace" },
  "workspace.update":       { icon: <FolderOpen className="h-3.5 w-3.5" />, label: "Update workspace", category: "Workspace" },
  "workspace.delete":       { icon: <FolderOpen className="h-3.5 w-3.5" />, label: "Delete workspace", category: "Workspace" },
  "workspace.createTask":   { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Create task", category: "Task" },
  "workspace.updateTask":   { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Update task", category: "Task" },
  "workspace.moveTask":     { icon: <ClipboardList className="h-3.5 w-3.5" />, label: "Move task", category: "Task" },
  "workspace.completeTask": { icon: <Check className="h-3.5 w-3.5" />, label: "Complete task", category: "Task" },
  "workspace.deleteTask":   { icon: <X className="h-3.5 w-3.5" />, label: "Delete task", category: "Task" },
  "workspace.addCustomField": { icon: <Zap className="h-3.5 w-3.5" />, label: "Add custom field", category: "Workspace" },
  "workspace.addStatus":    { icon: <Zap className="h-3.5 w-3.5" />, label: "Add status column", category: "Workspace" },
  "workspace.inviteMember": { icon: <UserPlus className="h-3.5 w-3.5" />, label: "Invite member", category: "Workspace" },
  "social.createPost":      { icon: <Megaphone className="h-3.5 w-3.5" />, label: "Create post", category: "Social" },
  "social.createComment":   { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Add comment", category: "Social" },
  "social.sharePost":       { icon: <Megaphone className="h-3.5 w-3.5" />, label: "Share post", category: "Social" },
  "chat.createChannel":     { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Create channel", category: "Chat" },
  "chat.sendMessage":       { icon: <Send className="h-3.5 w-3.5" />, label: "Send message", category: "Chat" },
  "chat.inviteMember":      { icon: <UserPlus className="h-3.5 w-3.5" />, label: "Invite to channel", category: "Chat" },
  "automation.create":      { icon: <Zap className="h-3.5 w-3.5" />, label: "Create automation", category: "Automation" },
  "automation.test":        { icon: <Zap className="h-3.5 w-3.5" />, label: "Test automation", category: "Automation" },
  "timeRecord.clockIn":     { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Clock in", category: "Time" },
  "timeRecord.clockOut":    { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Clock out", category: "Time" },
  "timeRecord.requestLeave":{ icon: <Sparkles className="h-3.5 w-3.5" />, label: "Request leave", category: "Time" },
  "dashboard.getOverview":  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Get overview", category: "Analytics" },
  "dashboard.getInsights":  { icon: <BarChart3 className="h-3.5 w-3.5" />, label: "Get insights", category: "Analytics" },
};

function getToolMeta(tool: string) {
  if (TOOL_META[tool]) return TOOL_META[tool];
  const parts = tool.split(".");
  const label = parts.length > 1
    ? `${parts[1].replace(/([A-Z])/g, " $1").trim()}`
    : tool;
  return { icon: <Circle className="h-3.5 w-3.5" />, label, category: parts[0] || "Action" };
}

function describeStepInput(tool: string, input?: Record<string, unknown>): string {
  if (!input) return "";
  if (tool.includes("Task") || tool.includes("task")) {
    const title = input.title as string | undefined;
    const workspace = input.workspaceName as string | undefined;
    const parts: string[] = [];
    if (title) parts.push(`"${title}"`);
    if (workspace) parts.push(`in ${workspace}`);
    return parts.join(" ");
  }
  if (tool.includes("workspace") && tool.includes("create")) {
    return input.name ? `"${input.name}"` : "";
  }
  if (tool.includes("Post") || tool.includes("post")) {
    const content = input.content as string | undefined;
    return content ? `"${content.slice(0, 50)}${content.length > 50 ? "..." : ""}"` : "";
  }
  if (tool.includes("invite") || tool.includes("Invite")) {
    return (input.email as string) || (input.to as string) || "";
  }
  if (tool.includes("send") && tool.includes("Mail")) {
    return (input.to as string) || "";
  }
  return "";
}

export function PlanStepsView({ actions, results }: {
  actions: unknown[];
  results?: AiChatResponse["results"];
}) {
  if (!actions?.length) return null;

  const isBatch = actions.length >= 3;
  const categoryCounts: Record<string, number> = {};
  for (const a of actions) {
    if (!isRecord(a)) continue;
    const meta = getToolMeta(String(a.tool || ""));
    categoryCounts[meta.category] = (categoryCounts[meta.category] || 0) + 1;
  }

  return (
    <div className="mt-2 space-y-1">
      {isBatch && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mb-1.5">
          <Layers className="h-3 w-3" />
          <span>Batch operation — {actions.length} steps</span>
          <span className="text-muted-foreground font-normal">
            ({Object.entries(categoryCounts).map(([cat, n]) => `${n} ${cat.toLowerCase()}`).join(", ")})
          </span>
        </div>
      )}
      <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border overflow-hidden min-w-0">
        {actions.map((action, idx) => {
          if (!isRecord(action)) return null;
          const tool = String(action.tool || "");
          const input = isRecord(action.input) ? action.input : undefined;
          const meta = getToolMeta(tool);
          const desc = describeStepInput(tool, input as Record<string, unknown> | undefined);

          const result = results?.[idx];
          const isDone = result?.success === true;
          const isFailed = result != null && !result.success;

          return (
            <div
              key={`${tool}-${idx}`}
              className={cn(
                "flex items-start gap-1.5 px-2 py-1.5 text-[10px] min-w-0",
                isDone && "bg-emerald-50/50 dark:bg-emerald-950/20",
                isFailed && "bg-red-50/50 dark:bg-red-950/20",
              )}
            >
              <span className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold mt-0.5",
                isDone
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : isFailed
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
              )}>
                {isDone ? <Check className="h-2.5 w-2.5" /> : isFailed ? <X className="h-2.5 w-2.5" /> : idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="shrink-0 text-muted-foreground">{meta.icon}</span>
                  <span className="font-medium text-foreground">{meta.label}</span>
                </div>
                {desc && <div className="text-muted-foreground break-words mt-0.5">{desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  "TODO": "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "TO DO": "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "IN PROGRESS": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "IN_PROGRESS": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "DONE": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "COMPLETED": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status.toUpperCase()] ?? "bg-muted text-muted-foreground";
  return <span className={cn("rounded-full px-1.5 py-px text-[9px] font-medium", color)}>{status}</span>;
}

export function ToolResultCards({ results, navigate }: { results: ToolResult[]; navigate: (opts: { to: string; search?: Record<string, string> }) => void }) {
  const ok = (results ?? []).filter((r) => r?.success && r.data != null);
  if (!ok.length) return null;

  const cards: ReactNode[] = [];

  for (const item of ok) {
    const { tool, data } = item;

    if (tool === "workspace.list") {
      const arr = asArray(data);
      if (arr?.length) {
        cards.push(
          <div key="ws-list" className="mt-2 space-y-1.5">
            <div className="text-[11px] font-semibold text-foreground">Workspaces ({arr.length})</div>
            <div className="grid gap-1.5">
              {arr.slice(0, 8).map((w) => {
                if (!isRecord(w)) return null;
                const id = String(w.id ?? "");
                const name = String(w.name ?? "Workspace");
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate({ to: `/workspace/project/${id}`, search: { tab: "dashboard" } })}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] hover:bg-muted transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      <span className="font-medium truncate">{name}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>,
        );
      }
    }

    if (tool === "workspace.get" || tool === "workspace.createBundle") {
      if (isRecord(data)) {
        const name = String(data.name ?? "Workspace");
        const id = String(data.id ?? "");
        const columnsRaw = asArray(data.columns) ?? [];
        const taskRows = columnsRaw.flatMap((col) => {
          if (!isRecord(col)) return [];
          const colName = String(col.name ?? "Column");
          return (asArray(col.tasks) ?? []).map((t) => {
            if (!isRecord(t)) return null;
            return { id: String(t.id ?? ""), title: String(t.title ?? ""), status: colName, description: String(t.description ?? "") };
          }).filter(Boolean) as Array<{ id: string; title: string; status: string; description: string }>;
        });

        cards.push(
          <div key={`ws-${id}`} className="mt-2">
            <button
              type="button"
              onClick={() => navigate({ to: `/workspace/project/${id}`, search: { tab: "tasks" } })}
              className="w-full rounded-lg border border-border bg-background p-2 text-left hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[10px] font-semibold">{name}</span>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">{columnsRaw.length} columns · {taskRows.length} tasks</div>
            </button>
            {taskRows.length > 0 && (
              <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/60 border-b border-border">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold">Task</th>
                      <th className="px-2 py-1 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskRows.slice(0, 10).map((t) => (
                      <tr key={t.id} className="border-t border-border/50">
                        <td className="px-2 py-1 max-w-[140px] truncate">{t.title}</td>
                        <td className="px-2 py-1 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {taskRows.length > 10 && <div className="px-2 py-1 text-[11px] text-muted-foreground border-t">and {taskRows.length - 10} more...</div>}
              </div>
            )}
          </div>,
        );
      }
    }

    if (tool === "user.getProfile" && isRecord(data)) {
      cards.push(
        <div key="profile" className="mt-2">
          <div className="rounded-lg border border-border p-2 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-foreground">Your Profile</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {data.firstName ? <div><span className="text-muted-foreground">First Name:</span> <span className="font-medium">{String(data.firstName)}</span></div> : null}
              {data.lastName ? <div><span className="text-muted-foreground">Last Name:</span> <span className="font-medium">{String(data.lastName)}</span></div> : null}
              {data.email ? <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{String(data.email)}</span></div> : null}
              {data.role ? <div><span className="text-muted-foreground">Role:</span> <span className="font-medium">{String(data.role)}</span></div> : null}
              {data.country ? <div><span className="text-muted-foreground">Country:</span> <span className="font-medium">{String(data.country)}</span></div> : null}
              {data.bio ? <div className="col-span-2"><span className="text-muted-foreground">Bio:</span> <span className="font-medium">{String(data.bio)}</span></div> : null}
            </div>
          </div>
        </div>,
      );
    }

    if (tool === "user.updateProfile" && isRecord(data)) {
      cards.push(
        <div key="profile-updated" className="mt-2">
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1.5 text-[10px]">
            <Check className="h-3 w-3 text-emerald-600" />
            <span className="font-medium">Profile updated successfully</span>
          </div>
        </div>,
      );
    }

    if (tool === "workspace.getTask" && isRecord(data)) {
      cards.push(
        <div key="task-detail" className="mt-2">
          <div className="rounded-lg border border-border p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-foreground truncate">{String(data.title ?? "Untitled")}</h4>
              <StatusBadge status={String(data.status ?? "Unknown")} />
            </div>
            {data.description ? <p className="text-[11px] text-muted-foreground">{String(data.description)}</p> : null}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-muted-foreground">Workspace:</span> <span className="font-medium">{String(data.workspaceName ?? "")}</span></div>
              {data.assignee && isRecord(data.assignee) ? <div><span className="text-muted-foreground">Assignee:</span> <span className="font-medium">{String(data.assignee.name ?? "")}</span></div> : null}
              {data.createdAt ? <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{new Date(String(data.createdAt)).toLocaleDateString()}</span></div> : null}
              {data.updatedAt ? <div><span className="text-muted-foreground">Updated:</span> <span className="font-medium">{new Date(String(data.updatedAt)).toLocaleDateString()}</span></div> : null}
            </div>
          </div>
        </div>,
      );
    }

    if (tool === "workspace.listTasks" && isRecord(data)) {
      const wsName = String(data.workspaceName ?? "Workspace");
      const tasks = (asArray(data.tasks) ?? []).map((t) => {
        if (!isRecord(t)) return null;
        return { id: String(t.id ?? ""), title: String(t.title ?? ""), status: String(t.columnName ?? "Unknown"), description: String(t.description ?? "") };
      }).filter(Boolean) as Array<{ id: string; title: string; status: string; description: string }>;

      if (tasks.length) {
        cards.push(
          <div key="task-list" className="mt-2">
            <div className="text-[11px] font-semibold text-foreground mb-1.5">Tasks in {wsName} ({tasks.length})</div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold">Task</th>
                    <th className="px-2 py-1 text-left font-semibold">Status</th>
                    <th className="px-2 py-1 text-left font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 15).map((t) => (
                    <tr key={t.id} className="border-t border-border/50">
                      <td className="px-2 py-1 font-medium max-w-[140px] truncate">{t.title}</td>
                      <td className="px-2 py-1 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                      <td className="px-2 py-1 text-muted-foreground max-w-[120px] truncate">{t.description || "\u2014"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length > 15 && <div className="px-2 py-1 text-[11px] text-muted-foreground border-t">and {tasks.length - 15} more...</div>}
            </div>
          </div>,
        );
      }
    }

    if ((tool === "workspace.create" || tool === "workspace.update" || tool === "workspace.createTask") && isRecord(data)) {
      const name = String(data.name || data.title || "");
      const id = String(data.id ?? "");
      const isWs = tool.includes("workspace.create") && !tool.includes("Task");
      cards.push(
        <div key={`created-${id}`} className="mt-2">
          <button
            type="button"
            onClick={() => isWs ? navigate({ to: `/workspace/project/${id}`, search: { tab: "dashboard" } }) : undefined}
            className={cn("flex items-center gap-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1.5 text-[10px]", isWs && "hover:bg-emerald-100 dark:hover:bg-emerald-950/50 cursor-pointer")}
          >
            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
            <span className="font-medium truncate">{tool === "workspace.createTask" ? "Task created" : tool === "workspace.update" ? "Workspace updated" : "Workspace created"}: {name}</span>
            {isWs && <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />}
          </button>
        </div>,
      );
    }
  }

  if (!cards.length) return null;
  return <>{cards}</>;
}
