import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { Workspace, WorkspaceMember } from "@/lib/backend-api";
import type { ColumnColorMap } from "../types/workspace.types";
import { parseTaskMeta, percentDone } from "../utils/task-meta";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  AlertTriangle,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type Props = {
  workspace: Workspace;
  columns: NonNullable<Workspace["columns"]>;
  members: WorkspaceMember[];
  effectiveColumnColors: ColumnColorMap;
  currentUserId: string;
};

export function DashboardView({
  workspace,
  columns,
  members,
  effectiveColumnColors,
  currentUserId,
}: Props) {
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let overdue = 0;
    let highPriority = 0;
    const today = new Date().toISOString().slice(0, 10);

    const byColumn: Array<{
      id: string;
      name: string;
      color: string;
      count: number;
      type?: string;
    }> = [];

    const assigneeCounts: Record<string, number> = {};

    for (const col of columns) {
      const tasks = col.tasks ?? [];
      total += tasks.length;

      if (col.type === "COMPLETED") {
        completed += tasks.length;
      }

      byColumn.push({
        id: String(col.id),
        name: col.name,
        color: effectiveColumnColors[String(col.id)] || "#94a3b8",
        count: tasks.length,
        type: col.type,
      });

      for (const task of tasks) {
        const meta = parseTaskMeta(task.customFieldValues);
        if (meta.dueDate && meta.dueDate < today && col.type !== "COMPLETED") {
          overdue++;
        }
        if (meta.priority === "high" && col.type !== "COMPLETED") {
          highPriority++;
        }
        for (const aid of meta.assigneeIds) {
          assigneeCounts[aid] = (assigneeCounts[aid] || 0) + 1;
        }
        if (task.assigneeId) {
          const aid = String(task.assigneeId);
          if (!meta.assigneeIds.includes(aid)) {
            assigneeCounts[aid] = (assigneeCounts[aid] || 0) + 1;
          }
        }
      }
    }

    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, overdue, highPriority, completionPercent, byColumn, assigneeCounts };
  }, [columns, effectiveColumnColors]);

  const recentTasks = useMemo(() => {
    const all: Array<{
      id: string;
      title: string;
      columnName: string;
      columnColor: string;
      createdAt: string;
      priority: string;
      dueDate: string;
    }> = [];

    for (const col of columns) {
      for (const task of col.tasks ?? []) {
        const meta = parseTaskMeta(task.customFieldValues);
        all.push({
          id: String(task.id),
          title: task.title,
          columnName: col.name,
          columnColor: effectiveColumnColors[String(col.id)] || "#94a3b8",
          createdAt: task.createdAt || "",
          priority: meta.priority,
          dueDate: meta.dueDate,
        });
      }
    }

    return all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [columns, effectiveColumnColors]);

  const [showAllTasks, setShowAllTasks] = useState(false);
  const visibleTasks = showAllTasks ? recentTasks : recentTasks.slice(0, 5);

  const aiInsights = useMemo(() => {
    const insights: Array<{ text: string; type: "info" | "warning" | "success" }> = [];

    if (stats.total === 0) {
      insights.push({ text: "No tasks yet. Start by creating your first task to track progress.", type: "info" });
      return insights;
    }

    if (stats.completionPercent === 100) {
      insights.push({ text: "All tasks are completed! Great job on finishing this project.", type: "success" });
    } else if (stats.completionPercent >= 75) {
      insights.push({ text: `Almost there! ${stats.total - stats.completed} tasks remaining to complete the project.`, type: "success" });
    } else if (stats.completionPercent < 25 && stats.total > 3) {
      insights.push({ text: `Project is in early stages with only ${stats.completionPercent}% completed. Consider prioritizing key tasks.`, type: "info" });
    }

    if (stats.overdue > 0) {
      insights.push({
        text: `${stats.overdue} ${stats.overdue === 1 ? "task is" : "tasks are"} past due. Review and reschedule to keep the project on track.`,
        type: "warning",
      });
    }

    if (stats.highPriority > 0) {
      insights.push({
        text: `${stats.highPriority} high-priority ${stats.highPriority === 1 ? "task needs" : "tasks need"} attention.`,
        type: "warning",
      });
    }

    const largestBucket = stats.byColumn.reduce<(typeof stats.byColumn)[number] | null>(
      (max, col) => (!max || col.count > max.count ? col : max),
      null,
    );
    if (largestBucket && largestBucket.count > 0 && stats.byColumn.length > 1) {
      const pct = Math.round((largestBucket.count / stats.total) * 100);
      if (pct >= 50) {
        insights.push({
          text: `"${largestBucket.name}" holds ${pct}% of all tasks. Consider distributing work across buckets.`,
          type: "info",
        });
      }
    }

    const unassigned = columns.reduce((count, col) => {
      for (const task of col.tasks ?? []) {
        const meta = parseTaskMeta(task.customFieldValues);
        if (!task.assigneeId && meta.assigneeIds.length === 0) count++;
      }
      return count;
    }, 0);
    if (unassigned > 0) {
      insights.push({
        text: `${unassigned} ${unassigned === 1 ? "task is" : "tasks are"} unassigned. Assign team members to improve accountability.`,
        type: "info",
      });
    }

    if (insights.length === 0) {
      insights.push({ text: "Project is progressing steadily. Keep up the momentum!", type: "success" });
    }

    return insights;
  }, [stats, columns]);

  return (
    <div className="h-full overflow-auto space-y-4 p-1">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="gap-0 py-0">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <ListTodo className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.overdue}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.highPriority}</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card className="gap-0 py-0">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Project Completion</p>
            <span className="text-sm font-semibold text-foreground">{stats.completionPercent}%</span>
          </div>
          <Progress value={stats.completionPercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats.completed} of {stats.total} tasks completed
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Tasks by bucket — donut chart + AI insights */}
        <Card className="gap-0 py-0">
          <CardHeader className="pb-0 pt-4 px-4">
            <CardTitle className="text-sm font-medium">Tasks by Bucket</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.byColumn.length === 0 ? (
              <p className="text-xs text-muted-foreground pt-2">No buckets yet</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {/* Donut chart */}
                  <div className="relative h-[180px] w-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.byColumn.filter((c) => c.count > 0)}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {stats.byColumn.filter((c) => c.count > 0).map((col) => (
                            <Cell key={col.id} fill={col.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const d = payload[0].payload as (typeof stats.byColumn)[number];
                            const pct = stats.total > 0 ? Math.round((d.count / stats.total) * 100) : 0;
                            return (
                              <div className="rounded-lg border bg-card px-2.5 py-1.5 text-xs shadow-md">
                                <span className="font-medium text-foreground">{d.name}</span>
                                <span className="text-muted-foreground ml-1.5">{d.count} ({pct}%)</span>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-foreground">{stats.total}</span>
                      <span className="text-[10px] text-muted-foreground">Tasks</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2.5">
                    {stats.byColumn.map((col) => {
                      const pct = stats.total > 0 ? Math.round((col.count / stats.total) * 100) : 0;
                      return (
                        <div key={col.id} className="flex items-center gap-2 text-xs">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: col.color }}
                          />
                          <span className="min-w-0 flex-1 text-foreground truncate">{col.name}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {col.count}
                          </span>
                          <span className="shrink-0 w-9 text-right tabular-nums text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    AI Insights
                  </div>
                  <div className="space-y-1.5">
                    {aiInsights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] leading-relaxed">
                        <span
                          className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                            insight.type === "warning"
                              ? "bg-amber-500"
                              : insight.type === "success"
                                ? "bg-emerald-500"
                                : "bg-blue-500"
                          }`}
                        />
                        <span className="text-muted-foreground">{insight.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team members */}
        <Card className="gap-0 py-0">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Team ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {members.map((m) => {
                const name = [m.user.firstName, m.user.lastName].filter(Boolean).join(" ") || m.user.email;
                const ini = `${m.user.firstName?.[0] || ""}${m.user.lastName?.[0] || ""}`.toUpperCase() || "U";
                const taskCount = stats.assigneeCounts[String(m.userId)] || 0;
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={m.user.avatarUrl ?? ""} />
                      <AvatarFallback className="text-[10px]">{ini}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.role}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {taskCount} {taskCount === 1 ? "task" : "tasks"}
                    </span>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground">No members yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent tasks */}
      <Card className="gap-0 py-0">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-1.5">
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                <span className="min-w-0 flex-1 text-xs text-foreground truncate">{task.title}</span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: task.columnColor }}
                >
                  {task.columnName}
                </span>
                {task.priority === "high" && (
                  <span className="shrink-0 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                    High
                  </span>
                )}
                {task.dueDate && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">{task.dueDate}</span>
                )}
              </div>
            ))}
            {recentTasks.length === 0 && (
              <p className="text-xs text-muted-foreground px-2">No tasks yet</p>
            )}
            {!showAllTasks && recentTasks.length > 5 && (
              <button
                onClick={() => setShowAllTasks(true)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1.5 cursor-pointer"
              >
                Load more
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
