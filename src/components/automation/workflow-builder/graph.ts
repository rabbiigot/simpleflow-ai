import type {
  AutomationActionType,
  AutomationData,
  AutomationTriggerType,
  ConditionLogicGate,
  ConditionOperator,
} from "@/lib/backend-api";
import type {
  ActionNodeData,
  IfElseNodeData,
  SwitchCase,
  TriggerNodeData,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
} from "./types";

export function uid() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Layout constants (shared by autoLayout). Flow runs LEFT -> RIGHT: each depth
// advances along x; siblings/branches spread along y.
// ---------------------------------------------------------------------------
export const NODE_W = 230;
/** Horizontal distance between successive steps (one per depth level). */
export const COL_GAP = NODE_W + 120;
/** Vertical distance between sibling branches. */
export const ROW_GAP = 130;

// ---------------------------------------------------------------------------
// Serialized shape — what we persist in `trigger.config.__graph`.
// Kept minimal + self-contained so the backend engine can walk it without
// cross-referencing the flat actions[] table.
// ---------------------------------------------------------------------------

export const GRAPH_CONFIG_KEY = "__graph";

type SerializedCondition = {
  field: string;
  operator: ConditionOperator;
  value: string;
  logicGate: ConditionLogicGate;
  sortOrder: number;
};

export type SerializedNode =
  | { id: string; kind: "trigger"; position?: { x: number; y: number } }
  | {
      id: string;
      kind: "action";
      actionType: AutomationActionType;
      config: Record<string, unknown>;
      sortOrder: number;
      position?: { x: number; y: number };
    }
  | {
      id: string;
      kind: "ifElse";
      conditions: SerializedCondition[];
      position?: { x: number; y: number };
    }
  | {
      id: string;
      kind: "switch";
      field: string;
      cases: SwitchCase[];
      position?: { x: number; y: number };
    };

export type SerializedGraph = {
  nodes: SerializedNode[];
  edges: WorkflowEdge[];
};

// ---------------------------------------------------------------------------
// Graph traversal helpers
// ---------------------------------------------------------------------------

export function getTriggerNode(graph: WorkflowGraph): WorkflowNode | undefined {
  return graph.nodes.find((n) => n.kind === "trigger");
}

export function nodeId(n: WorkflowNode): string {
  return n.data.id;
}

/** Ordered output handle ids for a node (drives layout + UI handle order). */
export function outputHandles(n: WorkflowNode): string[] {
  switch (n.kind) {
    case "ifElse":
      return ["true", "false"];
    case "switch":
      return [...n.data.cases.map((c) => c.id), "default"];
    default:
      return ["out"];
  }
}

function orderedChildren(graph: WorkflowGraph, id: string): string[] {
  const node = graph.nodes.find((n) => n.data.id === id);
  if (!node) return [];
  const order = outputHandles(node);
  const edges = graph.edges.filter((e) => e.source === id);
  return edges
    .slice()
    .sort(
      (a, b) =>
        order.indexOf(a.sourceHandle ?? "out") -
        order.indexOf(b.sourceHandle ?? "out"),
    )
    .map((e) => e.target);
}

// ---------------------------------------------------------------------------
// Auto layout — recursive top-down tree layout with per-branch horizontal
// spread so nested IF/SWITCH branches don't overlap.
// ---------------------------------------------------------------------------

export function autoLayout(graph: WorkflowGraph): WorkflowGraph {
  const trigger = getTriggerNode(graph);
  const positions = new Map<string, { x: number; y: number }>();
  const placed = new Set<string>();

  // Returns the vertical span (in row-slots) the subtree occupies.
  function layout(id: string, depth: number, offset: number): number {
    if (placed.has(id)) return 0;
    placed.add(id);

    const kids = orderedChildren(graph, id);
    if (kids.length === 0) {
      positions.set(id, { x: depth * COL_GAP, y: offset * ROW_GAP });
      return 1;
    }

    let cursor = offset;
    let total = 0;
    for (const k of kids) {
      const h = layout(k, depth + 1, cursor);
      cursor += h;
      total += h;
    }
    total = Math.max(total, 1);
    positions.set(id, {
      x: depth * COL_GAP,
      y: (offset + total / 2 - 0.5) * ROW_GAP,
    });
    return total;
  }

  if (trigger) layout(trigger.data.id, 0, 0);

  // Park any unreachable/orphan nodes above the flow so they remain editable.
  let orphanRow = 1;
  for (const n of graph.nodes) {
    if (!positions.has(n.data.id)) {
      positions.set(n.data.id, { x: 0, y: -orphanRow * ROW_GAP });
      orphanRow++;
    }
  }

  return {
    edges: graph.edges,
    nodes: graph.nodes.map((n) => ({
      ...n,
      data: { ...n.data, position: positions.get(n.data.id) ?? { x: 0, y: 0 } },
    })) as WorkflowNode[],
  };
}

