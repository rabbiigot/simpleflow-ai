import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textArea";
import {
  testRunAutomation,
  type AutomationActionType,
  type AutomationData,
  type AutomationTriggerType,
  type ConditionLogicGate,
  type ConditionOperator,
} from "@/lib/backend-api";
import { Loader2, Play, Save } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import ActionConfigPanel from "./ActionConfigPanel";
import FlowCanvas from "./canvas/FlowCanvas";
import type { RunStatus } from "./canvas/CustomNodes";
import {
  autoLayout,
  COL_GAP,
  deserializeGraph,
  getTriggerNode,
  graphToSavePayload,
  makeNode,
  outputHandles,
  uid,
} from "./graph";
import IfElseConfigPanel from "./IfElseConfigPanel";
import NodePalette from "./NodePalette";
import SwitchConfigPanel from "./SwitchConfigPanel";
import TriggerConfigPanel from "./TriggerConfigPanel";
import type {
  ActionNodeData,
  IfElseNodeData,
  PaletteItem,
  SelectedNode,
  SwitchNodeData,
  TriggerNodeData,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  XY,
} from "./types";
import { toast } from "sonner";

type WorkflowBuilderProps = {
  initial?: AutomationData | null;
  onSave: (data: {
    name: string;
    description: string;
    trigger?: { type: AutomationTriggerType; config?: Record<string, unknown> };
    actions: Array<{
      type: AutomationActionType;
      config?: Record<string, unknown>;
      sortOrder: number;
    }>;
    conditions?: Array<{
      field: string;
      operator: ConditionOperator;
      value?: string;
      logicGate?: ConditionLogicGate;
      sortOrder?: number;
    }>;
  }) => void;
  saving?: boolean;
};

