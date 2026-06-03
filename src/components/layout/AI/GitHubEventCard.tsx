import githubIcon from "@/assets/github.svg";
import { Button } from "@/components/ui/button";
import {
  createWorkspaceTask,
  createTaskComment,
  getCurrentUserId,
  getWorkspaces,
  type Workspace,
} from "@/lib/backend-api";
import { ExternalLink, ListPlus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  title: string;
  body: string | null;
  prNumber: number | null;
  repoFullName: string;
  action: string | null;
  url: string;
  sha?: string;
  actionCompleted?: boolean;
  onActionCompleted?: () => void;
};

export default function GitHubEventCard({ title, body, prNumber, action, repoFullName, url, sha, actionCompleted, onActionCompleted }: Props) {
  const [mode, setMode] = useState<"idle" | "create-task" | "add-to-task">("idle");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actionLabel = action === "opened" ? "opened" : action === "closed" ? "closed" : action === "merged" ? "merged" : action || "updated";

  const loadWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    try {
      const ws = await getWorkspaces();
      setWorkspaces(ws.filter((w) => w.githubEnabled));
    } catch {
      toast.error("Failed to load workspaces");
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  const handleCreateTask = () => {
    setMode("create-task");
    void loadWorkspaces();
  };

  const handleAddToTask = () => {
    setMode("add-to-task");
    void loadWorkspaces();
  };

  const handleSubmitCreateTask = async () => {
    if (!selectedWorkspace) return;
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsSubmitting(true);
    try {
      const firstColumn = selectedWorkspace.columns?.[0];
      if (!firstColumn) {
        toast.error("Workspace has no columns");
        return;
      }

      const desc = body
        ? `${body}\n\n---\nPR #${prNumber} on ${repoFullName}${url ? `\n${url}` : ""}`
        : `PR #${prNumber} ${actionLabel} on ${repoFullName}${url ? `\n${url}` : ""}`;

      await createWorkspaceTask(String(selectedWorkspace.id), {
        columnId: String(firstColumn.id),
        title: `PR #${prNumber}: ${title}`,
        description: desc,
      });

      toast.success(`Task created in ${selectedWorkspace.name}`);
      onActionCompleted?.();
      setMode("idle");
    } catch {
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAddToTask = async () => {
    if (!selectedWorkspace || !selectedTaskId) return;
    const userId = getCurrentUserId();
    if (!userId) return;

    setIsSubmitting(true);
    try {
      const shaTag = sha ? `\`${sha.slice(0, 7)}\`` : "";
      const lines = [
        `@@activity@@🔀 **PR #${prNumber} ${actionLabel}**`,
        `**Summary:** ${title}${shaTag ? ` ${shaTag}` : ""}`,
        body ? `**Description:** ${body.slice(0, 300)}` : "",
        `on \`${repoFullName}\``,
        url ? `[View on GitHub](${url})` : "",
      ].filter(Boolean);
      const summary = lines.join("\n");

      await createTaskComment(String(selectedWorkspace.id), selectedTaskId, {
        userId,
        content: summary,
      });

      toast.success("PR summary added to task");
      onActionCompleted?.();
      setMode("idle");
    } catch {
      toast.error("Failed to add to task");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (actionCompleted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-purple-600">
          <img src={githubIcon} alt="" className="h-4 w-4 dark:invert" />
          <span className="text-xs font-semibold">PR #{prNumber} {actionLabel}</span>
        </div>
        <p className="text-sm font-medium">{title}</p>
        {body && <p className="text-xs text-muted-foreground line-clamp-3">{body}</p>}
        <p className="text-xs text-green-600 font-medium">Action completed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* PR header */}
      <div className="flex items-center gap-2 text-purple-600">
        <img src={githubIcon} alt="" className="h-4 w-4 dark:invert" />
        <span className="text-xs font-semibold">PR #{prNumber} {actionLabel}</span>
        {sha && (
          <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">{sha.slice(0, 7)}</code>
        )}
        {repoFullName && <span className="text-xs text-muted-foreground">on {repoFullName}</span>}
      </div>

      <p className="text-sm font-medium">{title}</p>
      {body && <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{body}</p>}

      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <ExternalLink className="h-3 w-3" />
          View on GitHub
        </a>
      )}

      {/* Action buttons */}
      {mode === "idle" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleCreateTask}>
            <Plus className="h-3 w-3" />
            Create Task
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleAddToTask}>
            <ListPlus className="h-3 w-3" />
            Add to Task
          </Button>
        </div>
      )}

      {/* Workspace selector */}
      {(mode === "create-task" || mode === "add-to-task") && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
          <p className="text-xs font-medium text-muted-foreground">
            {mode === "create-task" ? "Select workspace to create task in:" : "Select workspace:"}
          </p>

          {isLoadingWorkspaces ? (
            <p className="text-xs text-muted-foreground">Loading workspaces...</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setSelectedWorkspace(ws);
                    setSelectedTaskId("");
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                    selectedWorkspace?.id === ws.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}

          {/* Task selector (for "Add to Task" mode) */}
          {mode === "add-to-task" && selectedWorkspace && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Select task:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(selectedWorkspace.columns || []).flatMap((col) =>
                  (col.tasks || []).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(String(task.id))}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                        selectedTaskId === String(task.id)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="truncate">{task.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{col.name}</span>
                    </button>
                  )),
                )}
              </div>
            </div>
          )}

          {/* Submit / Cancel */}
          <div className="flex gap-2 pt-1">
            {mode === "create-task" && selectedWorkspace && (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => void handleSubmitCreateTask()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </Button>
            )}
            {mode === "add-to-task" && selectedTaskId && (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => void handleSubmitAddToTask()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add to Task"}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => { setMode("idle"); setSelectedWorkspace(null); setSelectedTaskId(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
