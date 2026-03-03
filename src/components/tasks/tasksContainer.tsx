"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textArea";
import {
  createWorkspaceTask,
  getWorkspaces,
  type Workspace,
} from "@/lib/backend-api";
import { Calendar, Clock, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TaskView = {
  id: string;
  title: string;
  description: string;
  workspaceId: string;
  workspaceName: string;
  columnId: string;
  columnName: string;
  status: "pending" | "in-progress" | "completed";
  createdAt?: string;
};

type TaskForm = {
  workspaceId: string;
  columnId: string;
  title: string;
  description: string;
};

function mapStatus(columnName: string, columnType?: string): TaskView["status"] {
  const normalized = columnName.toLowerCase();
  if (columnType === "COMPLETED" || normalized.includes("done") || normalized.includes("complete")) {
    return "completed";
  }
  if (normalized.includes("progress") || normalized.includes("doing")) {
    return "in-progress";
  }
  return "pending";
}

const TasksContainer = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<TaskForm>({
    workspaceId: "",
    columnId: "",
    title: "",
    description: "",
  });

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === newTask.workspaceId),
    [workspaces, newTask.workspaceId],
  );

  const loadTasks = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getWorkspaces();
      setWorkspaces(data);

      if (data.length > 0) {
        const workspaceId = newTask.workspaceId || data[0].id;
        const workspace = data.find((item) => item.id === workspaceId) || data[0];
        const firstColumnId = workspace.columns?.[0]?.id || "";

        setNewTask((prev) => ({
          ...prev,
          workspaceId,
          columnId: prev.columnId || firstColumnId,
        }));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load tasks from backend",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const tasks = useMemo<TaskView[]>(() => {
    return workspaces.flatMap((workspace) =>
      (workspace.columns ?? []).flatMap((column) =>
        (column.tasks ?? []).map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          columnId: column.id,
          columnName: column.name,
          status: mapStatus(column.name, column.type),
          createdAt: task.createdAt,
        })),
      ),
    );
  }, [workspaces]);

  const visibleTasks = useMemo(() => {
    if (activeTab === "completed") {
      return tasks.filter((task) => task.status === "completed");
    }
    if (activeTab === "active") {
      return tasks.filter((task) => task.status !== "completed");
    }
    return tasks;
  }, [tasks, activeTab]);

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
      await createWorkspaceTask(newTask.workspaceId, {
        columnId: newTask.columnId,
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
      });

      setNewTask((prev) => ({
        ...prev,
        title: "",
        description: "",
      }));
      setIsCreateDialogOpen(false);
      await loadTasks();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create task",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-2">Real tasks from backend workspaces</p>
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
                <Select value={newTask.workspaceId} onValueChange={handleWorkspaceChange}>
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
                    setNewTask((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Task title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(event) =>
                    setNewTask((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Optional description"
                />
              </div>

              <Button onClick={() => void handleCreateTask()} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {errorMessage && <p className="text-sm text-red-600 mb-4">{errorMessage}</p>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">Loading tasks...</CardContent>
            </Card>
          ) : visibleTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">No tasks found.</CardContent>
            </Card>
          ) : (
            visibleTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{task.title}</span>
                    <Badge variant="outline">{task.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{task.description || "No description"}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{task.workspaceName}</span>
                    <span>{task.columnName}</span>
                    {task.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      backend
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TasksContainer;
