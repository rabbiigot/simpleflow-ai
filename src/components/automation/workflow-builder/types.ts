import type {
  AutomationActionType,
  AutomationTriggerType,
  ConditionLogicGate,
  ConditionOperator,
} from "@/lib/backend-api";

// ---- Geometry ----

export type XY = { x: number; y: number };

// ---- Node definitions used throughout the workflow builder ----

export type TriggerNodeData = {
  id: string;
  type: AutomationTriggerType;
  config: Record<string, unknown>;
  position?: XY;
};

export type ActionNodeData = {
  id: string;
  type: AutomationActionType;
  config: Record<string, unknown>;
  sortOrder: number;
  position?: XY;
};

export type ConditionNodeData = {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  logicGate: ConditionLogicGate;
  sortOrder: number;
};

/** A single branch arm of a SWITCH node. */
export type SwitchCase = {
  id: string;
  label: string;
  operator: ConditionOperator;
  value: string;
};

/** IF / ELSE branch node — evaluates a condition group, has true/false outputs. */
export type IfElseNodeData = {
  id: string;
  conditions: ConditionNodeData[];
  position?: XY;
};

/** SWITCH branch node — routes on a field value across multiple cases + default. */
export type SwitchNodeData = {
  id: string;
  field: string;
  cases: SwitchCase[];
  position?: XY;
};

// ---- Graph model (nodes + edges) ----

export type WorkflowNode =
  | { kind: "trigger"; data: TriggerNodeData }
  | { kind: "action"; data: ActionNodeData }
  | { kind: "ifElse"; data: IfElseNodeData }
  | { kind: "switch"; data: SwitchNodeData };

export type WorkflowNodeKind = WorkflowNode["kind"];

/**
 * sourceHandle semantics:
 *  - action / trigger → "out"
 *  - ifElse → "true" | "false"
 *  - switch → <caseId> | "default"
 */
export type WorkflowEdge = {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
};

export type WorkflowGraph = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type SelectedNode =
  | { kind: "trigger"; id: string }
  | { kind: "action"; id: string }
  | { kind: "ifElse"; id: string }
  | { kind: "switch"; id: string };

// ---- Palette items ----

export type PaletteKind = "trigger" | "action" | "ifElse" | "switch";

export type PaletteItem = {
  /** For trigger/action this is the concrete enum value; for logic nodes it's the kind. */
  type: AutomationTriggerType | AutomationActionType | "IF_ELSE" | "SWITCH";
  label: string;
  kind: PaletteKind;
};