export default function WorkflowBuilder({
  initial,
  onSave,
  saving,
}: WorkflowBuilderProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [graph, setGraph] = useState<WorkflowGraph>(() =>
    deserializeGraph(initial),
  );
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  // When set, the next palette pick is inserted into this edge instead of appended.
  const [insertEdge, setInsertEdge] = useState<WorkflowEdge | null>(null);
  // Test run: live per-node state while the trace replays across the canvas.
  const [testing, setTesting] = useState(false);
  const [runState, setRunState] = useState<Map<string, RunStatus>>(new Map());

  const triggerNode = getTriggerNode(graph);
  const hasTrigger = !!triggerNode;

  // ---- Graph helpers ----------------------------------------------------

  const updateNodeData = useCallback(
    (id: string, patch: Partial<WorkflowNode["data"]>) => {
      setGraph((g) => ({
        ...g,
        nodes: g.nodes.map((n) =>
          n.data.id === id
            ? ({ ...n, data: { ...n.data, ...patch } } as WorkflowNode)
            : n,
        ),
      }));
    },
    [],
  );

  /** Find the open end of the main path (first output handle that has no edge). */
  const findTail = useCallback(
    (g: WorkflowGraph): { node: WorkflowNode; handle: string } | null => {
      const trigger = getTriggerNode(g);
      if (!trigger) return null;
      let cur: WorkflowNode = trigger;
      const visited = new Set<string>();
      while (!visited.has(cur.data.id)) {
        visited.add(cur.data.id);
        const handle = outputHandles(cur)[0];
        const edge = g.edges.find(
          (e) => e.source === cur.data.id && e.sourceHandle === handle,
        );
        if (!edge) return { node: cur, handle };
        const next = g.nodes.find((n) => n.data.id === edge.target);
        if (!next) return { node: cur, handle };
        cur = next;
      }
      return { node: cur, handle: outputHandles(cur)[0] };
    },
    [],
  );

  // ---- Add node (palette click or drop) ---------------------------------

  const addNode = useCallback(
    (item: PaletteItem, position?: XY) => {
      if (item.kind === "trigger") {
        if (hasTrigger) {
          toast.info("Only one trigger is allowed per automation.");
          return;
        }
        const node = makeNode("trigger", item.type, position ?? { x: 0, y: 0 });
        setGraph((g) => ({ ...g, nodes: [...g.nodes, node] }));
        setSelectedNode({ kind: "trigger", id: node.data.id });
        return;
      }

      if (!hasTrigger) {
        toast.info("Add a trigger first.");
        return;
      }

      setGraph((g) => {
        const tail = findTail(g);
        const pos =
          position ??
          (tail?.node.data.position
            ? { x: tail.node.data.position.x + COL_GAP, y: tail.node.data.position.y }
            : { x: COL_GAP, y: 0 });
        const node = makeNode(item.kind, item.type, pos);

        // Insert mode: split the targeted edge.
        if (insertEdge) {
          const edges = g.edges.filter((e) => e.id !== insertEdge.id);
          edges.push({
            id: uid(),
            source: insertEdge.source,
            sourceHandle: insertEdge.sourceHandle,
            target: node.data.id,
          });
          edges.push({
            id: uid(),
            source: node.data.id,
            sourceHandle: outputHandles(node)[0],
            target: insertEdge.target,
          });
          setSelectedNode({ kind: item.kind, id: node.data.id });
          return { nodes: [...g.nodes, node], edges };
        }

        // Append to the open tail of the main path (when there is one).
        const edges = [...g.edges];
        if (!position && tail) {
          edges.push({
            id: uid(),
            source: tail.node.data.id,
            sourceHandle: tail.handle,
            target: node.data.id,
          });
        }
        setSelectedNode({ kind: item.kind, id: node.data.id });
        return { nodes: [...g.nodes, node], edges };
      });
      setInsertEdge(null);
    },
    [hasTrigger, insertEdge, findTail],
  );

  // ---- Canvas callbacks -------------------------------------------------

  const handleConnect = useCallback(
    (c: { source: string; sourceHandle?: string; target: string }) => {
      if (c.source === c.target) return;
      setGraph((g) => {
        // Fan-out is allowed: a single handle may connect to many targets.
        // Only block an exact duplicate edge (same source handle → same target).
        const handle = c.sourceHandle ?? "out";
        const exists = g.edges.some(
          (e) =>
            e.source === c.source &&
            (e.sourceHandle ?? "out") === handle &&
            e.target === c.target,
        );
        if (exists) return g;
        return {
          ...g,
          edges: [
            ...g.edges,
            { id: uid(), source: c.source, sourceHandle: c.sourceHandle, target: c.target },
          ],
        };
      });
    },
    [],
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      setGraph((g) => ({
        nodes: g.nodes.filter((n) => n.data.id !== id),
        edges: g.edges.filter((e) => e.source !== id && e.target !== id),
      }));
      setSelectedNode((s) => (s?.id === id ? null : s));
    },
    [],
  );

  const handleMoveNode = useCallback(
    (id: string, pos: XY) => updateNodeData(id, { position: pos }),
    [updateNodeData],
  );

  const handleInsertBetween = useCallback((edge: WorkflowEdge) => {
    setInsertEdge(edge);
    toast.info("Pick a node from the palette to insert it here.");
  }, []);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setGraph((g) => ({ ...g, edges: g.edges.filter((e) => e.id !== edgeId) }));
  }, []);

  const handleReconnectEdge = useCallback(
    (
      oldEdgeId: string,
      next: { source: string; sourceHandle?: string; target: string },
    ) => {
      if (next.source === next.target) return;
      setGraph((g) => {
        const handle = next.sourceHandle ?? "out";
        const edges = g.edges.filter((e) => e.id !== oldEdgeId);
        const dup = edges.some(
          (e) =>
            e.source === next.source &&
            (e.sourceHandle ?? "out") === handle &&
            e.target === next.target,
        );
        if (!dup) {
          edges.push({
            id: uid(),
            source: next.source,
            sourceHandle: next.sourceHandle,
            target: next.target,
          });
        }
        return { ...g, edges };
      });
    },
    [],
  );

  const handleTidy = useCallback(() => setGraph((g) => autoLayout(g)), []);

  // ---- Test run ---------------------------------------------------------
  // Dry-runs the current (unsaved) graph, then replays the returned trace
  // block-by-block: each node lights up "running", then turns success/failed.

  const handleTestRun = useCallback(async () => {
    if (testing) return;
    if (!hasTrigger) {
      toast.info("Add a trigger first.");
      return;
    }
    const payload = graphToSavePayload(graph);
    if (!payload.trigger) {
      toast.info("Add a trigger first.");
      return;
    }
    if (payload.actions.length === 0) {
      toast.info("Add at least one action to test.");
      return;
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    setTesting(true);
    setRunState(new Map());
    try {
      const result = await testRunAutomation({
        trigger: payload.trigger,
        actions: payload.actions,
        conditions:
          payload.conditions.length > 0 ? payload.conditions : undefined,
        payload: {},
      });

      // Replay each executed block in order.
      for (const step of result.steps) {
        setRunState((prev) => new Map(prev).set(step.nodeId, "running"));
        await sleep(650);
        setRunState((prev) =>
          new Map(prev).set(
            step.nodeId,
            step.status === "failed" ? "failed" : "success",
          ),
        );
        if (step.status === "failed") break;
        await sleep(140);
      }

      if (result.success) {
        toast.success(result.message || "Test run completed successfully.");
      } else {
        toast.error(result.error || result.message || "Test run failed.");
      }

      // Return the canvas to its normal look after a beat.
      window.setTimeout(() => setRunState(new Map()), 2600);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to run test.");
      setRunState(new Map());
    } finally {
      setTesting(false);
    }
  }, [graph, hasTrigger, testing]);

  // ---- Validation (red rings) ------------------------------------------

  const invalidIds = useMemo(() => {
    const set = new Set<string>();
    const hasIncoming = (id: string) => graph.edges.some((e) => e.target === id);
    for (const n of graph.nodes) {
      if (n.kind === "trigger") continue;
      if (!hasIncoming(n.data.id)) set.add(n.data.id);
      if (n.kind === "switch" && !n.data.field.trim()) set.add(n.data.id);
      if (n.kind === "action" && !isActionConfigured(n.data)) set.add(n.data.id);
    }
    return set;
  }, [graph]);

  // ---- Selected node lookups -------------------------------------------

  const selected = selectedNode
    ? graph.nodes.find((n) => n.data.id === selectedNode.id)
    : undefined;

  // ---- Save -------------------------------------------------------------

  const canSave = name.trim().length > 0 && hasTrigger;

  function handleSave() {
    const payload = graphToSavePayload(graph);
    onSave({
      name: name.trim(),
      description: description.trim(),
      trigger: payload.trigger,
      actions: payload.actions,
      conditions: payload.conditions.length > 0 ? payload.conditions : undefined,
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-end gap-3 border-b px-3 py-3 md:gap-4 md:px-4">
        <div className="flex-1 min-w-full md:min-w-[200px] space-y-1">
          <Label htmlFor="automation-name" className="text-xs">
            Name
          </Label>
          <Input
            id="automation-name"
            placeholder="My Automation"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-full md:min-w-[200px] space-y-1">
          <Label htmlFor="automation-desc" className="text-xs">
            Description
          </Label>
          <Textarea
            id="automation-desc"
            placeholder="Optional description..."
            rows={1}
            className="min-h-9 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleTestRun}
          disabled={!hasTrigger || testing || saving}
          className="gap-2 w-full md:w-auto"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {testing ? "Testing..." : "Test run"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave || saving || testing}
          className="gap-2 w-full md:w-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : initial ? "Update" : "Save"}
        </Button>
      </div>

      {/* 3-panel layout */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Palette */}
        <aside className="w-full shrink-0 border-b md:w-56 md:border-b-0 md:border-r">
          <NodePalette
            hasTrigger={hasTrigger}
            insertMode={!!insertEdge}
            onCancelInsert={() => setInsertEdge(null)}
            onAdd={(item) => addNode(item)}
          />
        </aside>

        {/* Canvas */}
        <main className="min-h-[420px] flex-1 min-w-0">
          <FlowCanvas
            graph={graph}
            selectedId={selectedNode?.id ?? null}
            invalidIds={invalidIds}
            runState={runState}
            onSelect={setSelectedNode}
            onMoveNode={handleMoveNode}
            onDeleteNode={handleDeleteNode}
            onConnect={handleConnect}
            onInsertBetween={handleInsertBetween}
            onDeleteEdge={handleDeleteEdge}
            onReconnectEdge={handleReconnectEdge}
            onDropNode={(item, pos) => addNode(item, pos)}
            onTidy={handleTidy}
          />
        </main>

        {/* Config */}
        <aside className="w-full shrink-0 border-t md:w-72 md:border-t-0 md:border-l overflow-hidden">
          <ScrollArea className="h-full max-h-full">
            {selected?.kind === "trigger" && (
              <TriggerConfigPanel
                node={selected.data as TriggerNodeData}
                onChange={(u) => updateNodeData(u.id, u)}
              />
            )}
            {selected?.kind === "action" && (
              <ActionConfigPanel
                node={selected.data as ActionNodeData}
                trigger={(triggerNode?.data as TriggerNodeData) ?? null}
                onChange={(u) => updateNodeData(u.id, u)}
              />
            )}
            {selected?.kind === "ifElse" && (
              <IfElseConfigPanel
                node={selected.data as IfElseNodeData}
                onChange={(u) => updateNodeData(u.id, u)}
              />
            )}
            {selected?.kind === "switch" && (
              <SwitchConfigPanel
                node={selected.data as SwitchNodeData}
                onChange={(u) => updateNodeData(u.id, u)}
              />
            )}
            {!selected && (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Select a node on the canvas to configure it.
                </p>
              </div>
            )}
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

function isActionConfigured(node: ActionNodeData): boolean {
  switch (node.type) {
    case "SEND_EMAIL":
      return !!(node.config?.to as string);
    case "CREATE_POST":
      return !!(node.config?.content as string);
    case "CREATE_TASK":
      return !!(node.config?.taskTitle as string) && !!(node.config?.workspaceId as string);
    case "MOVE_TASK":
      return !!(node.config?.targetColumn as string) && !!(node.config?.workspaceId as string);
    default:
      return true;
  }
}
