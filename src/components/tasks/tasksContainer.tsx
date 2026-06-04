import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textArea";
import {
  createWorkspaceTask,
  getCurrentUserId,
  getWorkspacesPaged,
  type Workspace,
} from "@/lib/backend-api";
import { useInvalidation } from "@/hooks/use-invalidation";
import { emitInvalidation } from "@/lib/invalidation";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Layers,
  Loader2,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_COLUMN_COLORS } from "@/components/workspace/utils/color";
import { parseTaskMeta } from "@/components/workspace/utils/task-meta";

type TaskView = {
  id: string;
  title: string;
  description: string;
  workspaceId: string;
  workspaceName: string;
  columnId: string;
  columnName: string;
  columnColor: string;
  statusCategory: "pending" | "in-progress" | "completed";
  createdAt?: string;
};

type TaskForm = {
  workspaceId: string;
  columnId: string;
  title: string;
  description: string;
  customFieldValues: Record<string, string>;
};

function mapStatus(
  columnName: string,
  columnType?: string,
): TaskView["statusCategory"] {
  const normalized = columnName.toLowerCase();
  if (
    columnType === "COMPLETED" ||
    normalized.includes("done") ||
    normalized.includes("complete")
  ) {
    return "completed";
  }
  if (normalized.includes("progress") || normalized.includes("doing")) {
    return "in-progress";
  }
  return "pending";
}