// ---------------------------------------------------------------------------
// Serialize (graph -> persisted blob)
// ---------------------------------------------------------------------------

export function serializeGraph(graph: WorkflowGraph): SerializedGraph {
  return {
    edges: graph.edges,
    nodes: graph.nodes.map((n): SerializedNode => {
      switch (n.kind) {
        case "trigger":
          return { id: n.data.id, kind: "trigger", position: n.data.position };
        case "action":
          return {
            id: n.data.id,
            kind: "action",
            actionType: n.data.type,
            config: n.data.config,
            sortOrder: n.data.sortOrder,
            position: n.data.position,
          };
        case "ifElse":
          return {
            id: n.data.id,
            kind: "ifElse",
            conditions: n.data.conditions.map((c) => ({
              field: c.field,
              operator: c.operator,
              value: c.value,
              logicGate: c.logicGate,
              sortOrder: c.sortOrder,
            })),
            position: n.data.position,
          };
        case "switch":
          return {
            id: n.data.id,
            kind: "switch",
            field: n.data.field,
            cases: n.data.cases,
            position: n.data.position,
          };
      }
    }),
  };
}

// ---------------------------------------------------------------------------
// Deserialize (automation -> graph). Restores from __graph blob if present;
// otherwise builds a linear graph from the legacy trigger/actions/conditions
// so older automations still open on the canvas.
// ---------------------------------------------------------------------------

export function deserializeGraph(initial?: AutomationData | null): WorkflowGraph {
  if (!initial || !initial.trigger) {
    return { nodes: [], edges: [] };
  }

  const blob = (initial.trigger.config as Record<string, unknown> | undefined)?.[
    GRAPH_CONFIG_KEY
  ] as SerializedGraph | undefined;

  if (blob && Array.isArray(blob.nodes) && blob.nodes.length > 0) {
    return graphFromSerialized(blob, initial);
  }

  return legacyLinearGraph(initial);
}

function graphFromSerialized(
  blob: SerializedGraph,
  initial: AutomationData,
): WorkflowGraph {
  const triggerType = initial.trigger!.type;
  const triggerConfig = stripGraph(initial.trigger!.config ?? {});

  const nodes: WorkflowNode[] = blob.nodes.map((s): WorkflowNode => {
    switch (s.kind) {
      case "trigger":
        return {
          kind: "trigger",
          data: {
            id: s.id,
            type: triggerType,
            config: triggerConfig,
            position: s.position,
          },
        };
      case "action":
        return {
          kind: "action",
          data: {
            id: s.id,
            type: s.actionType,
            config: s.config ?? {},
            sortOrder: s.sortOrder ?? 0,
            position: s.position,
          },
        };
      case "ifElse":
        return {
          kind: "ifElse",
          data: {
            id: s.id,
            conditions: (s.conditions ?? []).map((c) => ({ id: uid(), ...c })),
            position: s.position,
          },
        };
      case "switch":
        return {
          kind: "switch",
          data: {
            id: s.id,
            field: s.field ?? "",
            cases: s.cases ?? [],
            position: s.position,
          },
        };
    }
  });

  return { nodes, edges: blob.edges ?? [] };
}

function legacyLinearGraph(initial: AutomationData): WorkflowGraph {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  const trigger: TriggerNodeData = {
    id: initial.trigger!.id,
    type: initial.trigger!.type,
    config: stripGraph(initial.trigger!.config ?? {}),
  };
  nodes.push({ kind: "trigger", data: trigger });

  let prevId = trigger.id;
  let prevHandle = "out";

  // Legacy automation-level conditions become a single IF node; the true
  // branch runs the linear actions (the historical behaviour).
  const legacyConditions = initial.conditions ?? [];
  if (legacyConditions.length > 0) {
    const ifNode: IfElseNodeData = {
      id: uid(),
      conditions: legacyConditions.map((c, i) => ({
        id: c.id ?? uid(),
        field: c.field,
        operator: c.operator,
        value: c.value ?? "",
        logicGate: c.logicGate,
        sortOrder: c.sortOrder ?? i,
      })),
    };
    nodes.push({ kind: "ifElse", data: ifNode });
    edges.push({ id: uid(), source: prevId, sourceHandle: "out", target: ifNode.id });
    prevId = ifNode.id;
    prevHandle = "true";
  }

  const sortedActions = [...initial.actions].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  sortedActions.forEach((a, idx) => {
    const action: ActionNodeData = {
      id: a.id,
      type: a.type,
      config: a.config ?? {},
      sortOrder: idx,
    };
    nodes.push({ kind: "action", data: action });
    edges.push({
      id: uid(),
      source: prevId,
      sourceHandle: prevHandle,
      target: action.id,
    });
    prevId = action.id;
    prevHandle = "out";
  });

  return autoLayout({ nodes, edges });
}

