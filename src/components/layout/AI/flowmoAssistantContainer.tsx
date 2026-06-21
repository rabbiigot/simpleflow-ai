import loadingGif from "@/assets/loading.gif";
import logoOnly from "@/assets/logoOnly.png";
import CalendarEventCard from "./CalendarEventCard";
import GitHubEventCard from "./GitHubEventCard";
import { ToolResultCards } from "./ToolResultCards";
import TourGuide from "./TourGuide";
import { ImageWithLoader } from "@/components/ui/image-loader";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiEvents } from "@/hooks/use-ai-events";
import {
  chatAi,
  chatWithImage,
  getAiEnergy,
  type AiEnergyStatus,
  getCurrentUserId,
  getWorkspacesPaged,
  listAiTools,
  listNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  setNotificationPreference,
  type AiChatResponse,
  type NotificationData,
  type NotificationPreference,
  type ToolDefinition,
  type Workspace,
} from "@/lib/backend-api";
import {
  useNotificationSocket,
  type NotificationSocketEvent,
} from "@/hooks/use-notification-socket";
import { emitInvalidation } from "@/lib/invalidation";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import { useFlowmoStore } from "@/store/flowmo-store";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BellOff,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  Compass,
  ChevronRight,
  Circle,
  ClipboardList,
  Edit3,
  FolderOpen,
  Globe,
  ImagePlus,
  Layers,
  Loader2,
  Maximize2,
  Menu,
  MessageSquare,
  Megaphone,
  Mic,
  MicOff,
  MoreVertical,
  PenSquare,
  Pin,
  Send,
  Settings,
  Smile,
  Sparkles,
  Trash2,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import type { ReactNode } from "react";
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type FlowmoAssistantContainerProps = {
  aiState: "expanded" | "collapsed";
  toggleAI: () => void;
  /** When true, render as a drag-up bottom sheet instead of the fixed right panel. */
  isMobile?: boolean;
  /** On mobile, which view to open to when the sheet is expanded. */
  initialView?: "chat" | "notifications";
  /** Reports the live unread notification count up to the layout (mobile badge). */
  onUnreadCountChange?: (count: number) => void;
};

import type { ChatMessage } from "@/store/flowmo-store";

type SubCommand = {
  label: string;
  description: string;
  prompt: string;
};

type SlashCategory = {
  command: string;
  description: string;
  icon: ReactNode;
  subs: SubCommand[];
};

const SLASH_CATEGORIES: SlashCategory[] = [
  {
    command: "/task",
    description: "Manage tasks",
    icon: <ClipboardList className="h-4 w-4" />,
    subs: [
      { label: "List tasks", description: "Get all tasks in a workspace", prompt: "List all tasks in workspace [workspace name]" },
      { label: "Create task", description: "Create a single task", prompt: "Create a task titled [task title] in workspace [workspace name]" },
      { label: "Create multiple", description: "Create several tasks at once", prompt: "Create tasks in workspace [workspace name]: [task 1], [task 2], [task 3]" },
      { label: "Get task", description: "Get task details", prompt: "Get details of task [task title] in workspace [workspace name]" },
      { label: "Update task", description: "Update a task", prompt: "Update task [task title] description to [new description] in workspace [workspace name]" },
      { label: "Complete task", description: "Mark task as completed", prompt: "Complete task [task title] in workspace [workspace name]" },
      { label: "Move task", description: "Change task status", prompt: "Move task [task title] to [IN PROGRESS] in workspace [workspace name]" },
      { label: "Delete task", description: "Remove a task", prompt: "Delete task [task title] in workspace [workspace name]" },
    ],
  },
  {
    command: "/workspace",
    description: "Manage workspaces",
    icon: <FolderOpen className="h-4 w-4" />,
    subs: [
      { label: "List workspaces", description: "Get all your workspaces", prompt: "List my workspaces" },
      { label: "Create workspace", description: "Create a new workspace", prompt: "Create a workspace named [workspace name]" },
      { label: "Create with tasks", description: "Workspace + tasks in one go", prompt: "Create workspace [workspace name] with tasks: [task 1], [task 2], [task 3]" },
      { label: "Get workspace", description: "View workspace details", prompt: "Get workspace [workspace name]" },
      { label: "Update workspace", description: "Update name or description", prompt: "Update workspace [workspace name]" },
      { label: "Delete workspace", description: "Remove a workspace", prompt: "Delete workspace [workspace name]" },
      { label: "List members", description: "See workspace members", prompt: "List members of workspace [workspace name]" },
      { label: "Add status", description: "Add a custom column", prompt: "Add status [status name] to workspace [workspace name]" },
      { label: "Add custom field", description: "Add a field to workspace", prompt: "Add custom field [field name] to workspace [workspace name]" },
    ],
  },
  {
    command: "/post",
    description: "Social feed",
    icon: <Megaphone className="h-4 w-4" />,
    subs: [
      { label: "Get all posts", description: "View social feed", prompt: "Get all posts" },
      { label: "Create post", description: "Publish a new post", prompt: "Create a post saying [your message here]" },
      { label: "Update post", description: "Edit a post", prompt: "Update my post to say [new content]" },
      { label: "Delete post", description: "Remove a post", prompt: "Delete my latest post" },
      { label: "Comment", description: "Comment on a post", prompt: "Comment [your comment] on post" },
      { label: "Share post", description: "Share to channels", prompt: "Share post to channel [channel name]" },
    ],
  },
  {
    command: "/invite",
    description: "Invite users",
    icon: <UserPlus className="h-4 w-4" />,
    subs: [
      { label: "To workspace", description: "Invite user to workspace", prompt: "Invite [email@example.com] to workspace [workspace name]" },
      { label: "To channel", description: "Invite user to channel", prompt: "Invite [email@example.com] to channel [channel name]" },
    ],
  },
  {
    command: "/analytics",
    description: "Dashboard & insights",
    icon: <BarChart3 className="h-4 w-4" />,
    subs: [
      { label: "Overview", description: "Key metrics summary", prompt: "Show me my dashboard overview" },
      { label: "Insights", description: "Productivity insights", prompt: "Show me my productivity insights" },
      { label: "Reports", description: "Weekly reports", prompt: "Show me my weekly reports" },
    ],
  },
  {
    command: "/channel",
    description: "Chat channels",
    icon: <MessageSquare className="h-4 w-4" />,
    subs: [
      { label: "List channels", description: "View your channels", prompt: "List my channels" },
      { label: "Create channel", description: "Start a new channel", prompt: "Create a channel named [channel name]" },
      { label: "Send message", description: "Message a channel", prompt: "Send [your message] in channel [channel name]" },
      { label: "Get messages", description: "View channel messages", prompt: "Get messages from channel [channel name]" },
    ],
  },
  {
    command: "/automation",
    description: "Automations",
    icon: <Zap className="h-4 w-4" />,
    subs: [
      { label: "List automations", description: "View your automations", prompt: "List my automations" },
      { label: "Create automation", description: "Set up a new automation", prompt: "Create automation [name] when task is completed then send email" },
      { label: "Test automation", description: "Test-fire an automation", prompt: "Test automation [automation name]" },
    ],
  },
  {
    command: "/batch",
    description: "Batch operations",
    icon: <Layers className="h-4 w-4" />,
    subs: [
      { label: "Complete all tasks", description: "Mark all tasks as done", prompt: "Complete all tasks in workspace [workspace name]" },
      { label: "Move all tasks", description: "Move tasks to a column", prompt: "Move all tasks in [column name] to [target column] in workspace [workspace name]" },
      { label: "Create many tasks", description: "Create multiple tasks at once", prompt: "Create these tasks in workspace [workspace name]: [task 1], [task 2], [task 3], [task 4], [task 5]" },
      { label: "Invite multiple users", description: "Invite several people", prompt: "Invite these emails to workspace [workspace name]: [email1], [email2], [email3]" },
      { label: "Delete all tasks", description: "Remove all tasks in a column", prompt: "Delete all tasks in column [column name] in workspace [workspace name]" },
    ],
  },
  {
    command: "/profile",
    description: "Your profile",
    icon: <Bot className="h-4 w-4" />,
    subs: [
      { label: "Get profile", description: "View your profile info", prompt: "Show me my profile" },
      { label: "Update profile", description: "Edit your profile", prompt: "Update my profile bio to [your bio]" },
    ],
  },
];

function isTerminalStatus(status: AiChatResponse["status"]) {
  return (
    status === "success" ||
    status === "partial" ||
    status === "failed" ||
    status === "canceled" ||
    status === "no_action"
  );
}

function isConfirmationFollowupMessage(message: string) {
  const lower = message.trim().toLowerCase();
  return (
    lower === "yes" ||
    lower === "y" ||
    lower === "ok" ||
    lower === "okay" ||
    lower === "confirm" ||
    lower === "confirmed" ||
    lower === "execute" ||
    lower === "run it" ||
    lower === "go ahead" ||
    lower === "proceed" ||
    lower === "do it" ||
    lower === "cancel" ||
    lower === "stop" ||
    lower === "never mind" ||
    lower === "never mind." ||
    lower === "abort" ||
    lower.startsWith("clarification:")
  );
}