const TasksContainer = () => {
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === "ADMIN";
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [newTask, setNewTask] = useState<TaskForm>({
    workspaceId: "",
    columnId: "",
    title: "",
    description: "",
    customFieldValues: {},
  });

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === newTask.workspaceId),
    [workspaces, newTask.workspaceId],
  );

  const loadTasks = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const userId = await getCurrentUserId();
      const result = await getWorkspacesPaged({ userId, pageSize: 100 });
      const data = result.items;
      setWorkspaces(data);

      if (data.length > 0) {
        const workspaceId = newTask.workspaceId || data[0].id;
        const workspace =
          data.find((item) => item.id === workspaceId) || data[0];
        const firstColumnId = workspace.columns?.[0]?.id || "";

        setNewTask((prev) => ({
          ...prev,
          workspaceId,
          columnId: prev.columnId || firstColumnId,
        }));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load tasks from backend",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  useInvalidation(["workspaces"], () => {
    void loadTasks();
  });

  const tasks = useMemo<TaskView[]>(() => {
    const currentUserId = Number(getCurrentUserId());
    return workspaces.flatMap((workspace) => {
      // Read saved column colors for this workspace
      let savedColors: Record<string, string> = {};
      try {
        const raw = localStorage.getItem(`workspace-column-colors:${workspace.id}`);
        if (raw) savedColors = JSON.parse(raw);
      } catch { /* ignore */ }

      const sortedColumns = [...(workspace.columns ?? [])].sort((a, b) => a.position - b.position);

      return sortedColumns.flatMap((column, colIndex) => {
        const color =
          savedColors[String(column.id)] ||
          (column.type === "COMPLETED"
            ? "#06b6d4"
            : DEFAULT_COLUMN_COLORS[colIndex % DEFAULT_COLUMN_COLORS.length]);

        return (column.tasks ?? [])
          .filter((task) => {
            if (isAdmin) return true;
            if (task.assigneeId === currentUserId) return true;
            const meta = parseTaskMeta(task.customFieldValues);
            return meta.assigneeIds.includes(String(currentUserId));
          })
          .map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description || "",
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            columnId: column.id,
            columnName: column.name,
            columnColor: color,
            statusCategory: mapStatus(column.name, column.type),
            createdAt: task.createdAt,
          }));
      });
    });
  }, [workspaces, isAdmin]);

  const visibleTasks = useMemo(() => {
    if (activeTab === "completed") {
      return tasks.filter((task) => task.statusCategory === "completed");
    }
    if (activeTab === "active") {
      return tasks.filter((task) => task.statusCategory !== "completed");
    }
    return tasks;
  }, [tasks, activeTab]);

  // Group visible tasks by workspace
  const groupedByWorkspace = useMemo(() => {
    const groups: Array<{
      workspaceId: string;
      workspaceName: string;
      tasks: TaskView[];
    }> = [];
    const map = new Map<string, TaskView[]>();

    for (const task of visibleTasks) {
      const existing = map.get(task.workspaceId);
      if (existing) {
        existing.push(task);
      } else {
        const arr = [task];
        map.set(task.workspaceId, arr);
        groups.push({
          workspaceId: task.workspaceId,
          workspaceName: task.workspaceName,
          tasks: arr,
        });
      }
    }

    return groups;
  }, [visibleTasks, workspaces]);

  const toggleGroup = (workspaceId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [workspaceId]: !prev[workspaceId],
    }));
  };

  const handleWorkspaceChange = (workspaceId: string) => {
    const workspace = workspaces.find((item) => item.id === workspaceId);
    setNewTask((prev) => ({
      ...prev,
      workspaceId,
      columnId: workspace?.columns?.[0]?.id || "",
    }));
  };

  const handleCreateTask = async () => {
    if (!newTask.workspaceId || !newTask.columnId || !newTask.title.trim()) {
      setErrorMessage("Workspace, column, and title are required");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      const customFieldValues = Object.fromEntries(
        Object.entries(newTask.customFieldValues).filter(
          ([, value]) => value.trim() !== "",
        ),
      );

      await createWorkspaceTask(newTask.workspaceId, {
        columnId: newTask.columnId,
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        customFieldValues: Object.keys(customFieldValues).length
          ? customFieldValues
          : undefined,
      });

      setNewTask((prev) => ({
        ...prev,
        title: "",
        description: "",
        customFieldValues: {},
      }));
      setIsCreateDialogOpen(false);
      await loadTasks();
      emitInvalidation(["workspaces"], ["workspace.createTask"]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create task",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="section-label">Tasks</p>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground mt-2">
            All tasks across your workspaces
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Workspace</Label>
                <Select
                  value={newTask.workspaceId}
                  onValueChange={handleWorkspaceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((workspace) => (
                      <SelectItem key={workspace.id} value={workspace.id}>
                        {workspace.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Column</Label>
                <Select
                  value={newTask.columnId}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({ ...prev, columnId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedWorkspace?.columns ?? []).map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newTask.title}
                  onChange={(event) =>
                    setNewTask((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Task title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(event) =>
                    setNewTask((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional description"
                />
              </div>

              <Button
                onClick={() => void handleCreateTask()}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {errorMessage && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-700">
            Unable to load tasks. Create a workspace first, then add tasks to
            see them here.
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-3"
      >
        <TabsList className="grid w-full max-w-md grid-cols-3" data-tour="tasks-tabs">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-2" data-tour="tasks-list">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading tasks...</span>
            </div>
          ) : groupedByWorkspace.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">
                  {activeTab === "completed"
                    ? "No completed tasks yet"
                    : activeTab === "active"
                      ? "No active tasks"
                      : "No tasks yet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeTab === "all"
                    ? "Create a workspace and add tasks to get started."
                    : "Tasks will appear here as you work through your workspaces."}
                </p>
              </CardContent>
            </Card>
          ) : (
            groupedByWorkspace.map((group) => {
              const isCollapsed =
                collapsedGroups[group.workspaceId] ?? false;

              return (
                <div
                  key={group.workspaceId}
                  className="rounded-md border border-border bg-card"
                >
                  {/* Workspace group header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.workspaceId)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted ${
                      isCollapsed ? "rounded-md" : "rounded-t-md"
                    }`}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      {group.workspaceName}
                    </span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {group.tasks.length}
                    </span>
                  </button>

                  {/* Tasks table */}
                  {!isCollapsed && (
                    <>
                      {group.tasks.length === 0 ? (
                        <div className="border-t border-border px-3 py-4 text-center text-xs text-muted-foreground">
                          No tasks in this workspace
                        </div>
                      ) : (
                        <div className="[&_[data-slot=table-container]]:overflow-clip [&_[data-slot=table-container]]:rounded-b-md">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border bg-muted/50">
                                <TableHead className="w-[35%] pl-10 text-xs font-medium text-muted-foreground">
                                  Task
                                </TableHead>
                                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground">
                                  Column
                                </TableHead>
                                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground">
                                  Status
                                </TableHead>
                                <TableHead className="w-[20%] text-xs font-medium text-muted-foreground">
                                  Description
                                </TableHead>
                                <TableHead className="w-[15%] text-xs font-medium text-muted-foreground">
                                  Created
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.tasks.map((task) => (
                                  <TableRow
                                    key={task.id}
                                    className="cursor-pointer border-border transition-colors hover:bg-muted"
                                    onClick={() =>
                                      navigate({
                                        to: "/workspace/project/$projectId",
                                        params: { projectId: task.workspaceId },
                                        search: { tab: "tasks" },
                                      } as any)
                                    }
                                  >
                                    <TableCell className="pl-10">
                                      <span className="text-sm font-medium text-foreground">
                                        {task.title}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs text-muted-foreground">
                                        {task.columnName}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                                        style={{ backgroundColor: task.columnColor }}
                                      >
                                        {task.columnName}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="line-clamp-1 text-xs text-muted-foreground">
                                        {task.description || "--"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {task.createdAt ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(
                                            task.createdAt,
                                          ).toLocaleDateString()}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-muted-foreground/40">
                                          --
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksContainer;
