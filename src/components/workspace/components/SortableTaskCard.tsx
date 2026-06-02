import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workspace, WorkspaceMember } from "@/lib/backend-api";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, CheckCircle2, Circle, Flag, GripVertical, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toPastelBackground } from "../utils/color";
import { parseTaskMeta, percentDone, truncateText } from "../utils/task-meta";

export function SortableTaskCard({
  task,
  columnId,
  columnColor,
  onView,
  onEdit: _onEdit,
  onDelete,
  members = [],
  onAssign,
}: {
  task: NonNullable<NonNullable<Workspace["columns"]>[number]["tasks"]>[number];
  columnId: string;
  columnColor: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  members?: WorkspaceMember[];
  onAssign?: (taskId: string, assigneeId: number | null) => void;
}) {
  const sortableId = `task-${task.id}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    data: { columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = parseTaskMeta(task.customFieldValues);
  const checklistPercent = percentDone(meta.checklist);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Resolve all assignees: from meta.assigneeIds + fallback to task.assigneeId
  const assigneeIdSet = new Set<string>(meta.assigneeIds);
  if (task.assigneeId) assigneeIdSet.add(String(task.assigneeId));
  const assignedMembers = members.filter((m) => assigneeIdSet.has(String(m.userId)));

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onView}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-lg p-[1px] bg-card border border-border/40 dark:border-border/60 transition-all hover:border-transparent hover:bg-linear-to-r hover:from-blue-500 hover:to-purple-500 shadow-sm cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="group rounded-md bg-card p-3">
        <div
          className="mb-2 h-[5px] w-[30%] rounded-full transition-all duration-300 ease-in-out group-hover:w-[50%]"
          style={{ backgroundColor: columnColor }}
        />
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
            <div
              className={`transition-all duration-200 ease-in-out ${
                isHovered
                  ? "w-5 opacity-100 translate-x-0"
                  : "w-0 opacity-0 -translate-x-2"
              } overflow-hidden flex-shrink-0`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium text-foreground transition-all duration-200 ease-in-out truncate min-w-0">{task.title}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {task.description ? (
          <p className="text-xs text-muted-foreground">
            {truncateText(task.description, 80)}
          </p>
        ) : null}

        {/* Attachment image preview */}
        {task.attachments && task.attachments.length > 0 && (() => {
          const firstImage = task.attachments.find((a) => a.mimetype.startsWith("image/"));
          if (!firstImage) return null;
          return (
            <div className="mt-2 h-24 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 relative">
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-muted" />
              )}
              <img
                src={firstImage.url}
                alt={firstImage.filename}
                className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
              {task.attachments.length > 1 && (
                <span className="mt-1 inline-block text-[10px] text-muted-foreground">
                  +{task.attachments.length - 1} more
                </span>
              )}
            </div>
          );
        })()}

        {(meta.labels ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {meta.labels.slice(0, 3).map((label) => (
              <span
                key={`${label.name}-${label.color}`}
                className="rounded-md border px-2 py-0.5 text-[10px] font-medium text-foreground"
                style={{
                  borderColor: label.color,
                  backgroundColor: toPastelBackground(label.color, 0.14),
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
            <Flag
              className={`h-3 w-3 ${
                meta.priority === "high"
                  ? "text-red-500 fill-red-500"
                  : meta.priority === "medium"
                    ? "text-blue-500 fill-blue-500"
                    : "text-gray-400 fill-gray-400"
              }`}
            />
            <span className="text-muted-foreground capitalize">
              {meta.priority}
            </span>
          </span>
          {meta.dueDate && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                new Date(meta.dueDate) < new Date()
                  ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {new Date(meta.dueDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Checklist preview */}
        {meta.checklist.length > 0 && (
          <div className="mt-3 space-y-1">
            {meta.checklist.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center gap-1.5">
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                )}
                <span className={`text-[11px] truncate ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {item.text}
                </span>
              </div>
            ))}
            {meta.checklist.length > 2 && (
              <div className="text-[10px] text-muted-foreground/70 pl-5">
                +{meta.checklist.length - 2} more &middot; click to view details
              </div>
            )}
          </div>
        )}

        {/* Assignee + Calendar + Progress */}
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className="focus:outline-none"
              >
                {assignedMembers.length > 0 ? (
                  <div className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 transition-colors hover:bg-muted">
                    <div className="flex items-center -space-x-1.5">
                      {assignedMembers.slice(0, 3).map((m) => (
                        <Avatar key={m.userId} className="h-5 w-5 border-2 border-card ring-0" title={`${m.user.firstName} ${m.user.lastName}`}>
                          <AvatarImage src={m.user.avatarUrl || undefined} />
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {assignedMembers.length > 3 && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-muted text-[7px] font-medium">
                          +{assignedMembers.length - 3}
                        </div>
                      )}
                    </div>
                    {assignedMembers.length === 1 && (
                      <span className="text-[11px] text-muted-foreground">
                        {assignedMembers[0].user.firstName}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary hover:bg-primary/5">
                    <UserPlus className="h-3 w-3" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-[180px]"
              onClick={(e) => e.stopPropagation()}
            >
              {assignedMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => onAssign?.(String(task.id), null)}
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Unassign all
                </button>
              )}
              {members.map((m) => {
                const isActive = assigneeIdSet.has(String(m.userId));
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => onAssign?.(String(task.id), m.userId)}
                    className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={m.user.avatarUrl || undefined} />
                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                        {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1">{m.user.firstName} {m.user.lastName}</span>
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          {meta.calendarEvent && (
            <div
              className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 border border-emerald-400 px-1.5 py-0.5 shrink-0"
              title={`${meta.calendarEvent.title} — ${meta.calendarEvent.time}`}
            >
              <Calendar className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
              <span className="text-[8px] font-medium text-emerald-700 truncate max-w-[60px]">{meta.calendarEvent.time || meta.calendarEvent.title}</span>
            </div>
          )}
          </div>
          <CircularProgress
            value={checklistPercent}
            size={30}
            strokeWidth={3.5}
            labelClassName="text-[8px] font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
