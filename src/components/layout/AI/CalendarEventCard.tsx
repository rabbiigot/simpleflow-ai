import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createWorkspaceTask,
  getCurrentUserId,
  getWorkspaces,
  type Workspace,
} from "@/lib/backend-api";
import { Calendar, Check, Clock, ExternalLink, ListPlus, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  title: string;
  time: string;
  location: string | null;
  meetLink: string | null;
  actionCompleted?: "created" | "linked" | boolean;
  onActionCompleted?: (action: "created" | "linked") => void;
};

export default function CalendarEventCard({ title, time, location, meetLink, actionCompleted, onActionCompleted }: Props) {
  const [mode, setMode] = useState<"idle" | "create-task" | "add-to-task">("idle");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedWorkspaceForLink, setSelectedWorkspaceForLink] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    try {
      const ws = await getWorkspaces();
      setWorkspaces(ws.filter((w) => w.calendarEnabled));
      if (ws.filter((w) => w.calendarEnabled).length === 0) {
        setWorkspaces(ws);
      }
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

  const submitCreateTask = async () => {
    if (!selectedWorkspace) return;
    setIsSubmitting(true);
    try {
      const userId = getCurrentUserId();
      const desc = [time, location, meetLink].filter(Boolean).join(" | ");
      await createWorkspaceTask(selectedWorkspace.id, {
        title,
        description: desc,
        assigneeId: userId ? Number(userId) : undefined,
      });
      toast.success("Task created from calendar event");
      onActionCompleted?.("created");
      setMode("idle");
    } catch {
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAddToTask = async () => {
    if (!selectedTaskId || !selectedWorkspaceForLink) return;
    setIsSubmitting(true);
    try {
      const userId = getCurrentUserId();
      const { createTaskComment } = await import("@/lib/backend-api");
      const comment = `@@calendar@@${title}||${time}||${location || ""}||${meetLink || ""}`;
      await createTaskComment(selectedWorkspaceForLink, selectedTaskId, { userId: userId || "", content: comment });
      toast.success("Event linked to task");
      onActionCompleted?.("linked");
      setMode("idle");
    } catch {
      toast.error("Failed to link event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allTasks = workspaces.flatMap((ws) =>
    (ws.columns ?? []).flatMap((col) =>
      (col.tasks ?? []).map((t) => ({ id: t.id, title: t.title, workspace: ws.name, workspaceId: ws.id })),
    ),
  );

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2.5 space-y-2 text-sm">
      <div className="flex items-start gap-2">
        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{title}</p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>

      {meetLink && (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Join Meeting
        </a>
      )}

      {/* Actions */}
      {!actionCompleted && mode === "idle" && (
        <div className="flex gap-1.5 pt-1">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleCreateTask}>
            <Plus className="h-3 w-3" /> Create Task
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleAddToTask}>
            <ListPlus className="h-3 w-3" /> Link to Task
          </Button>
        </div>
      )}

      {actionCompleted && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" />
          {actionCompleted === "created" ? "Created as task" : actionCompleted === "linked" ? "Linked to task" : "Linked to task"}
        </div>
      )}

      {/* Workspace selector for Create Task */}
      {mode === "create-task" && (
        <div className="space-y-2 pt-1 border-t border-blue-200/50 dark:border-blue-800/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Create task in:</p>
          {isLoadingWorkspaces ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : (
            <Select value={selectedWorkspace?.id || ""} onValueChange={(id) => setSelectedWorkspace(workspaces.find((w) => w.id === id) || null)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id} className="text-xs">{ws.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" disabled={!selectedWorkspace || isSubmitting} onClick={() => void submitCreateTask()}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setMode("idle")}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Task selector for Link to Task */}
      {mode === "add-to-task" && (
        <div className="space-y-2 pt-1 border-t border-blue-200/50 dark:border-blue-800/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Link to task:</p>
          {isLoadingWorkspaces ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : allTasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tasks found</p>
          ) : (
            <Select
              value={selectedTaskId}
              onValueChange={(id) => {
                setSelectedTaskId(id);
                const task = allTasks.find((t) => t.id === id);
                setSelectedWorkspaceForLink(task?.workspaceId || "");
              }}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select a task..." />
              </SelectTrigger>
              <SelectContent>
                {allTasks.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.workspace} — {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" disabled={!selectedTaskId || isSubmitting} onClick={() => void submitAddToTask()}>
              {isSubmitting ? "Linking..." : "Link"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setMode("idle")}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
