export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type TaskLabel = {
  name: string;
  color: string;
};

export type TaskMeta = {
  labels: TaskLabel[];
  priority: "low" | "medium" | "high";
  startDate: string;
  dueDate: string;
  repeat: string;
  notes: string;
  checklist: ChecklistItem[];
  attachments: string[];
  assigneeIds: string[];
  calendarEvent?: { title: string; time: string };
};

export type TaskEditorState = {
  mode: "create" | "edit";
  taskId: string;
  originalColumnId: string;
  columnId: string;
  title: string;
  description: string;
  labels: TaskLabel[];
  selectedExistingLabel: string;
  newLabelName: string;
  newLabelColor: string;
  _labelDropdownOpen: boolean;
  priority: "low" | "medium" | "high";
  startDate: string;
  dueDate: string;
  repeat: string;
  notes: string;
  checklist: ChecklistItem[];
  newChecklistItem: string;
  attachments: string[];
  newAttachment: string;
  assigneeIds: string[];
  calendarEvent?: { title: string; time: string };
};

export type ColumnColorMap = Record<string, string>;
