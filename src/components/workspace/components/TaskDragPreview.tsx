import type { Workspace } from "@/lib/backend-api";
import { GripVertical } from "lucide-react";
import { parseTaskMeta, percentDone } from "../utils/task-meta";

export function TaskDragPreview({
  task,
}: {
  task: NonNullable<NonNullable<Workspace["columns"]>[number]["tasks"]>[number];
}) {
  const meta = parseTaskMeta(task.customFieldValues);
  const checklistPercent = percentDone(meta.checklist);

  return (
    <div className="w-[300px] rounded-lg border border-border bg-card p-3 shadow-2xl">
      <div className="mb-2 flex items-start gap-1">
        <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm font-medium text-foreground">{task.title}</div>
      </div>
      {task.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {meta.checklist.filter((item) => item.done).length}/
          {meta.checklist.length} checklist
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">
          {checklistPercent}%
        </span>
      </div>
    </div>
  );
}
