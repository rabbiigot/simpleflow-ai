"use client";

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
import { Textarea } from "@/components/ui/textArea";
import {
  createWorkspaceTask,
  getWorkspaceById,
  type Workspace,
} from "@/lib/backend-api";
import { useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TaskForm = {
  columnId: string;
  title: string;
  description: string;
};

export default function WorkspaceProjects() {
  const params = useParams({ strict: false });
  const workspaceId = params.projectId as string | undefined;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskForm>({
    columnId: "",
    title: "",
    description: "",
  });

  const loadWorkspace = async () => {
    if (!workspaceId) {
      setErrorMessage("Missing workspace id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getWorkspaceById(workspaceId);
      setWorkspace(data);

      if (data.columns?.[0]?.id) {
        setTaskForm((prev) => ({
          ...prev,
          columnId: prev.columnId || data.columns?.[0]?.id || "",
        }));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load workspace details",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, [workspaceId]);

  const totalTasks = useMemo(() => {
    return (
      workspace?.columns?.reduce((total, column) => {
        return total + (column.tasks?.length ?? 0);
      }, 0) ?? 0
    );
  }, [workspace]);

  const handleCreateTask = async () => {
    if (!workspaceId || !taskForm.columnId || !taskForm.title.trim()) {
      setErrorMessage("Column and title are required to create a task");
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      await createWorkspaceTask(workspaceId, {
        columnId: taskForm.columnId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
      });

      setTaskForm({
        columnId: taskForm.columnId,
        title: "",
        description: "",
      });
      setIsDialogOpen(false);
      await loadWorkspace();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create task",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-4 text-sm text-red-600">
        {errorMessage || "Workspace not found"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          <p className="text-sm text-muted-foreground">
            {totalTasks} task(s) across {workspace.columns?.length ?? 0}{" "}
            column(s)
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                <Label htmlFor="task-column">Column</Label>
                <Select
                  value={taskForm.columnId}
                  onValueChange={(value) =>
                    setTaskForm((prev) => ({ ...prev, columnId: value }))
                  }
                >
                  <SelectTrigger id="task-column">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {(workspace.columns ?? []).map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Task title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional task description"
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

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(workspace.columns ?? []).map((column) => (
          <Card key={column.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{column.name}</span>
                <span className="text-xs text-muted-foreground">
                  {column.tasks?.length ?? 0}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(column.tasks ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tasks in this column.
                </p>
              ) : (
                (column.tasks ?? []).map((task) => (
                  <div key={task.id} className="rounded border p-3 bg-gray-50">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
