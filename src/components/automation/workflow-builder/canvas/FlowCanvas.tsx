import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LayoutGrid } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useIsDark } from "@/hooks/use-is-dark";
import type { PaletteItem, SelectedNode, WorkflowGraph, XY } from "../types";
import { nodeTypes, type RunStatus, type WfNodeData } from "./CustomNodes";
import { edgeTypes, type InsertEdgeData } from "./InsertEdge";

export const PALETTE_DND_MIME = "application/simpleflow-node";

type FlowCanvasProps = {
  graph: WorkflowGraph;
  selectedId: string | null;
  invalidIds: Set<string>;
  /** Live per-node state during a test run (running/success/failed). */
  runState?: Map<string, RunStatus>;
  onSelect: (sel: SelectedNode | null) => void;
  onMoveNode: (id: string, pos: XY) => void;
  onDeleteNode: (id: string) => void;
  onConnect: (c: { source: string; sourceHandle?: string; target: string }) => void;
  onInsertBetween: (edge: {
    id: string;
    source: string;
    sourceHandle?: string;
    target: string;
  }) => void;
  onDeleteEdge: (edgeId: string) => void;
  onReconnectEdge: (
    oldEdgeId: string,
    next: { source: string; sourceHandle?: string; target: string },
  ) => void;
  onDropNode: (item: PaletteItem, pos: XY) => void;
  onTidy: () => void;
};

function edgeLabelFor(graph: WorkflowGraph, edge: WorkflowGraph["edges"][number]): string | undefined {
  const src = graph.nodes.find((n) => n.data.id === edge.source);
  if (!src) return undefined;
  if (src.kind === "ifElse") return edge.sourceHandle === "false" ? "false" : "true";
  if (src.kind === "switch") {
    if (edge.sourceHandle === "default") return "default";
    const c = src.data.cases.find((cc) => cc.id === edge.sourceHandle);
    return c?.label;
  }
  return undefined;
}

function toRfNodes(
  graph: WorkflowGraph,
  selectedId: string | null,
  invalidIds: Set<string>,
  onDeleteNode: (id: string) => void,
  runState?: Map<string, RunStatus>,
): Node[] {
  return graph.nodes.map((n) => ({
    id: n.data.id,
    type: n.kind,
    position: n.data.position ?? { x: 0, y: 0 },
    selected: n.data.id === selectedId,
    data: {
      wf: n,
      invalid: invalidIds.has(n.data.id),
      runStatus: runState?.get(n.data.id),
      onDelete: onDeleteNode,
    } as WfNodeData as unknown as Record<string, unknown>,
  }));
}

function toRfEdges(
  graph: WorkflowGraph,
  onInsertBetween: FlowCanvasProps["onInsertBetween"],
  onDeleteEdge: FlowCanvasProps["onDeleteEdge"],
): Edge[] {
  return graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    type: "insert",
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    data: {
      label: edgeLabelFor(graph, e),
      onInsert: onInsertBetween,
      onDelete: onDeleteEdge,
    } as InsertEdgeData as unknown as Record<string, unknown>,
  }));
}

function InnerCanvas({
  graph,
  selectedId,
  invalidIds,
  runState,
  onSelect,
  onMoveNode,
  onDeleteNode,
  onConnect,
  onInsertBetween,
  onDeleteEdge,
  onReconnectEdge,
  onDropNode,
  onTidy,
}: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();
  const isDark = useIsDark();

  // Sync local RF state whenever the source graph (or selection/validity) changes.
  useEffect(() => {
    setNodes(toRfNodes(graph, selectedId, invalidIds, onDeleteNode, runState));
  }, [graph, selectedId, invalidIds, onDeleteNode, runState, setNodes]);

  useEffect(() => {
    setEdges(toRfEdges(graph, onInsertBetween, onDeleteEdge));
  }, [graph, onInsertBetween, onDeleteEdge, setEdges]);

  const handleConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      onConnect({
        source: c.source,
        sourceHandle: c.sourceHandle ?? undefined,
        target: c.target,
      });
    },
    [onConnect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(PALETTE_DND_MIME);
      if (!raw) return;
      let item: PaletteItem;
      try {
        item = JSON.parse(raw) as PaletteItem;
      } catch {
        return;
      }
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onDropNode(item, pos);
    },
    [onDropNode, screenToFlowPosition],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={handleConnect}
      onReconnect={(oldEdge, conn) =>
        onReconnectEdge(oldEdge.id, {
          source: conn.source,
          sourceHandle: conn.sourceHandle ?? undefined,
          target: conn.target,
        })
      }
      onNodeDragStop={(_, node) => onMoveNode(node.id, node.position)}
      onNodeClick={(_, node) =>
        onSelect({ kind: node.type as SelectedNode["kind"], id: node.id })
      }
      onPaneClick={() => onSelect(null)}
      onNodesDelete={(deleted) => deleted.forEach((n) => onDeleteNode(n.id))}
      onEdgesDelete={(deleted) => deleted.forEach((e) => onDeleteEdge(e.id))}
      edgesReconnectable
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      snapToGrid
      snapGrid={[20, 20]}
      fitView
      fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={1.75}
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={["Backspace", "Delete"]}
      colorMode={isDark ? "dark" : "light"}
      className="bg-muted/20"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.5}
        color={isDark ? "#3f3f46" : "#c7c9d1"}
      />
      {graph.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="rounded-xl border border-dashed bg-background/80 px-6 py-5 text-center shadow-sm backdrop-blur-sm">
            <p className="text-sm font-semibold">Build your workflow</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click a trigger on the left, or drag it onto the grid to start.
            </p>
          </div>
        </div>
      )}
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) =>
          n.type === "trigger"
            ? "#3b82f6"
            : n.type === "action"
              ? "#22c55e"
              : n.type === "ifElse"
                ? "#f59e0b"
                : "#8b5cf6"
        }
        maskColor={isDark ? "rgba(0,0,0,0.45)" : "rgba(240,240,245,0.6)"}
        className="!bg-background"
      />
      <Panel position="top-right">
        <button
          type="button"
          onClick={onTidy}
          className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium shadow-sm hover:bg-muted"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Tidy up
        </button>
      </Panel>
    </ReactFlow>
  );
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerCanvas {...props} />
    </ReactFlowProvider>
  );
}
