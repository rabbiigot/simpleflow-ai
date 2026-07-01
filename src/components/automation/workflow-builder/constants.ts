import type { AutomationActionType, AutomationTriggerType, ConditionOperator } from "@/lib/backend-api";
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle,
  Clock3,
  Edit,
  GitBranch,
  ListTodo,
  type LucideIcon,
  Mail,
  MessageSquare,
  Plus,
  Share2,
  Split,
  Timer,
} from "lucide-react";
import type { PaletteItem } from "./types";

// ---- Trigger palette items ----

export const TRIGGER_PALETTE: PaletteItem[] = [
  { type: "TASK_COMPLETED", label: "Task Completed", kind: "trigger" },
  { type: "TASK_MOVED", label: "Task Moved", kind: "trigger" },
  { type: "TASK_CREATED", label: "Task Created", kind: "trigger" },
  { type: "TASK_UPDATED", label: "Task Updated", kind: "trigger" },
  { type: "POST_CREATED", label: "Post Created", kind: "trigger" },
  { type: "CRON", label: "Scheduled (Cron)", kind: "trigger" },
];

// ---- Action palette items ----

export const ACTION_PALETTE: PaletteItem[] = [
  { type: "SEND_EMAIL", label: "Send Email", kind: "action" },
  { type: "CREATE_POST", label: "Create Post", kind: "action" },
  { type: "CREATE_TASK", label: "Create Task", kind: "action" },
  { type: "MOVE_TASK", label: "Move Task", kind: "action" },
];

// ---- Logic (branch) palette items ----

export const LOGIC_PALETTE: PaletteItem[] = [
  { type: "IF_ELSE", label: "IF / ELSE", kind: "ifElse" },
  { type: "SWITCH", label: "Switch", kind: "switch" },
];

// ---- Branch node icons / colors ----

export const LOGIC_ICONS: Record<"ifElse" | "switch", LucideIcon> = {
  ifElse: GitBranch,
  switch: Split,
};

// ---- Icon map ----

export const NODE_ICONS: Record<
  AutomationTriggerType | AutomationActionType,
  LucideIcon
> = {
  TASK_COMPLETED: CheckCircle,
  TASK_MOVED: ArrowRightLeft,
  TASK_CREATED: Plus,
  TASK_UPDATED: Edit,
  POST_CREATED: MessageSquare,
  CLOCK_IN: Clock3,
  CLOCK_OUT: Clock3,
  CRON: Timer,
  SEND_EMAIL: Mail,
  CREATE_POST: Share2,
  CREATE_TASK: ListTodo,
  MOVE_TASK: ArrowRight,
};

// ---- Human-readable labels ----

export const NODE_LABELS: Record<
  AutomationTriggerType | AutomationActionType,
  string
> = {
  TASK_COMPLETED: "Task Completed",
  TASK_MOVED: "Task Moved",
  TASK_CREATED: "Task Created",
  TASK_UPDATED: "Task Updated",
  POST_CREATED: "Post Created",
  CLOCK_IN: "Clock In",
  CLOCK_OUT: "Clock Out",
  CRON: "Scheduled (Cron)",
  SEND_EMAIL: "Send Email",
  CREATE_POST: "Create Post",
  CREATE_TASK: "Create Task",
  MOVE_TASK: "Move Task",
};

// ---- Template variable hints per trigger type ----

export const TEMPLATE_VARIABLES: Record<AutomationTriggerType, string[]> = {
  TASK_COMPLETED: ["{{taskTitle}}", "{{taskDescription}}", "{{workspaceName}}", "{{columnName}}"],
  TASK_MOVED: ["{{taskTitle}}", "{{fromColumn}}", "{{toColumn}}", "{{workspaceName}}"],
  TASK_CREATED: ["{{taskTitle}}", "{{taskDescription}}", "{{workspaceName}}"],
  TASK_UPDATED: ["{{taskTitle}}", "{{taskDescription}}", "{{workspaceName}}"],
  POST_CREATED: ["{{postContent}}", "{{authorName}}"],
  CLOCK_IN: ["{{userName}}", "{{clockInTime}}"],
  CLOCK_OUT: ["{{userName}}", "{{clockOutTime}}", "{{shiftDuration}}"],
  CRON: ["{{cronExpression}}", "{{firedAt}}", "{{automationName}}"],
};

// ---- Condition operator labels ----

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  EQUALS: "equals",
  NOT_EQUALS: "does not equal",
  CONTAINS: "contains",
  NOT_CONTAINS: "does not contain",
  GREATER_THAN: "greater than",
  LESS_THAN: "less than",
  GREATER_THAN_OR_EQUAL: "greater than or equal",
  LESS_THAN_OR_EQUAL: "less than or equal",
  IS_EMPTY: "is empty",
  IS_NOT_EMPTY: "is not empty",
  IN: "is in",
  NOT_IN: "is not in",
};

// ---- Common cron presets ----

export const CRON_PRESETS = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Every hour", expression: "0 * * * *" },
  { label: "Every day at 9 AM", expression: "0 9 * * *" },
  { label: "Every Monday at 9 AM", expression: "0 9 * * 1" },
  { label: "Every weekday at 9 AM", expression: "0 9 * * 1-5" },
  { label: "1st of every month at 9 AM", expression: "0 9 1 * *" },
];