// ---------------------------------------------------------------------------
// Save payload — derive the flat actions[]/conditions[] (back-compat) plus the
// serialized graph stored inside trigger.config.
// ---------------------------------------------------------------------------

export type SavePayload = {
  trigger?: {
    type: AutomationTriggerType;
    config: Record<string, unknown>;
  };
  actions: Array<{
    type: AutomationActionType;
    config: Record<string, unknown>;
    sortOrder: number;
  }>;
  conditions: Array<{
    field: string;
    operator: ConditionOperator;
    value?: string;
    logicGate: ConditionLogicGate;
    sortOrder: number;
  }>;
};

export function graphToSavePayload(graph: WorkflowGraph): SavePayload {
  const triggerNode = getTriggerNode(graph);

  // Flat actions in traversal order (for list views / legacy fallback).
  const actionNodes = orderActionsByTraversal(graph);
  const actions = actionNodes.map((a, i) => ({
    type: a.type,
    config: a.config,
    sortOrder: i,
  }));

  // Best-effort legacy conditions = first IF node's conditions (exec uses graph).
  const firstIf = graph.nodes.find((n) => n.kind === "ifElse") as
    | { kind: "ifElse"; data: IfElseNodeData }
    | undefined;
  const conditions = (firstIf?.data.conditions ?? [])
    .filter((c) => c.field.trim().length > 0)
    .map((c, i) => ({
      field: c.field,
      operator: c.operator,
      value: c.value || undefined,
      logicGate: c.logicGate,
      sortOrder: i,
    }));

  const trigger = triggerNode
    ? {
        type: (triggerNode.data as TriggerNodeData).type,
        config: {
          ...stripGraph((triggerNode.data as TriggerNodeData).config),
          [GRAPH_CONFIG_KEY]: serializeGraph(graph),
        },
      }
    : undefined;

  return { trigger, actions, conditions };
}

function orderActionsByTraversal(graph: WorkflowGraph): ActionNodeData[] {
  const trigger = getTriggerNode(graph);
  const out: ActionNodeData[] = [];
  const seen = new Set<string>();
  if (!trigger) return out;

  const stack = [trigger.data.id];
  while (stack.length) {
    const id = stack.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = graph.nodes.find((n) => n.data.id === id);
    if (node?.kind === "action") out.push(node.data);
    for (const child of orderedChildren(graph, id)) stack.push(child);
  }
  return out;
}

// ---------------------------------------------------------------------------

/** Remove the persisted graph blob from a trigger config object. */
export function stripGraph(
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (!config || typeof config !== "object") return {};
  const { [GRAPH_CONFIG_KEY]: _omit, ...rest } = config;
  return rest;
}

// ---------------------------------------------------------------------------
// Factory helpers for new nodes
// ---------------------------------------------------------------------------

export function newSwitchCase(index: number): SwitchCase {
  return {
    id: uid(),
    label: `Case ${index + 1}`,
    operator: "EQUALS",
    value: "",
  };
}

export function makeNode(
  kind: WorkflowNode["kind"],
  type: string,
  position: { x: number; y: number },
): WorkflowNode {
  const id = uid();
  switch (kind) {
    case "trigger":
      return {
        kind,
        data: { id, type: type as AutomationTriggerType, config: {}, position },
      };
    case "action":
      return {
        kind,
        data: {
          id,
          type: type as AutomationActionType,
          config: {},
          sortOrder: 0,
          position,
        },
      };
    case "ifElse":
      return { kind, data: { id, conditions: [], position } };
    case "switch":
      return {
        kind,
        data: { id, field: "", cases: [newSwitchCase(0), newSwitchCase(1)], position },
      };
  }
}