function bubbleBase(role: "user" | "assistant") {
  return cn(
    "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap overflow-hidden break-words min-w-0",
    role === "user"
      ? "bg-indigo-600 text-white rounded-br-sm"
      : "bg-card text-card-foreground border border-border rounded-bl-sm",
  );
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function AnalyticsDetailsToggle({ details }: { details: Array<{ tool: string; data: unknown }> }) {
  const [expanded, setExpanded] = useState(false);

  const workspaceAnalytics = details.find((d) => d.tool === "dashboard.getWorkspaceAnalytics");
  const overview = details.find((d) => d.tool === "dashboard.getOverview");
  const insights = details.find((d) => d.tool === "dashboard.getInsights");

  const overviewData = isRecord(overview?.data) ? overview.data : null;
  const insightsData = isRecord(insights?.data) ? insights.data : null;
  const wsData = isRecord(workspaceAnalytics?.data) ? asArray(workspaceAnalytics.data.workspaces) ?? [] : [];

  const summary = isRecord(overviewData?.summary) ? overviewData.summary : null;
  const metrics = isRecord(insightsData?.metrics) ? insightsData.metrics : null;

  if (!summary && !metrics && !wsData.length) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        {expanded ? "Hide details" : "View all details"}
      </button>

      {expanded && (
        <div className="mt-2 space-y-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground max-h-72 overflow-y-auto">
          {summary && (
            <div>
              <div className="font-semibold text-foreground mb-1">Overview</div>
              <div>Active workspaces: {String(summary.activeGoals ?? 0)}</div>
              <div>Tasks completed: {String(summary.tasksCompleted ?? 0)} / {String(summary.totalTasks ?? 0)}</div>
              <div>Success rate: {String(summary.successRate ?? 0)}%</div>
              <div>Monthly hours: {String(summary.monthlyHoursTracked ?? 0)}h</div>
            </div>
          )}

          {metrics && (
            <div>
              <div className="font-semibold text-foreground mb-1">Insights ({String(insightsData?.periodDays ?? 30)} days)</div>
              <div>Tasks completed: {String(metrics.tasksCompleted ?? 0)}</div>
              <div>Productivity score: {String(metrics.productivityScore ?? 0)}%</div>
              <div>Hours tracked: {String(metrics.hoursTracked ?? 0)}h</div>
              <div>Avg time per task: {String(metrics.avgTaskMinutes ?? 0)} min</div>
            </div>
          )}

          {wsData.length > 0 && (
            <div>
              <div className="font-semibold text-foreground mb-1">Workspaces</div>
              {wsData.map((ws) => {
                if (!isRecord(ws)) return null;
                const tasks = asArray(ws.tasks) ?? [];
                return (
                  <div key={String(ws.workspaceId)} className="mb-2 rounded border border-border bg-background p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{String(ws.workspaceName)}</span>
                      <span className="text-[11px] text-muted-foreground/70">{String(ws.completionRate ?? 0)}% done</span>
                    </div>
                    <div className="mt-0.5">
                      {String(ws.todoTasks ?? 0)} to do, {String(ws.inProgressTasks ?? 0)} in progress, {String(ws.completedTasks ?? 0)} completed
                    </div>
                    {tasks.length > 0 && (
                      <ul className="mt-1 space-y-0.5 pl-2">
                        {tasks.slice(0, 10).map((t) => {
                          if (!isRecord(t)) return null;
                          return (
                            <li key={String(t.id)}>
                              {String(t.title)} <span className="text-muted-foreground/60">· {String(t.status)}</span>
                              {t.assignee ? <span className="text-muted-foreground/60"> · {String(t.assignee)}</span> : null}
                            </li>
                          );
                        })}
                        {tasks.length > 10 && <li className="text-muted-foreground/60">and {tasks.length - 10} more...</li>}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Multi-step AI Plan Visualization ────────────────────────────

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

function PlanStepsView({ actions, results }: {
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
                "flex items-start gap-2 px-3 py-2 text-xs min-w-0",
                isDone && "bg-emerald-50/50 dark:bg-emerald-950/20",
                isFailed && "bg-red-50/50 dark:bg-red-950/20",
              )}
            >
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5",
                isDone
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : isFailed
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
              )}>
                {isDone ? <Check className="h-3 w-3" /> : isFailed ? <X className="h-3 w-3" /> : idx + 1}
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

// @ts-ignore — kept for future use
function _renderReadableToolResults(results: AiChatResponse["results"]) {
  const ok = (results ?? []).filter((r) => r?.success && r.data != null);
  if (!ok.length) return null;

  const lines: Array<{ title: string; body: ReactNode }> = [];

  for (const item of ok) {
    const tool = item.tool;
    const data = item.data;

    if (tool === "workspace.list") {
      const arr = asArray(data);
      if (arr) {
        const entries = arr
          .slice(0, 5)
          .map((w) =>
            isRecord(w)
              ? {
                  id: String(w.id ?? ""),
                  name: String(w.name ?? "Workspace"),
                }
              : null,
          )
          .filter(Boolean) as Array<{ id: string; name: string }>;

        if (entries.length) {
          lines.push({
            title: `Workspaces (${arr.length})`,
            body: (
              <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                {entries.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-medium">{w.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground/70">
                      {w.id}
                    </span>
                  </li>
                ))}
              </ul>
            ),
          });
        }
      }
    }

    if (tool === "workspace.get") {
      if (isRecord(data)) {
        const name = String(data.name ?? "Workspace");
        const id = String(data.id ?? "");
        const columnsRaw = asArray(data.columns) ?? [];
        const columns = columnsRaw.length;
        const tasks = columnsRaw.reduce<number>((sum, col) => {
          if (!isRecord(col)) return sum;
          return sum + (asArray(col.tasks)?.length ?? 0);
        }, 0);

        const taskRows = columnsRaw.flatMap((col) => {
          if (!isRecord(col)) return [];
          const columnName = String(col.name ?? "Column");
          const tasksInCol = asArray(col.tasks) ?? [];
          return tasksInCol
            .map((t) => {
              if (!isRecord(t)) return null;
              return {
                id: String(t.id ?? ""),
                title: String(t.title ?? "Untitled task"),
                description: String(t.description ?? ""),
                columnName,
              };
            })
            .filter(Boolean) as Array<{
            id: string;
            title: string;
            description: string;
            columnName: string;
          }>;
        });

        lines.push({
          title: "Workspace details",
          body: (
            <div className="mt-1 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{name}</span>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  {id}
                </span>
              </div>
              <div className="text-muted-foreground">
                {columns} column(s), {tasks} task(s)
              </div>
              {taskRows.length > 0 ? (
                <div className="mt-2 max-h-52 overflow-y-auto rounded border bg-muted p-2">
                  <ul className="space-y-1">
                    {taskRows.map((task) => (
                      <li key={`${task.id}-${task.columnName}`}>
                        <span className="font-medium">{task.title}</span>
                        <span className="text-muted-foreground/70">
                          {" "}
                          · {task.columnName}
                        </span>
                        {task.description ? (
                          <span className="text-muted-foreground/70">
                            {" "}
                            · {task.description}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-1 text-muted-foreground/70">
                  No tasks found in this workspace.
                </div>
              )}
            </div>
          ),
        });
      }
    }

    if (tool === "user.getProfile" && isRecord(data)) {
      lines.push({
        title: "Your Profile",
        body: (
          <div className="mt-1 rounded border bg-muted p-2 space-y-1 text-xs">
            {!!data.firstName && <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{String(data.firstName)} {String(data.lastName || "")}</span></div>}
            {!!data.email && <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{String(data.email)}</span></div>}
            {!!data.role && <div><span className="text-muted-foreground">Role:</span> <span className="font-medium">{String(data.role)}</span></div>}
            {!!data.bio && <div><span className="text-muted-foreground">Bio:</span> <span className="font-medium">{String(data.bio)}</span></div>}
          </div>
        ),
      });
    }

    if (tool === "workspace.getTask" && isRecord(data)) {
      lines.push({
        title: String(data.title ?? "Task Details"),
        body: (
          <div className="mt-1 rounded border bg-muted p-2 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{String(data.title ?? "")}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{String(data.status ?? "")}</span>
            </div>
            {!!data.description && <p className="text-muted-foreground">{String(data.description)}</p>}
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              {!!data.assignee && isRecord(data.assignee) && <div>Assignee: {String(data.assignee.name ?? "")}</div>}
              {!!data.workspaceName && <div>Workspace: {String(data.workspaceName)}</div>}
            </div>
          </div>
        ),
      });
    }

    if (tool === "workspace.listTasks" && isRecord(data)) {
      const workspaceName = String(data.workspaceName ?? "Workspace");
      const tasksRaw = asArray(data.tasks) ?? [];
      const taskRows = tasksRaw
        .map((t) => {
          if (!isRecord(t)) return null;
          return {
            id: String(t.id ?? ""),
            title: String(t.title ?? "Untitled task"),
            description: String(t.description ?? ""),
            columnName: String(t.columnName ?? "Unknown"),
          };
        })
        .filter(Boolean) as Array<{
        id: string;
        title: string;
        description: string;
        columnName: string;
      }>;

      lines.push({
        title: `Tasks in ${workspaceName} (${taskRows.length})`,
        body: (
          <div className="mt-1 max-h-56 overflow-y-auto rounded border bg-muted p-2">
            {taskRows.length ? (
              <ul className="space-y-1 text-xs text-muted-foreground">
                {taskRows.map((task) => (
                  <li key={`${task.id}-${task.title}`} className="truncate">
                    <span className="font-medium">{task.title.length > 30 ? task.title.slice(0, 30) + "…" : task.title}</span>
                    <span className="text-muted-foreground/70 whitespace-nowrap">
                      {" "}
                      · {task.columnName}
                    </span>
                    {task.description ? (
                      <span className="text-muted-foreground/70">
                        {" "}
                        · {task.description}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-muted-foreground/70">
                No tasks found.
              </div>
            )}
          </div>
        ),
      });
    }

    if (tool === "workspace.create" || tool === "workspace.update") {
      if (isRecord(data)) {
        const name = String(data.name ?? "");
        const id = String(data.id ?? "");
        lines.push({
          title:
            tool === "workspace.create"
              ? "Workspace created"
              : "Workspace updated",
          body: (
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium">{name || "Workspace"}</span>{" "}
              <span className="font-mono text-[11px] text-muted-foreground/70">
                {id}
              </span>
            </div>
          ),
        });
      }
    }

    if (tool === "workspace.createBundle") {
      if (isRecord(data)) {
        const name = String(data.name ?? "Workspace");
        const id = String(data.id ?? "");
        const columnsRaw = asArray(data.columns) ?? [];
        const tasks = columnsRaw.reduce<number>((sum, col) => {
          if (!isRecord(col)) return sum;
          return sum + (asArray(col.tasks)?.length ?? 0);
        }, 0);

        lines.push({
          title: "Workspace created with tasks",
          body: (
            <div className="mt-1 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{name}</span>
                <span className="font-mono text-[11px] text-muted-foreground/70">
                  {id}
                </span>
              </div>
              <div className="text-muted-foreground">
                {tasks} task(s) created
              </div>
            </div>
          ),
        });
      }
    }

    if (tool === "workspace.createTask") {
      if (isRecord(data)) {
        const title = String(data.title ?? "Task");
        const id = String(data.id ?? "");
        lines.push({
          title: "Task created",
          body: (
            <div className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium">{title}</span>{" "}
              <span className="font-mono text-[11px] text-muted-foreground/70">
                {id}
              </span>
            </div>
          ),
        });
      }
    }
  }

  if (!lines.length) return null;

  return (
    <div className="mt-3 rounded-md border border-border bg-card px-3 py-2">
      <div className="text-xs font-semibold text-foreground">Summary</div>
      <div className="mt-1 space-y-2">
        {lines.map((l, idx) => (
          <div key={`${l.title}-${idx}`}>
            <div className="text-xs font-semibold text-foreground">
              {l.title}
            </div>
            {l.body}
          </div>
        ))}
      </div>
    </div>
  );
}

const FlowmoAssistantContainer: React.FC<FlowmoAssistantContainerProps> = ({
  aiState,
  toggleAI,
  isMobile = false,
  initialView = "chat",
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const dragControls = useDragControls();
  const user = useAuthStore((store) => store.user);
  const displayName = (user?.firstName || "").trim() || "there";

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [energy, setEnergy] = useState<AiEnergyStatus | null>(null);
  const refreshEnergy = useCallback(() => {
    const uid = getCurrentUserId();
    if (!uid) return;
    getAiEnergy(uid)
      .then(setEnergy)
      .catch(() => setEnergy(null));
  }, []);
  useEffect(() => {
    refreshEnergy();
  }, [refreshEnergy]);
  const [, setTools] = useState<ToolDefinition[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<SlashCategory | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // ── Voice input state ──
  const [isRecording, setIsRecording] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const sendMessageRef = useRef<(raw: string, imageFile?: File | null) => Promise<void>>(undefined);
  const voiceSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Use refs for cross-referencing between voice functions to avoid circular deps
  const wakeWordEnabledRef = useRef(wakeWordEnabled);
  wakeWordEnabledRef.current = wakeWordEnabled;

  const startWakeWordListenerRef = useRef<() => void>(undefined);
  const startCommandRecordingRef = useRef<() => void>(undefined);

  function getSpeechCtor(): (new () => any) | null {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }

  // Convert spoken number words to digits in a transcript.
  // Handles "one" → "1", "twenty three" → "23", "one hundred" → "100", ordinals, etc.
  function wordsToNumbers(text: string): string {
    const ones: Record<string, number> = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
      eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
      fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
      nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
      seventy: 70, eighty: 80, ninety: 90,
    };
    const magnitudes: Record<string, number> = {
      hundred: 100, thousand: 1000, million: 1000000, billion: 1000000000,
    };
    const ordinals: Record<string, string> = {
      first: "1st", second: "2nd", third: "3rd", fourth: "4th", fifth: "5th",
      sixth: "6th", seventh: "7th", eighth: "8th", ninth: "9th", tenth: "10th",
      eleventh: "11th", twelfth: "12th", thirteenth: "13th", fourteenth: "14th",
      fifteenth: "15th", sixteenth: "16th", seventeenth: "17th", eighteenth: "18th",
      nineteenth: "19th", twentieth: "20th", thirtieth: "30th",
    };

    const allNumberWords = new Set([
      ...Object.keys(ones), ...Object.keys(magnitudes), "and",
    ]);

    const words = text.split(/\s+/);
    const result: string[] = [];
    let i = 0;

    while (i < words.length) {
      const w = words[i].toLowerCase().replace(/[^a-z]/g, "");

      // Check ordinals first
      if (ordinals[w]) {
        result.push(ordinals[w]);
        i++;
        continue;
      }

      // If not a number word, pass through
      if (!allNumberWords.has(w) || w === "and") {
        result.push(words[i]);
        i++;
        continue;
      }

      // Collect consecutive number words and convert
      let current = 0;
      let total = 0;

      while (i < words.length) {
        const word = words[i].toLowerCase().replace(/[^a-z]/g, "");

        if (word === "and" && i + 1 < words.length) {
          const next = words[i + 1].toLowerCase().replace(/[^a-z]/g, "");
          if (allNumberWords.has(next) && next !== "and") {
            i++;
            continue;
          }
          break;
        }

        if (ones[word] !== undefined) {
          current += ones[word];
          i++;
        } else if (word === "hundred") {
          current = (current === 0 ? 1 : current) * 100;
          i++;
        } else if (word === "thousand" || word === "million" || word === "billion") {
          current = (current === 0 ? 1 : current) * magnitudes[word];
          total += current;
          current = 0;
          i++;
        } else {
          break;
        }
      }

      total += current;
      result.push(String(total));
    }

    return result.join(" ");
  }

  /**
   * Normalize voice transcript for better AI understanding.
   * - Converts ambiguous homophones in context ("for" → "4" after alphanumeric)
   * - Adds punctuation to separate multi-command sentences
   * - Normalizes filler phrases into clearer instructions
   */
  function normalizeVoiceTranscript(text: string): string {
    let t = text;

    // "for" → "4" when preceded by a digit or alphanumeric token like "Q2 Sprint"
    // e.g. "Sprint for" → "Sprint 4", "Q2 for" → "Q2 4"
    t = t.replace(/(\w)\s+for\b(?!\s+(?:the|a|an|this|that|my|our|each|every|all|any|some|it|you|me|them|us|creating|making|adding|fixing|updating|deleting|building))/gi,
      "$1 4");

    // Split multi-command sentences: "And create" / "And add" / "And also" → ". Create" / ". Add"
    t = t.replace(/\band\s+(create|add|make|build|move|delete|remove|update|fix|invite|send)\b/gi,
      ". $1");
    t = t.replace(/\band\s+also\s+(create|add|make|build|move|delete|remove|update|fix|invite|send)\b/gi,
      ". $1");

    // "under this workspace" / "in this workspace" / "in that workspace" → "in that workspace"
    t = t.replace(/\bunder\s+this\s+workspace\b/gi, "in that workspace");
    t = t.replace(/\bunder\s+that\s+workspace\b/gi, "in that workspace");
    t = t.replace(/\bunder\s+the\s+workspace\b/gi, "in that workspace");

    // "title [X]" after "task" context → "with title [X]"
    // e.g. "create a task title Fix login" → "create a task with title Fix login"
    t = t.replace(/\btask\s+title\b/gi, "task with title");

    // "name [X]" after "workspace" context → "named [X]"
    // e.g. "workspace name Q2" → "workspace named Q2"
    t = t.replace(/\bworkspace\s+name\b/gi, "workspace named");

    // Clean up double spaces
    t = t.replace(/\s{2,}/g, " ").trim();

    return t;
  }

  // Retry restarting the wake-word listener with exponential backoff.
  // Browsers can temporarily block mic access after stopping recognition,
  // so we retry a few times with increasing delays.
  function restartWakeWordWithRetry(attempt = 0) {
    const MAX_RETRIES = 4;
    const delays = [500, 1000, 2000, 4000];
    if (attempt >= MAX_RETRIES || !wakeWordEnabledRef.current) return;
    if (recognitionRef.current) return; // command recording took over

    setTimeout(() => {
      // If already restarted by heartbeat or another path, skip
      if (wakeRecognitionRef.current || recognitionRef.current) return;
      if (!wakeWordEnabledRef.current) return;

      startWakeWordListenerRef.current?.();

      // Check shortly after if it actually started; if not, retry
      setTimeout(() => {
        if (
          wakeWordEnabledRef.current &&
          !wakeRecognitionRef.current &&
          !recognitionRef.current
        ) {
          restartWakeWordWithRetry(attempt + 1);
        }
      }, 300);
    }, delays[attempt]);
  }

  // Start command recognition (manual tap or wake-word triggered).
  // When the user stops speaking the final transcript is auto-sent.
  const startCommandRecording = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) return;

    // Fully stop any existing recognition before starting fresh
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
    try { wakeRecognitionRef.current?.abort(); } catch {}
    wakeRecognitionRef.current = null;
    setWakeWordListening(false);
    finalTranscriptRef.current = "";

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Auto-send after 2 seconds of silence
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    const SILENCE_DELAY = 2000;

    const clearSilenceTimer = () => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    };

    const resetSilenceTimer = () => {
      clearSilenceTimer();
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, SILENCE_DELAY);
    };

    recognition.onresult = (event: any) => {
      const finalParts: string[] = [];
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalParts.push(t);
        } else {
          interim = interim ? `${interim} ${t}` : t;
        }
      }
      const final_ = finalParts.join(" ");
      const raw = final_ ? (interim ? `${final_} ${interim}` : final_) : interim;
      // Convert spoken number words to digits in real-time
      const displayText = wordsToNumbers(raw);
      if (final_) finalTranscriptRef.current = wordsToNumbers(final_);
      setInputText(displayText);
      // Reset the 2-second silence timer on every new speech result
      resetSilenceTimer();
    };

    recognition.onend = () => {
      clearSilenceTimer();
      setIsRecording(false);
      recognitionRef.current = null;
      const raw = finalTranscriptRef.current.trim();
      if (raw) {
        const text = normalizeVoiceTranscript(raw);
        setInputText("");
        sendMessageRef.current?.(text);
      }
      finalTranscriptRef.current = "";
      // Restart wake-word listener if enabled — use multiple retries
      if (wakeWordEnabledRef.current) {
        restartWakeWordWithRetry();
      }
    };

    recognition.onerror = () => {
      clearSilenceTimer();
      setIsRecording(false);
      recognitionRef.current = null;
      finalTranscriptRef.current = "";
      if (wakeWordEnabledRef.current) {
        restartWakeWordWithRetry();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    // Start initial silence timer — if user says nothing for 2s, stop
    resetSilenceTimer();
  }, []);
  startCommandRecordingRef.current = startCommandRecording;

  // Toggle manual voice: tap to record, tap again to stop (which auto-sends)
  const toggleVoice = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop(); // onend will auto-send
      return;
    }
    wakeRecognitionRef.current?.abort();
    setWakeWordListening(false);
    startCommandRecording();
  }, [isRecording, startCommandRecording]);

  // ── "Hey Flow" wake-word listener ──
  const startWakeWordListener = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    // Don't start if command recording is active
    if (recognitionRef.current) return;

    // Clean up any previous wake listener
    try { wakeRecognitionRef.current?.abort(); } catch {}
    wakeRecognitionRef.current = null;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().replace(/[^a-z ]/g, "").trim();
        // Match wake words and common misrecognitions
        const WAKE_PHRASES = [
          // "hey flow" variants
          "hey flow", "hey flo", "hey flowmo",
          // "hello" variants
          "hello flow", "hello flo", "hello flowmo",
          // "hi" variants
          "hi flow", "hi flo", "hi flowmo",
          // Short triggers — just the name
          "flowmo", "flow mo",
          // Common speech-to-text misrecognitions
          "hey slow", "hey glow", "hey blow", "a flow",
          "hello slow", "hello glow",
          "hi slow", "hi glow",
          "ok flow", "ok flo", "ok flowmo",
          "hey flomo", "hello flomo", "hi flomo",
          "hey floe", "hello floe", "hi floe",
          "hey flaw", "hey flour",
          "a flowmo", "a flo",
          "hey fomo", "hello fomo",
        ];
        // Exact-match short words that are too common for substring matching
        const EXACT_WAKE_WORDS = ["flow", "flo"];
        if (
          WAKE_PHRASES.some((phrase) => transcript.includes(phrase)) ||
          EXACT_WAKE_WORDS.includes(transcript)
        ) {
          // Stop wake listener cleanly, then start command recording
          try { recognition.abort(); } catch {}
          wakeRecognitionRef.current = null;
          setWakeWordListening(false);
          // Small delay to let the browser release the mic before re-acquiring
          setTimeout(() => startCommandRecordingRef.current?.(), 200);
          return;
        }
      }
    };

    recognition.onend = () => {
      wakeRecognitionRef.current = null;
      if (wakeWordEnabledRef.current && !recognitionRef.current) {
        // Restart immediately — keep wakeWordListening true to avoid UI flicker
        restartWakeWordWithRetry(0);
      } else {
        setWakeWordListening(false);
      }
    };

    recognition.onerror = (e: any) => {
      wakeRecognitionRef.current = null;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setWakeWordListening(false);
      } else if (wakeWordEnabledRef.current && !recognitionRef.current) {
        restartWakeWordWithRetry(0);
      } else {
        setWakeWordListening(false);
      }
    };

    wakeRecognitionRef.current = recognition;
    try {
      recognition.start();
      setWakeWordListening(true);
    } catch {
      wakeRecognitionRef.current = null;
      setWakeWordListening(false);
    }
  }, []);
  startWakeWordListenerRef.current = startWakeWordListener;

  // Start/stop wake-word listener when toggle changes.
  // Also runs a heartbeat to recover if the browser silently kills recognition.
  useEffect(() => {
    if (wakeWordEnabled && voiceSupported) {
      startWakeWordListener();

      // Heartbeat: every 3s, check if wake listener died while it should be running
      const heartbeat = setInterval(() => {
        if (
          wakeWordEnabledRef.current &&
          !recognitionRef.current &&
          !wakeRecognitionRef.current
        ) {
          startWakeWordListenerRef.current?.();
        }
      }, 3000);

      return () => {
        clearInterval(heartbeat);
        try { wakeRecognitionRef.current?.abort(); } catch {}
        wakeRecognitionRef.current = null;
      };
    }

    try { wakeRecognitionRef.current?.abort(); } catch {}
    wakeRecognitionRef.current = null;
    setWakeWordListening(false);
    return undefined;
  }, [wakeWordEnabled, voiceSupported, startWakeWordListener]);

  const toggleWakeWord = useCallback((enabled: boolean) => {
    setWakeWordEnabled(enabled);
  }, []);

  const allMessages = useFlowmoStore((s) => s.messages);
  const setMessages = useFlowmoStore((s) => s.setMessages);
  const CHAT_PAGE_SIZE = 10;
  const [chatVisibleCount, setChatVisibleCount] = useState(CHAT_PAGE_SIZE);
  const [isLoadingOlderChat, setIsLoadingOlderChat] = useState(false);
  const skipChatScrollRef = useRef(false);
  const hasOlderChatMessages = allMessages.length > chatVisibleCount;
  const messages = useMemo(() => {
    if (allMessages.length <= chatVisibleCount) return allMessages;
    return allMessages.slice(allMessages.length - chatVisibleCount);
  }, [allMessages, chatVisibleCount]);
  const pendingConfirmationId = useFlowmoStore((s) => s.pendingConfirmationId);
  const saveConfirmationId = useFlowmoStore((s) => s.saveConfirmationId);
  const sessionId = useFlowmoStore((s) => s.sessionId);
  const saveSessionId = useFlowmoStore((s) => s.saveSessionId);
  const startNewSession = useFlowmoStore((s) => s.startNewSession);
  const loadSession = useFlowmoStore((s) => s.loadSession);
  const deleteSessionHistory = useFlowmoStore((s) => s.deleteSessionHistory);
  const renameSession = useFlowmoStore((s) => s.renameSession);
  const sessionHistory = useFlowmoStore((s) => s.sessionHistory);
  const activeHistoryId = useFlowmoStore((s) => s.activeHistoryId);

  const [showSessionSidebar, setShowSessionSidebar] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [kebabOpenId, setKebabOpenId] = useState<string | null>(null);

  const [rightPanelView, setRightPanelView] = useState<
    "chat" | "notifications" | "settings" | "tour"
  >("chat");
  const [flowmoIconSlidingOut, setFlowmoIconSlidingOut] = useState(false);
  const handleBackToChat = useCallback(() => {
    setFlowmoIconSlidingOut(true);
    setTimeout(() => {
      setRightPanelView("chat");
      setFlowmoIconSlidingOut(false);
    }, 200);
  }, []);
  const [timezone, setTimezone] = useState(() => {
    if (typeof window === "undefined")
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (
      localStorage.getItem("simpleflow_timezone") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  });

  // Notification state
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPreferences, setNotifPreferences] = useState<NotificationPreference[]>([]);
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);

  const currentUserId = getCurrentUserId();
  const {
    unreadCount: wsUnreadCount,
    setUnreadCount: setWsUnreadCount,
    addListener: addNotifListener,
  } = useNotificationSocket(currentUserId);

  // Fetch unread count on mount so the badge shows immediately
  useEffect(() => {
    if (!currentUserId) return;
    getUnreadNotificationCount()
      .then((res) => setWsUnreadCount(res.unreadCount ?? 0))
      .catch(() => {});
  }, [currentUserId, setWsUnreadCount]);

  // Report the unread count up to the layout (drives the mobile top-bar badge).
  useEffect(() => {
    onUnreadCountChange?.(wsUnreadCount);
  }, [wsUnreadCount, onUnreadCountChange]);

  // On mobile, jump to the requested view each time the sheet is opened.
  useEffect(() => {
    if (isMobile && aiState === "expanded") {
      setRightPanelView(initialView);
    }
  }, [isMobile, aiState, initialView]);

  // Fetch notifications on panel open
  useEffect(() => {
    if (rightPanelView !== "notifications") return;
    setNotifLoading(true);
    listNotifications({ pageSize: 50 })
      .then((res) => {
        setNotifications(res.items ?? []);
        setWsUnreadCount(res.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [rightPanelView, setWsUnreadCount]);

  // Listen for real-time notifications
  useEffect(() => {
    return addNotifListener((event: NotificationSocketEvent) => {
      if (event.type === "new_notification" && event.notification) {
        const notif = event.notification;

        // Only add non-GitHub notifications to the notification panel
        // GitHub PR events go directly to Flowmo chat instead
        // Calendar events show in both notifications AND chat
        if (notif.type !== "GITHUB_EVENT") {
          setNotifications((prev) => [notif, ...prev]);
        }

        // Push calendar events into Flowmo chat — skip duplicates
        if (notif.type === "CALENDAR_EVENT") {
          const calId = `calendar-${notif.id}`;
          setMessages((prev) => {
            if (prev.some((m) => m.id === calId)) return prev;
            const msg = notif.message || "";
            const locationMatch = msg.match(/---location:(.+)/);
            const meetMatch = msg.match(/---meet:(.+)/);
            const timeLine = msg.split("\n")[0] || "";
            return [
              ...prev,
              {
                id: calId,
                role: "assistant",
                type: "calendar_event",
                title: notif.title,
                time: timeLine,
                location: locationMatch?.[1] || null,
                meetLink: meetMatch?.[1] || null,
                createdAt: Date.now(),
              } as ChatMessage,
            ];
          });
        }

        // Push only PR events into Flowmo chat (skip pushes/commits)
        if (notif.type === "GITHUB_EVENT" && notif.title?.includes("PR #")) {
          const prMatch = notif.title.match(/^PR #(\d+) (\w+): (.+)$/);
          const prNumber = prMatch ? Number(prMatch[1]) : null;
          const action = prMatch ? prMatch[2] : null;
          const prTitle = prMatch ? prMatch[3] : notif.title;

          // Parse metadata from message
          const msg = notif.message || "";
          const repoLine = msg.match(/---repo:(.+)/);
          const urlLine = msg.match(/---url:(.+)/);
          const authorLine = msg.match(/---author:(.+)/);
          const shaLine = msg.match(/---sha:(.+)/);
          const bodyText = msg.split("\n---")[0].trim();

          setMessages((prev) => {
            // Check if a card for this PR already exists (any action)
            const existingIdx = prev.findIndex(
              (m) => m.type === "github_event" && (m as any).prNumber === prNumber && (m as any).repoFullName === (repoLine?.[1] || ""),
            );

            if (existingIdx !== -1) {
              // Update existing card with new action (e.g. opened → merged)
              const updated = [...prev];
              updated[existingIdx] = {
                ...updated[existingIdx],
                action,
                createdAt: Date.now(),
              } as ChatMessage;
              return updated;
            }

            return [
              ...prev,
              {
                id: `github-pr-${prNumber}-${action}-${Date.now()}`,
                role: "assistant",
                type: "github_event",
                eventType: "pull_request",
                action,
                title: prTitle,
                body: bodyText || null,
                prNumber,
                repoFullName: repoLine?.[1] || "",
                url: urlLine?.[1] || "",
                authorLogin: authorLine?.[1] || "",
                sha: shaLine?.[1] || "",
                createdAt: Date.now(),
              } as ChatMessage,
            ];
          });
        }
      }
      if (event.type === "notifications_read") {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    });
  }, [addNotifListener, setMessages]);

  // Fetch notification preferences
  useEffect(() => {
    if (!showNotifPrefs) return;
    getNotificationPreferences()
      .then(setNotifPreferences)
      .catch(() => {});
  }, [showNotifPrefs]);

  const handleMarkAsRead = useCallback(async (id: number) => {
    await markNotificationAsRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setWsUnreadCount((c) => Math.max(0, c - 1));
  }, [setWsUnreadCount]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsAsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setWsUnreadCount(0);
  }, [setWsUnreadCount]);

  const handleToggleMute = useCallback(async (boardId: number, currentlyMuted: boolean) => {
    const updated = await setNotificationPreference(boardId, !currentlyMuted).catch(() => null);
    if (updated) {
      setNotifPreferences((prev) =>
        prev.map((p) => (p.boardId === boardId ? { ...p, muted: !currentlyMuted } : p)),
      );
    }
  }, []);

  const { events, isConnected: wsConnected } = useAiEvents();
  const [apiOnline, setApiOnline] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Check if API is reachable (tools endpoint acts as health check)
  useEffect(() => {
    listAiTools()
      .then((t) => {
        setApiOnline(true);
        setTools(t);
      })
      .catch(() => setApiOnline(false));

    const userId = getCurrentUserId() || undefined;
    getWorkspacesPaged({ userId, pageSize: 100, excludeStatus: ["archived"] })
      .then((res) => setWorkspaces(res.items))
      .catch(() => {});
  }, []);

  const isConnected = wsConnected || apiOnline;

  // Tools are loaded in the health-check effect above

  useEffect(() => {
    if (skipChatScrollRef.current) { skipChatScrollRef.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, aiState]);

  const sendMessage = async (raw: string, imageFile?: File | null) => {
    const text = raw.trim();
    if ((!text && !imageFile) || isSending) return;

    const displayText = imageFile
      ? `${text || "Analyze this image and create tasks"}${pendingImagePreview ? "" : ""}`
      : text;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        type: "text",
        text: displayText,
        createdAt: Date.now(),
        ...(imageFile ? { imagePreview: pendingImagePreview ?? undefined } : {}),
      } as ChatMessage,
    ]);
    setIsSending(true);

    // Clear image state but keep the preview URL alive for the chat bubble
    const imageToSend = imageFile || null;
    setPendingImage(null);
    setPendingImagePreview(null);

    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error(
          "No signed-in user id found. Please sign up or log in again.",
        );
      }

      const context: Record<string, unknown> = { userId: currentUserId };
      if (selectedWorkspace) {
        context.workspaceName = selectedWorkspace.name;
        context.workspaceId = selectedWorkspace.id;
      }

      let result: AiChatResponse;

      if (imageToSend) {
        // Image upload path — use vision API
        result = await chatWithImage(
          imageToSend,
          text || undefined,
          context,
          true,
        );
      } else {
        // Normal text chat path
        const shouldUsePendingConfirmation =
          Boolean(pendingConfirmationId) && isConfirmationFollowupMessage(text);
        const confirmationIdToSend = shouldUsePendingConfirmation
          ? (pendingConfirmationId ?? undefined)
          : undefined;
        if (pendingConfirmationId && !shouldUsePendingConfirmation) {
          saveConfirmationId(null);
        }
        result = await chatAi(
          text,
          context,
          confirmationIdToSend,
          true,
          sessionId ?? undefined,
        );
      }

      // Persist the session ID so follow-up messages stay in the same session
      if (result.sessionId != null) {
        saveSessionId(result.sessionId);
      }

      if (result.status === "confirmation_required" && result.confirmationId) {
        saveConfirmationId(result.confirmationId);
      } else if (isTerminalStatus(result.status)) {
        saveConfirmationId(null);
      }

      if (isTerminalStatus(result.status)) {
        const tags = new Set<string>();
        const toolsRun = (result.results ?? [])
          .filter((r) => r.success)
          .map((r) => r.tool);

        for (const tool of toolsRun) {
          if (tool.startsWith("workspace.")) tags.add("workspaces");
          if (tool.startsWith("social.")) tags.add("social");
          if (tool.startsWith("timeRecord.")) tags.add("timeRecords");
        }

        emitInvalidation(Array.from(tags), toolsRun);

        if (tags.has("workspaces")) {
          const uid = getCurrentUserId() || undefined;
          getWorkspacesPaged({ userId: uid, pageSize: 100, excludeStatus: ["archived"] })
            .then((res) => setWorkspaces(res.items))
            .catch(() => {});
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          type: "response",
          response: result,
          createdAt: Date.now(),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to execute AI chat orchestration.";

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          type: "error",
          text: message,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
      refreshEnergy();
    }
  };

  // Keep ref in sync so voice auto-send can call sendMessage
  sendMessageRef.current = sendMessage;

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
    // Reset file input so re-selecting the same file works
    event.target.value = "";
  };

  const clearPendingImage = () => {
    setPendingImage(null);
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
      setPendingImagePreview(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = inputText;
    const image = pendingImage;
    setInputText("");
    setShowEmoji(false);
    setShowWorkspacePicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(value, image);
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const filteredCategories = useMemo(() => {
    if (!showSlashMenu || activeCategory) return [];
    const q = slashFilter.toLowerCase();
    return SLASH_CATEGORIES.filter(
      (cat) =>
        cat.command.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q),
    );
  }, [showSlashMenu, slashFilter, activeCategory]);

  const filteredSubs = useMemo(() => {
    if (!showSlashMenu || !activeCategory) return [];
    return activeCategory.subs;
  }, [showSlashMenu, activeCategory]);

  const menuItems = activeCategory ? filteredSubs : filteredCategories;
  const menuLength = menuItems.length;

  const resetSlashMenu = () => {
    setShowSlashMenu(false);
    setSlashFilter("");
    setSlashSelectedIndex(0);
    setActiveCategory(null);
  };

  const selectSubCommand = (sub: SubCommand) => {
    let prompt = sub.prompt;
    if (selectedWorkspace) {
      prompt = prompt
        .replace("[workspace name]", selectedWorkspace.name)
        .replace("in workspace " + selectedWorkspace.name, "in workspace " + selectedWorkspace.name);
    }
    setInputText(prompt);
    resetSlashMenu();
    requestAnimationFrame(() => {
      resizeTextarea();
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const match = /\[([^\]]+)\]/.exec(prompt);
      if (match) {
        el.setSelectionRange(match.index, match.index + match[0].length);
      }
    });
  };

  const selectCategory = (cat: SlashCategory) => {
    setActiveCategory(cat);
    setSlashSelectedIndex(0);
    setInputText("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu && menuLength > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashSelectedIndex((prev) => (prev < menuLength - 1 ? prev + 1 : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashSelectedIndex((prev) => (prev > 0 ? prev - 1 : menuLength - 1));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        if (activeCategory) {
          const sub = filteredSubs[slashSelectedIndex];
          if (sub) selectSubCommand(sub);
        } else {
          const cat = filteredCategories[slashSelectedIndex];
          if (cat) selectCategory(cat);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeCategory) {
          setActiveCategory(null);
          setSlashSelectedIndex(0);
          setInputText("/");
        } else {
          resetSlashMenu();
        }
        return;
      }
      if (event.key === "Backspace" && activeCategory && inputText === "") {
        event.preventDefault();
        setActiveCategory(null);
        setSlashSelectedIndex(0);
        setInputText("/");
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (inputText.trim() && !isSending) {
        void handleSubmit(event as unknown as FormEvent);
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setPendingImage(file);
        setPendingImagePreview(URL.createObjectURL(file));
        return;
      }
    }
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    resizeTextarea();

    if (activeCategory) return;

    if (value === "/") {
      setShowSlashMenu(true);
      setSlashFilter("");
      setSlashSelectedIndex(0);
    } else if (value.startsWith("/") && !value.includes(" ")) {
      setShowSlashMenu(true);
      setSlashFilter(value);
      setSlashSelectedIndex(0);
    } else {
      resetSlashMenu();
    }
  };

  const handleEmojiPick = (emoji: string) => {
    setInputText((prev) => `${prev}${emoji}`);
  };

  const thinkingLabel = useMemo(() => {
    if (!isSending) return "";
    const lastType = events[0]?.type;
    if (lastType === "ai_chat_planned") return "Planning";
    if (lastType === "ai_chat_started") return "Thinking";
    return "Thinking";
  }, [events, isSending]);

  // On mobile, the collapsed panel is hidden entirely — the top bar / bottom-nav
  // button toggles it open. When open it renders as a drag-up bottom sheet.
  // Desktop: always mounted. Mobile: only when expanded (slides in/out).
  const shouldRender = !isMobile || aiState === "expanded";

  return (
    <AnimatePresence>
      {isMobile && shouldRender && (
        <motion.div
          key="flowmo-backdrop"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={toggleAI}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {shouldRender && (
      <motion.div
        key="flowmo-panel"
        data-tour="flowmo-panel"
        drag={isMobile ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) toggleAI();
        }}
        initial={isMobile ? { y: "100%" } : false}
        animate={isMobile ? { y: 0 } : undefined}
        exit={isMobile ? { y: "100%" } : undefined}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className={cn(
          "p-0 bg-card border shadow-sm flex flex-col min-h-0 transition-[width] duration-200",
          isMobile
            ? "fixed inset-x-0 bottom-0 top-auto z-50 h-[90dvh] rounded-t-2xl"
            : `fixed top-0 right-0 rounded-none h-full z-40 ${
                aiState !== "expanded" ? "w-20" : "w-100"
              }`,
        )}
      >
        {isMobile && (
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="flex shrink-0 cursor-grab touch-none justify-center pt-2 pb-1 active:cursor-grabbing"
          >
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}
      {/* Minimized: vertical stack — Flowmo, Settings, Bell. Desktop only. */}
      {!isMobile && aiState !== "expanded" && (
        <div className="flex flex-col items-center gap-1 py-2">
          <button
            type="button"
            onClick={() => {
              toggleAI();
              setRightPanelView("chat");
            }}
            aria-label="Chat with Flowmo"
            className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/70"
          >
            <img
              src={loadingGif}
              alt="Flowmo"
              className="h-10 cursor-pointer"
            />
          </button>
          <div className="h-px w-8 bg-border" />
          <button
            type="button"
            onClick={() => {
              toggleAI();
              setRightPanelView("notifications");
            }}
            className="relative grid h-10 w-10 place-items-center rounded-md text-indigo-700 dark:text-blue-400 hover:bg-muted focus:outline-none"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {wsUnreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {wsUnreadCount > 99 ? "99+" : wsUnreadCount}
              </span>
            )}
          </button>
          <div className="h-px w-8 bg-border" />
          <button
            type="button"
            onClick={() => {
              toggleAI();
              setRightPanelView("tour");
            }}
            className="grid h-10 w-10 place-items-center rounded-md text-indigo-700 dark:text-blue-400 hover:bg-muted focus:outline-none"
            title="Page Tour"
          >
            <Compass className="h-5 w-5" />
          </button>
          <div className="h-px w-8 bg-border" />
          <button
            type="button"
            onClick={() => {
              toggleAI();
              setRightPanelView("settings");
            }}
            className="grid h-10 w-10 place-items-center rounded-md text-indigo-700 dark:text-blue-400 hover:bg-muted focus:outline-none"
            title="Preferences"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Expanded: header bar (always shown on mobile, where the panel only renders when open) */}
      {(isMobile || aiState === "expanded") && (
        <div className="flex z-40 justify-between items-center w-full h-13 border-b pl-2 pr-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAI}
              className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted focus:outline-none"
              title="Collapse panel"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {rightPanelView === "chat" && (
              <div className="flex items-center gap-2">
                <img src={loadingGif} alt="Flowmo" className="h-6" />
                <span className="text-sm font-semibold text-indigo-700 dark:text-blue-400">Flowmo</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium ${
                    isConnected
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      isConnected ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  {isConnected ? "Active" : "Offline"}
                </span>
              </div>
            )}
            {rightPanelView === "notifications" && (
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">Notifications</span>
              </div>
            )}
            {rightPanelView === "settings" && (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">Preferences</span>
              </div>
            )}
            {rightPanelView === "tour" && (
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">Page Tour</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {rightPanelView === "chat" && (
              <>
                {!isMobile && (
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/flowmo" })}
                    className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none text-muted-foreground hover:text-foreground"
                    title="Open full chat"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  data-tour="flowmo-history"
                  onClick={() => setShowSessionSidebar((v) => !v)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none",
                    showSessionSidebar && "bg-muted text-primary",
                  )}
                  title="Chat history"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="h-5 w-px bg-border" />
              </>
            )}
            {/* Flowmo button — slides in/out when switching views */}
            {rightPanelView !== "chat" && (
              <>
                <button
                  type="button"
                  onClick={handleBackToChat}
                  className={`grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none transition-all duration-200 ${
                    flowmoIconSlidingOut
                      ? "animate-out slide-out-to-left-2 fade-out"
                      : "animate-in slide-in-from-left-2 fade-in"
                  }`}
                  title="Back to Flowmo chat"
                >
                  <img src={loadingGif} alt="Flowmo" className="h-5" />
                </button>
                <div className={`h-5 w-px bg-border transition-all duration-200 ${
                  flowmoIconSlidingOut ? "animate-out fade-out" : "animate-in fade-in"
                }`} />
              </>
            )}
            <button
              type="button"
              onClick={() => setRightPanelView("notifications")}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none",
                rightPanelView === "notifications" && "bg-muted text-primary",
              )}
              title="Notifications"
            >
              <span className="relative">
                <Bell className="h-4 w-4" />
                {wsUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {wsUnreadCount > 99 ? "99+" : wsUnreadCount}
                  </span>
                )}
              </span>
            </button>
            <div className="h-5 w-px bg-border" />
            <button
              type="button"
              onClick={() => setRightPanelView("tour")}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none",
                rightPanelView === "tour" && "bg-muted text-primary",
              )}
              title="Page Tour"
            >
              <Compass className="h-4 w-4" />
            </button>
            <div className="h-5 w-px bg-border" />
            <button
              type="button"
              onClick={() => setRightPanelView("settings")}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none",
                rightPanelView === "settings" && "bg-muted text-primary",
              )}
              title="Preferences"
            >
              <Settings className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line no-constant-binary-expression */}
            {rightPanelView === "chat" && false && (
              <>
                <div className="h-5 w-px bg-border" />
                <button
                  type="button"
                  onClick={() => setShowSessionSidebar((v) => !v)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none",
                    showSessionSidebar && "bg-muted text-primary",
                  )}
                  title="Chat history"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!(isMobile || aiState === "expanded") ? null : (
        <>
          {/* Notifications Panel */}
          {rightPanelView === "notifications" && (
            <div className="flex-1 min-h-0 bg-background flex flex-col">
              {/* Notification Actions Bar */}
              <div className="flex items-center justify-between border-b px-4 py-2">
                <button
                  type="button"
                  onClick={() => setShowNotifPrefs((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  {showNotifPrefs ? "Back to notifications" : "Mute settings"}
                </button>
                {!showNotifPrefs && wsUnreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <ScrollArea className="flex-1 min-h-0">
                {showNotifPrefs ? (
                  /* Notification Preferences (Mute/Unmute per workspace) */
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      Muted workspaces won't send notifications in workspace or social feed.
                    </p>
                    {notifPreferences.length === 0 && (
                      <div className="rounded-md border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
                        No workspace preferences yet. Preferences will appear as you join workspaces.
                      </div>
                    )}
                    {notifPreferences.map((pref) => (
                      <div
                        key={pref.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <span className="text-sm truncate">
                          {pref.board?.name ?? `Workspace #${pref.boardId}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleMute(pref.boardId, pref.muted)}
                          className={cn(
                            "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                            pref.muted
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                          )}
                        >
                          {pref.muted ? (
                            <>
                              <BellOff className="h-3 w-3" /> Muted
                            </>
                          ) : (
                            <>
                              <Bell className="h-3 w-3" /> Enabled
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Notification List */
                  <div className="p-4 space-y-2">
                    {notifLoading && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Loading...
                      </div>
                    )}
                    {!notifLoading && notifications.length === 0 && (
                      <div className="rounded-md border border-border bg-muted p-6 text-center text-sm text-muted-foreground">
                        No notifications yet. Actions performed in the app will
                        appear here.
                      </div>
                    )}
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                        }}
                        className={cn(
                          "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
                          notif.isRead
                            ? "border-border bg-card"
                            : "border-primary/20 bg-primary/5",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {!notif.isRead && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                              )}
                              <span className="text-sm font-medium break-words line-clamp-2">
                                {notif.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 break-words line-clamp-3">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {notif.actor && (
                                <span className="text-[11px] text-muted-foreground">
                                  {notif.actor.firstName} {notif.actor.lastName}
                                </span>
                              )}
                              {notif.board && (
                                <span className="text-[11px] text-muted-foreground">
                                  in {notif.board.name}
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground ml-auto">
                                {new Date(notif.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Settings/Preferences Panel */}
          {rightPanelView === "settings" && (
            <div className="flex-1 min-h-0 bg-background">
              <ScrollArea className="h-full min-h-0">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        localStorage.setItem(
                          "simpleflow_timezone",
                          e.target.value,
                        );
                      }}
                      className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      {(Intl as any).supportedValuesOf("timeZone").map((tz: string) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Wake Word Toggle */}
                  {voiceSupported && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Voice Activation
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleWakeWord(!wakeWordEnabled)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                          wakeWordEnabled
                            ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Mic className={cn("h-4 w-4", wakeWordEnabled ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")} />
                          <div className="text-left">
                            <div className={cn("font-medium", wakeWordEnabled ? "text-indigo-700 dark:text-indigo-300" : "text-foreground")}>
                              "Hey Flow"
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Say "Hey Flow" to start a voice command
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "h-5 w-9 rounded-full transition-colors relative",
                          wakeWordEnabled ? "bg-indigo-600" : "bg-muted-foreground/30",
                        )}>
                          <div className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                            wakeWordEnabled ? "translate-x-4" : "translate-x-0.5",
                          )} />
                        </div>
                      </button>
                      {wakeWordEnabled && wakeWordListening && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Listening for "Hey Flow"...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Session History Sidebar (ChatGPT-style outlet) */}
          {rightPanelView === "chat" && showSessionSidebar && (
            <div className="absolute inset-0 top-13 z-50 flex">
              {/* Sidebar panel */}
              <div className="w-64 h-full bg-card border-r border-border flex flex-col animate-in slide-in-from-left-2 duration-200">
                {/* Sidebar header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-border">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Chat History</span>
                  <button
                    type="button"
                    onClick={() => {
                      startNewSession();
                      setSelectedWorkspace(null);
                      setShowSessionSidebar(false);
                    }}
                    className="flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 text-xs font-medium transition-colors"
                    title="New chat"
                  >
                    <PenSquare className="h-3 w-3" />
                    New Chat
                  </button>
                </div>

                {/* Session list */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-2 space-y-1">
                    {sessionHistory.length === 0 && (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        No previous chats yet.
                        <br />
                        Start a conversation to see it here.
                      </div>
                    )}
                    {sessionHistory.map((entry) => {
                      const isActive = entry.id === activeHistoryId;
                      const isRenaming = renamingId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors",
                            isActive
                              ? "bg-indigo-50 dark:bg-indigo-950/30 text-foreground"
                              : "bg-gray-50 dark:bg-gray-900/40 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-foreground",
                          )}
                          onClick={() => {
                            if (!isRenaming) {
                              loadSession(entry.id);
                              setShowSessionSidebar(false);
                              setKebabOpenId(null);
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            {isRenaming ? (
                              <input
                                type="text"
                                className="w-full bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                value={renameValue}
                                autoFocus
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    renameSession(entry.id, renameValue.trim() || entry.title);
                                    setRenamingId(null);
                                  }
                                  if (e.key === "Escape") {
                                    setRenamingId(null);
                                  }
                                }}
                                onBlur={() => {
                                  renameSession(entry.id, renameValue.trim() || entry.title);
                                  setRenamingId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div className="truncate">{entry.title}</div>
                            )}
                          </div>
                          {!isRenaming && (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setKebabOpenId((prev) => prev === entry.id ? null : entry.id);
                                }}
                                className={cn(
                                  "grid h-6 w-6 place-items-center rounded hover:bg-background transition-opacity",
                                  kebabOpenId === entry.id ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                )}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                              {kebabOpenId === entry.id && (
                                <div className="absolute right-0 top-full mt-1 z-50 w-32 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setKebabOpenId(null);
                                    }}
                                  >
                                    <Pin className="h-3 w-3" />
                                    Pin chat
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRenamingId(entry.id);
                                      setRenameValue(entry.title);
                                      setKebabOpenId(null);
                                    }}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    Rename
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteSessionHistory(entry.id);
                                      setKebabOpenId(null);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Click-away overlay */}
              <div
                className="flex-1 bg-black/20"
                onClick={() => setShowSessionSidebar(false)}
              />
            </div>
          )}

          {/* Tour Panel — always mounted for overlay, list hidden when not active */}
          <div className={`flex-1 min-h-0 bg-background ${rightPanelView === "tour" ? "" : "hidden"}`}>
            <TourGuide
              onClose={() => setRightPanelView("chat")}
              onSwitchToChat={() => setRightPanelView("chat")}
              isPanelVisible={rightPanelView === "tour"}
            />
          </div>

          {/* Chat Panel */}
          {rightPanelView === "chat" && (
            <>
              <div className="border-b bg-card px-4 py-2">
                <div className="text-sm font-semibold text-foreground">
                  Hi {displayName}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>Type <span className="font-mono font-semibold text-foreground">/</span> for commands{voiceSupported ? ", use voice," : ""} or just ask anything.</span>
                  {wakeWordEnabled && wakeWordListening && !isRecording && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title='"Hey Flow" is active'>
                      <Mic className="h-3 w-3" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  )}
                  {isRecording && (
                    <span className="inline-flex items-center gap-1 text-red-500" title="Recording voice command">
                      <Mic className="h-3 w-3" />
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-background">
                <ScrollArea className="h-full min-h-0">
                  <div className="p-3 space-y-3">
                    {hasOlderChatMessages && (
                      <div className="flex justify-center pb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsLoadingOlderChat(true);
                            skipChatScrollRef.current = true;
                            setTimeout(() => { setChatVisibleCount((prev) => prev + CHAT_PAGE_SIZE); setIsLoadingOlderChat(false); }, 400);
                          }}
                          disabled={isLoadingOlderChat}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-full border border-border hover:bg-muted flex items-center gap-1"
                        >
                          {isLoadingOlderChat ? (
                            <><Loader2 className="h-2.5 w-2.5 animate-spin" /> Loading...</>
                          ) : (
                            <>Load older ({allMessages.length - chatVisibleCount} more)</>
                          )}
                        </button>
                      </div>
                    )}
                    {messages.map((message) => {
                      if (message.type === "response") {
                        const r = message.response;
                        const isConfirm = r.status === "confirmation_required";
                        const isConfirmIdRequired =
                          r.status === "confirmation_id_required";

                        return (
                          <div key={message.id} className="flex justify-start">
                            <div className={bubbleBase("assistant")}>
                              <div className="flex items-center gap-2 font-semibold text-foreground">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/70 bg-white p-0.5">
                                  <img
                                    src={logoOnly}
                                    alt=""
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                  />
                                </span>
                                <span>Flowmo</span>
                              </div>
                              <div className="mt-1 whitespace-pre-wrap">{r.message}</div>

                              {/* Multi-step plan visualization (only for action objects, not plain tool name strings) */}
                              {(r.plannedActions as unknown[])?.length > 0 &&
                                typeof (r.plannedActions as unknown[])[0] === "object" && (
                                <PlanStepsView
                                  actions={r.plannedActions as unknown[]}
                                  results={isTerminalStatus(r.status) ? r.results : undefined}
                                />
                              )}

                              {r.analyticsDetails?.length ? (
                                <AnalyticsDetailsToggle details={r.analyticsDetails} />
                              ) : (
                                <ToolResultCards results={r.results} navigate={navigate} />
                              )}

                              {r.confirmationPrompt && (
                                <div className="mt-2 rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground">
                                  {r.confirmationPrompt}
                                </div>
                              )}

                              {isConfirmIdRequired && (
                                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                  I need a confirmation id to proceed. Please
                                  click Execute on the last planned action.
                                </div>
                              )}

                              {isConfirm && (
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => void sendMessage("yes")}
                                    disabled={isSending}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                  >
                                    <Send />
                                    Execute {(r.plannedActions as unknown[])?.length > 1 ? `(${(r.plannedActions as unknown[]).length} steps)` : ""}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void sendMessage("cancel")}
                                    disabled={isSending}
                                  >
                                    <X />
                                    Cancel
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (message.type === "github_event") {
                        return (
                          <div key={message.id} className="flex justify-start">
                            <div className={bubbleBase("assistant")}>
                              <GitHubEventCard
                                title={message.title}
                                body={message.body}
                                prNumber={message.prNumber}
                                repoFullName={message.repoFullName}
                                action={message.action}
                                url={message.url}
                                sha={message.sha}
                                actionCompleted={message.actionCompleted}
                                onActionCompleted={() => {
                                  setMessages((prev) =>
                                    prev.map((m) =>
                                      m.id === message.id
                                        ? { ...m, actionCompleted: true } as ChatMessage
                                        : m,
                                    ),
                                  );
                                }}
                              />
                            </div>
                          </div>
                        );
                      }

                      if (message.type === "calendar_event") {
                        return (
                          <div key={message.id} className="flex justify-start">
                            <div className={bubbleBase("assistant")}>
                              <CalendarEventCard
                                title={message.title}
                                time={message.time}
                                location={message.location}
                                meetLink={message.meetLink}
                                actionCompleted={(message as any).actionCompleted}
                                onActionCompleted={(action) => {
                                  setMessages((prev) =>
                                    prev.map((m) =>
                                      m.id === message.id ? { ...m, actionCompleted: action } as ChatMessage : m,
                                    ),
                                  );
                                }}
                              />
                            </div>
                          </div>
                        );
                      }

                      if (message.role === "assistant") {
                        return (
                          <div key={message.id} className="flex justify-start">
                            <div className={bubbleBase("assistant")}>
                              {message.type === "error" ? (
                                <div className="text-red-700">
                                  {`Execution error: ${message.text}`}
                                </div>
                              ) : (
                                message.text
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={message.id} className="flex justify-end">
                          <div className={bubbleBase("user")}>
                            {message.imagePreview && (
                              <ImageWithLoader
                                src={message.imagePreview}
                                alt="Uploaded"
                                wrapperClassName="mb-2 max-h-40 rounded-lg"
                                className="max-h-40 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                              />
                            )}
                            {message.text}
                          </div>
                        </div>
                      );
                    })}

                    {isSending && (
                      <div className="flex justify-start">
                        <div className={cn(bubbleBase("assistant"), "py-2.5")}>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/70 bg-white p-0.5">
                                <img
                                  src={logoOnly}
                                  alt=""
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </span>
                              <span>Flowmo</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span
                                className="h-2 w-2 rounded-full bg-emerald-500/90 animate-pulse"
                                aria-hidden="true"
                              />
                              <span className="text-xs text-muted-foreground">
                                {thinkingLabel}…
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>
              </div>

              <div className="shrink-0 border-t bg-card p-3">
                {showSlashMenu && menuLength > 0 && (
                  <div className="mb-2 mx-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                    {activeCategory && (
                      <button
                        type="button"
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border hover:bg-muted/50"
                        onClick={() => {
                          setActiveCategory(null);
                          setSlashSelectedIndex(0);
                          setInputText("/");
                          textareaRef.current?.focus();
                        }}
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span className="shrink-0">{activeCategory.icon}</span>
                        <span className="font-medium">{activeCategory.command}</span>
                      </button>
                    )}
                    <div className="max-h-[220px] overflow-y-auto">
                      {!activeCategory
                        ? filteredCategories.map((cat, index) => (
                            <button
                              key={cat.command}
                              type="button"
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                                index === slashSelectedIndex
                                  ? "bg-indigo-50 dark:bg-indigo-950/30"
                                  : "hover:bg-muted/50",
                              )}
                              onMouseEnter={() => setSlashSelectedIndex(index)}
                              onClick={() => selectCategory(cat)}
                            >
                              <span className="shrink-0 text-muted-foreground">{cat.icon}</span>
                              <span className="font-medium text-foreground">{cat.command}</span>
                              <span className="text-muted-foreground truncate">{cat.description}</span>
                              <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                            </button>
                          ))
                        : filteredSubs.map((sub, index) => (
                            <button
                              key={sub.label}
                              type="button"
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                                index === slashSelectedIndex
                                  ? "bg-indigo-50 dark:bg-indigo-950/30"
                                  : "hover:bg-muted/50",
                              )}
                              onMouseEnter={() => setSlashSelectedIndex(index)}
                              onClick={() => selectSubCommand(sub)}
                            >
                              <span className="font-medium text-foreground">{sub.label}</span>
                              <span className="text-muted-foreground truncate">{sub.description}</span>
                            </button>
                          ))}
                    </div>
                  </div>
                )}
                {/* Image preview */}
                {pendingImagePreview && (
                  <div className="flex items-center gap-2 px-2 pb-1">
                    <div className="relative inline-block">
                      <ImageWithLoader
                        src={pendingImagePreview}
                        alt="Upload preview"
                        wrapperClassName="h-16 w-16 rounded-lg"
                        className="h-16 w-16 rounded-lg object-cover border border-border"
                      />
                      <button
                        type="button"
                        onClick={clearPendingImage}
                        className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {pendingImage?.name}
                    </span>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <form
                  onSubmit={handleSubmit}
                  className="flex items-end gap-2 px-1"
                  data-tour="flowmo-input"
                >
                  <div className="relative flex-1 min-w-0">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      placeholder={isRecording ? "Listening..." : pendingImage ? "Describe what to create from this image..." : "Ask anything, type /, or use voice"}
                      className="min-h-[42px] max-h-[120px] w-full resize-none rounded-2xl border border-border bg-background py-2.5 pl-4 pr-28 text-sm leading-[22px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                      value={inputText}
                      onChange={(event) => handleInputChange(event.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={handleKeyDown}
                    />
                    <div className="absolute right-2 bottom-3 flex items-center gap-0.5">
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={toggleVoice}
                          className={cn(
                            "relative grid h-8 w-8 place-items-center rounded-full focus:outline-none transition-colors",
                            isRecording
                              ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                              : wakeWordListening
                                ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-400/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/40"
                                : "text-muted-foreground hover:bg-muted",
                          )}
                          title={
                            isRecording
                              ? "Listening... tap to stop"
                              : wakeWordListening
                                ? 'Say "Hey Flow" or tap to speak'
                                : "Voice command"
                          }
                        >
                          {isRecording ? (
                            <MicOff className="h-5 w-5" />
                          ) : (
                            <>
                              <Mic className="h-5 w-5" />
                              {wakeWordListening && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted focus:outline-none"
                        title="Upload image to generate tasks"
                      >
                        <ImagePlus className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEmoji((prev) => !prev)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted focus:outline-none"
                        title="Emoji"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                      {showEmoji && (
                        <div className="absolute bottom-10 right-0 z-50">
                          <EmojiPicker
                            onSelect={(emoji) => {
                              handleEmojiPick(emoji);
                            }}
                            onClose={() => setShowEmoji(false)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSending || (!inputText.trim() && !pendingImage)}
                    className="h-[40px] mb-1.5 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send />
                    {pendingImage ? "Analyze" : "Send"}
                  </Button>
                </form>
                <div className="flex items-center gap-1.5 mt-1.5 px-1">
                <div className="relative w-[30%]">
                  <button
                    type="button"
                    onClick={() => setShowWorkspacePicker((v) => !v)}
                    className={cn(
                      "flex items-center gap-1 w-full rounded-md border px-2 py-1 text-[11px] transition-colors",
                      selectedWorkspace
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <FolderOpen className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {selectedWorkspace ? selectedWorkspace.name : "All"}
                    </span>
                    <ChevronDown className="ml-auto h-2.5 w-2.5 shrink-0" />
                  </button>
                  {showWorkspacePicker && (
                    <div className="absolute left-1 bottom-full mb-1 w-56 z-50 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                      <ScrollArea className="max-h-[200px]">
                        <button
                          type="button"
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/50",
                            !selectedWorkspace && "bg-indigo-50 dark:bg-indigo-950/30",
                          )}
                          onClick={() => {
                            setSelectedWorkspace(null);
                            setShowWorkspacePicker(false);
                          }}
                        >
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>All workspaces</span>
                          {!selectedWorkspace && <Check className="ml-auto h-3 w-3 text-indigo-600" />}
                        </button>
                        {workspaces.map((ws) => (
                          <button
                            key={ws.id}
                            type="button"
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/50",
                              selectedWorkspace?.id === ws.id && "bg-indigo-50 dark:bg-indigo-950/30",
                            )}
                            onClick={() => {
                              setSelectedWorkspace(ws);
                              setShowWorkspacePicker(false);
                            }}
                          >
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{ws.name}</span>
                            {selectedWorkspace?.id === ws.id && <Check className="ml-auto h-3 w-3 text-indigo-600" />}
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  data-tour="flowmo-new-session"
                  onClick={() => {
                    startNewSession();
                    setSelectedWorkspace(null);
                  }}
                  className="flex items-center gap-1 rounded-md border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 text-[11px] text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors font-medium"
                  title="New chat"
                >
                  <PenSquare className="h-3 w-3" />
                  <span>New Chat</span>
                </button>
                {energy && !energy.unlimited && (
                  <span
                    className={cn(
                      "ml-auto inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] font-medium",
                      energy.remaining <= 0
                        ? "text-red-500 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400",
                    )}
                    title={`Flowmo energy: ${energy.remaining}/${energy.limit} left today · ${energy.costPerPrompt} per action`}
                  >
                    ⚡ {energy.remaining}/{energy.limit}
                  </span>
                )}
                </div>
              </div>
            </>
          )}
        </>
      )}
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FlowmoAssistantContainer;
