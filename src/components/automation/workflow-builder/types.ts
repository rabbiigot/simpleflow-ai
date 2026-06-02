import type {
  AutomationActionType,
  AutomationTriggerType,
  ConditionLogicGate,
  ConditionOperator,
} from "@/lib/backend-api";

// ---- Node definitions used throughout the workflow builder ----

export type TriggerNodeData = {
  id: string;
  type: AutomationTriggerType;
  config: Record<string, unknown>;
};

export type ActionNodeData = {
  id: string;
  type: AutomationActionType;
  config: Record<string, unknown>;
  sortOrder: number;
};

export type ConditionNodeData = {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  logicGate: ConditionLogicGate;
  sortOrder: number;
};

export type WorkflowState = {
  trigger: TriggerNodeData | null;
  actions: ActionNodeData[];
  conditions: ConditionNodeData[];
};

export type SelectedNode =
  | { kind: "trigger"; id: string }
  | { kind: "action"; id: string }
  | { kind: "condition"; id: string };

// ---- Palette items ----

export type PaletteItem = {
  type: AutomationTriggerType | AutomationActionType;
  label: string;
  kind: "trigger" | "action";
};
