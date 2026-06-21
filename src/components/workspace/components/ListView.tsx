import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Workspace } from "@/lib/backend-api";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Flag,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { toPastelBackground } from "../utils/color";
import { parseTaskMeta, percentDone } from "../utils/task-meta";

type Column = NonNullable<Workspace["columns"]>[number];
type Task = NonNullable<Column["tasks"]>[number];

export interface ListViewProps {
  columns: Array<{
    id: string;
    name: string;
    position: number;
    type?: string;
    tasks?: Array<{
      id: string;
      title: string;
      description?: string | null;
      customFieldValues?: Record<string, unknown> | null;
    }>;
  }>;
  effectiveColumnColors: Record<string, string>;
  onViewTask: (task: Task, columnId: string) => void;
  onEditTask: (task: Task, columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateTask: (columnId?: string) => void;
  onMoveTask?: (taskId: string, targetColumnName: string) => void;
  allColumns?: Array<{ id: string; name: string }>;
}

const PRIORITY_COLOR: Record<string, string> = {
  low: "#eab308",
  medium: "#3b82f6",
  high: "#ef4444",
};

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ListView({
  columns,
  effectiveColumnColors,
  onViewTask,
  onEditTask: _onEditTask,
  onDeleteTask,
  onCreateTask,
  onMoveTask,
  allColumns,
}: ListViewProps) {
  const sortedColumns = useMemo(
    () =>
      [...columns].sort((a, b) => {
        const aCompleted = a.type === "COMPLETED" ? 1 : 0;
        const bCompleted = b.type === "COMPLETED" ? 1 : 0;
        if (aCompleted !== bCompleted) return aCompleted - bCompleted;
        return a.position - b.position;
      }),
    [columns],
  );

  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const toggleGroup = (columnId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  return (
    <div className="w-full space-y-2 p-2">
      {sortedColumns.map((column) => {
        const tasks = column.tasks ?? [];
        const isCollapsed = collapsedGroups[column.id] ?? false;
        const columnColor = effectiveColumnColors[column.id] ?? "#64748b";

        return (
          <div
            key={column.id}
            className="rounded-md border border-border bg-card"
          >
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroup(column.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted ${
                isCollapsed ? "rounded-md" : "rounded-t-md"
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: columnColor }}
              />
              <span className="text-xs font-semibold text-foreground">
                {column.name}
              </span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {tasks.length}
              </span>
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTask(column.id);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </button>

            {/* Table content */}
            {!isCollapsed && (
              <>
                {tasks.length === 0 ? (
                  <div className="border-t border-border px-3 py-4 text-center text-xs text-muted-foreground">
                    No tasks in this column
                  </div>
                ) : (
                  <div className="[&_[data-slot=table-container]]:rounded-b-md">
                    <Table className="min-w-[640px]">
                      <TableHeader>
                        <TableRow className="border-border bg-muted/50">
                          <TableHead className="w-[30%] pl-10 text-xs font-medium text-muted-foreground">
                            Task Name
                          </TableHead>
                          <TableHead className="w-[12%] text-xs font-medium text-muted-foreground">
                            Status
                          </TableHead>
                          <TableHead className="w-[8%] text-xs font-medium text-muted-foreground">
                            Priority
                          </TableHead>
                          <TableHead className="w-[14%] text-xs font-medium text-muted-foreground">
                            Labels
                          </TableHead>
                          <TableHead className="w-[12%] text-xs font-medium text-muted-foreground">
                            Due Date
                          </TableHead>
                          <TableHead className="w-[10%] text-xs font-medium text-muted-foreground">
                            Checklist
                          </TableHead>
                          <TableHead className="w-[6%] text-right text-xs font-medium text-muted-foreground">
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => {
                          const meta = parseTaskMeta(task.customFieldValues);
                          const overdue = isOverdue(meta.dueDate);
                          const checklistPct = percentDone(meta.checklist);

                          return (
                            <TableRow
                              key={task.id}
                              className="cursor-pointer border-border transition-colors hover:bg-muted"
                              onClick={() => onViewTask(task, String(column.id))}
                            >
                              {/* Task Name */}
                              <TableCell className="pl-10">
                                <span className="text-sm font-medium text-foreground">
                                  {task.title}
                                </span>
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                {onMoveTask && allColumns ? (
                                  <Select
                                    value={String(column.id)}
                                    onValueChange={(targetColId) => {
                                      const target = allColumns.find((c) => c.id === targetColId);
                                      if (target && target.id !== String(column.id)) {
                                        onMoveTask(task.id, target.name);
                                      }
                                    }}
                                  >
                                    <SelectTrigger
                                      className="h-auto border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium cursor-pointer text-white"
                                        style={{ backgroundColor: columnColor }}
                                      >
                                        {column.name}
                                      </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {allColumns.map((col) => (
                                        <SelectItem key={col.id} value={col.id} className="text-xs">
                                          <span className="flex items-center gap-2">
                                            <span
                                              className="inline-block h-2.5 w-2.5 rounded-full"
                                              style={{ backgroundColor: effectiveColumnColors[col.id] ?? "#94a3b8" }}
                                            />
                                            {col.name}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span
                                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                                    style={{ backgroundColor: columnColor }}
                                  >
                                    {column.name}
                                  </span>
                                )}
                              </TableCell>

                              {/* Priority */}
                              <TableCell>
                                <span className="inline-flex items-center gap-1.5 text-xs capitalize">
                                  <Flag
                                    className="h-3.5 w-3.5"
                                    style={{
                                      color:
                                        PRIORITY_COLOR[meta.priority] ??
                                        "#3b82f6",
                                    }}
                                  />
                                  {meta.priority}
                                </span>
                              </TableCell>

                              {/* Labels */}
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {meta.labels.map((label) => (
                                    <span
                                      key={`${label.name}-${label.color}`}
                                      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] text-foreground"
                                      style={{
                                        borderColor: label.color,
                                        backgroundColor: toPastelBackground(
                                          label.color,
                                          0.14,
                                        ),
                                      }}
                                    >
                                      {label.name}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>

                              {/* Due Date */}
                              <TableCell>
                                {meta.dueDate ? (
                                  <span
                                    className={`inline-flex items-center gap-1 text-xs ${
                                      overdue
                                        ? "font-medium text-red-600 dark:text-red-400"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(meta.dueDate)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">
                                    --
                                  </span>
                                )}
                              </TableCell>

                              {/* Checklist */}
                              <TableCell>
                                {meta.checklist.length > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${checklistPct}%`,
                                          backgroundColor:
                                            checklistPct === 100
                                              ? "#22c55e"
                                              : "#3b82f6",
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {
                                        meta.checklist.filter(
                                          (item) => item.done,
                                        ).length
                                      }
                                      /{meta.checklist.length}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">
                                    --
                                  </span>
                                )}
                              </TableCell>

                              {/* Delete */}
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(task.id);
                                  }}
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {sortedColumns.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No columns found. Create a status column to get started.
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  onDeleteTask(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
