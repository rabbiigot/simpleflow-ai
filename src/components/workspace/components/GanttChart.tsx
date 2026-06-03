import type { Workspace } from "@/lib/backend-api";
import { useMemo, useRef, useState } from "react";
import { parseTaskMeta } from "../utils/task-meta";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Column = NonNullable<Workspace["columns"]>[number];
type Task = NonNullable<Column["tasks"]>[number];

type GanttTask = {
  id: string;
  title: string;
  columnName: string;
  columnColor: string;
  startDate: Date;
  endDate: Date;
  progress: number;
};

export interface GanttChartProps {
  columns: Column[];
  effectiveColumnColors: Record<string, string>;
  onViewTask: (task: Task, columnId: string) => void;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonthDay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const DAY_WIDTH = 36;

export function GanttChart({ columns, effectiveColumnColors, onViewTask }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const ganttTasks = useMemo<GanttTask[]>(() => {
    const tasks: GanttTask[] = [];
    for (const col of columns) {
      const color = effectiveColumnColors[String(col.id)] ?? "#94a3b8";
      for (const task of col.tasks ?? []) {
        const meta = parseTaskMeta(task.customFieldValues);
        if (!meta.startDate && !meta.dueDate) continue;

        const today = startOfDay(new Date());
        const start = meta.startDate ? startOfDay(new Date(meta.startDate)) : today;
        const end = meta.dueDate ? startOfDay(new Date(meta.dueDate)) : addDays(start, 7);

        const checkedCount = meta.checklist.filter((i) => i.done).length;
        const totalCount = meta.checklist.length;
        const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

        tasks.push({
          id: task.id,
          title: task.title,
          columnName: col.name,
          columnColor: color,
          startDate: start,
          endDate: end.getTime() <= start.getTime() ? addDays(start, 1) : end,
          progress,
        });
      }
    }
    return tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [columns, effectiveColumnColors]);

  // Timeline range: 4 weeks centered around current week + offset
  const today = startOfDay(new Date());
  const rangeStart = addDays(today, weekOffset * 7 - 14);
  const rangeEnd = addDays(rangeStart, 28);
  const totalDays = diffDays(rangeStart, rangeEnd);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      arr.push(addDays(rangeStart, i));
    }
    return arr;
  }, [rangeStart.getTime(), totalDays]);

  // Group days by week (kept for future use)
  // const weeks = useMemo(() => { ... }, [days]);

  const visibleTasks = ganttTasks.filter(
    (t) => t.endDate >= rangeStart && t.startDate <= rangeEnd,
  );

  const getBarStyle = (task: GanttTask) => {
    const startOffset = Math.max(0, diffDays(rangeStart, task.startDate));
    const endOffset = Math.min(totalDays, diffDays(rangeStart, task.endDate));
    const barDays = Math.max(1, endOffset - startOffset);
    return {
      left: startOffset * DAY_WIDTH,
      width: barDays * DAY_WIDTH,
    };
  };

  const findOriginalTask = (ganttTask: GanttTask) => {
    for (const col of columns) {
      const task = (col.tasks ?? []).find((t) => t.id === ganttTask.id);
      if (task) return { task, columnId: String(col.id) };
    }
    return null;
  };

  if (ganttTasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16">
        <p className="text-sm text-muted-foreground">No tasks with dates to display</p>
        <p className="text-xs text-muted-foreground/60">Set start and due dates on tasks to see them on the Gantt chart</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setWeekOffset((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatMonthDay(rangeStart)} — {formatMonthDay(addDays(rangeEnd, -1))}
        </span>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Task list (left) */}
        <div className="w-52 shrink-0 border-r">
          <div className="h-10 border-b bg-muted/50 flex items-center px-3">
            <span className="text-xs font-medium text-muted-foreground">Task</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100% - 40px)" }}>
            {visibleTasks.map((t) => (
              <div
                key={t.id}
                className="h-10 flex items-center px-3 border-b border-border/50 cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  const found = findOriginalTask(t);
                  if (found) onViewTask(found.task, found.columnId);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: t.columnColor }}
                  />
                  <span className="text-xs truncate text-foreground">{t.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline (right) */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto">
          {/* Header: days */}
          <div className="sticky top-0 z-10 bg-muted/50 border-b" style={{ minWidth: totalDays * DAY_WIDTH }}>
            <div className="flex h-10">
              {days.map((day, i) => {
                const isToday = day.getTime() === today.getTime();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center border-r border-border/30 text-[9px] ${
                      isToday
                        ? "bg-primary/10 font-bold text-primary"
                        : isWeekend
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground"
                    }`}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span>{day.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                    <span>{day.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bars */}
          <div style={{ minWidth: totalDays * DAY_WIDTH }}>
            {visibleTasks.map((t) => {
              const { left, width } = getBarStyle(t);
              return (
                <div key={t.id} className="relative h-10 border-b border-border/30">
                  {/* Today marker */}
                  {today >= rangeStart && today <= rangeEnd && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-primary/40 z-0"
                      style={{ left: diffDays(rangeStart, today) * DAY_WIDTH + DAY_WIDTH / 2 }}
                    />
                  )}
                  <div
                    className="absolute top-1.5 h-7 rounded-md cursor-pointer transition-opacity hover:opacity-80 flex items-center overflow-hidden"
                    style={{ left, width, backgroundColor: t.columnColor }}
                    title={`${t.title}\n${formatMonthDay(t.startDate)} — ${formatMonthDay(t.endDate)}`}
                    onClick={() => {
                      const found = findOriginalTask(t);
                      if (found) onViewTask(found.task, found.columnId);
                    }}
                  >
                    {/* Progress fill */}
                    {t.progress > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-white/20 rounded-l-md"
                        style={{ width: `${t.progress}%` }}
                      />
                    )}
                    <span className="relative z-10 px-2 text-[10px] font-medium text-white truncate">
                      {t.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
