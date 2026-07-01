import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
} from "@xyflow/react";
import { Plus, X } from "lucide-react";

export type InsertEdgeData = {
  label?: string;
  onInsert?: (edge: { id: string; source: string; sourceHandle?: string; target: string }) => void;
  onDelete?: (edgeId: string) => void;
};

function InsertEdge({
  id,
  source,
  target,
  sourceHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const d = data as InsertEdgeData | undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={
          selected
            ? { stroke: "var(--color-primary, #6366f1)", strokeWidth: 2.5 }
            : undefined
        }
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute flex flex-col items-center gap-0.5"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {d?.label ? (
            <span className="rounded bg-background/90 px-1 text-[9px] font-medium text-muted-foreground shadow-sm">
              {d.label}
            </span>
          ) : null}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                d?.onInsert?.({ id, source, sourceHandle: sourceHandleId ?? undefined, target });
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full border bg-background text-muted-foreground opacity-60 shadow-sm transition hover:scale-110 hover:border-primary hover:text-primary hover:opacity-100"
              aria-label="Insert step"
            >
              <Plus className="h-3 w-3" />
            </button>
            {selected ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  d?.onDelete?.(id);
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-destructive/40 bg-background text-destructive shadow-sm transition hover:scale-110 hover:bg-destructive/10"
                aria-label="Delete connection"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const edgeTypes: EdgeTypes = { insert: InsertEdge };

export type FlowEdge = Edge<InsertEdgeData>;
