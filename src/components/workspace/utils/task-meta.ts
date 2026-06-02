import type { ChecklistItem, TaskLabel, TaskMeta } from "../types/workspace.types";

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function parseTaskMeta(customFieldValues: unknown): TaskMeta {
  const root = asRecord(customFieldValues);
  const rawMeta = asRecord(root.__meta);

  const checklistRaw = Array.isArray(rawMeta.checklist)
    ? rawMeta.checklist
    : [];
  const checklist = checklistRaw
    .map((item) => {
      const parsed = asRecord(item);
      const text = typeof parsed.text === "string" ? parsed.text : "";
      if (!text.trim()) return null;
      return {
        id:
          typeof parsed.id === "string"
            ? parsed.id
            : `ci-${Date.now()}-${Math.random()}`,
        text,
        done: Boolean(parsed.done),
      };
    })
    .filter(Boolean) as ChecklistItem[];

  const labelsRaw = Array.isArray(rawMeta.labels) ? rawMeta.labels : [];
  const labels = labelsRaw
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim();
        if (!name) return null;
        return { name, color: "#94a3b8" };
      }

      const parsed = asRecord(item);
      const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
      if (!name) return null;
      const color =
        typeof parsed.color === "string" && parsed.color.trim()
          ? parsed.color.trim()
          : "#94a3b8";
      return { name, color };
    })
    .filter(Boolean) as TaskLabel[];

  const attachmentsRaw = Array.isArray(rawMeta.attachments)
    ? rawMeta.attachments
    : [];
  const attachments = attachmentsRaw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  const priorityRaw =
    typeof rawMeta.priority === "string" ? rawMeta.priority : "medium";
  const priority: "low" | "medium" | "high" =
    priorityRaw === "low" || priorityRaw === "high" ? priorityRaw : "medium";

  const assigneeIdsRaw = Array.isArray(rawMeta.assigneeIds)
    ? rawMeta.assigneeIds
    : [];
  const assigneeIds = assigneeIdsRaw
    .map((v) => String(v))
    .filter(Boolean);

  const calRaw = asRecord(rawMeta.calendarEvent);
  const calendarEvent = calRaw.title
    ? { title: String(calRaw.title), time: String(calRaw.time || "") }
    : undefined;

  return {
    labels,
    priority,
    startDate: typeof rawMeta.startDate === "string" ? rawMeta.startDate : "",
    dueDate: typeof rawMeta.dueDate === "string" ? rawMeta.dueDate : "",
    repeat: typeof rawMeta.repeat === "string" ? rawMeta.repeat : "none",
    notes: typeof rawMeta.notes === "string" ? rawMeta.notes : "",
    checklist,
    attachments,
    assigneeIds,
    calendarEvent,
  };
}

export function mergeCustomFieldValues(
  original: unknown,
  meta: TaskMeta,
): Record<string, unknown> {
  const base = asRecord(original);
  return {
    ...base,
    __meta: meta,
  };
}

export function percentDone(items: ChecklistItem[]) {
  if (!items.length) return 0;
  const done = items.filter((item) => item.done).length;
  return Math.round((done / items.length) * 100);
}

export function isTaskDone(meta: TaskMeta) {
  if (!meta.checklist.length) return false;
  return meta.checklist.every((item) => item.done);
}

export function truncateText(value: string, limit = 20) {
  const normalized = value.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit)}...`;
}
