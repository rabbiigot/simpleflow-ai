import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Zap } from "lucide-react";
import { NODE_ICONS, NODE_LABELS } from "./constants";
import type { ActionNodeData, SelectedNode, TriggerNodeData, WorkflowState } from "./types";

type WorkflowCanvasProps = {
  workflow: WorkflowState;
  selectedNode: SelectedNode | null;
  onSelectNode: (node: SelectedNode | null) => void;
  onRemoveTrigger: () => void;
  onRemoveAction: (id: string) => void;
  onInsertActionAt: (index: number) => void;
};

// ---------------------------------------------------------------------------
// SVG connector line between nodes
// ---------------------------------------------------------------------------
function Connector() {
  return (
    <div className="flex justify-center">
      <svg width="2" height="20" className="text-muted-foreground/40">
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="20"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual Trigger Node
// ---------------------------------------------------------------------------
function TriggerNode({
  node,
  isSelected,
  onSelect,
  onRemove,
}: {
  node: TriggerNodeData;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const Icon = NODE_ICONS[node.type];
  const label = NODE_LABELS[node.type];
  const configSummary = summarizeTriggerConfig(node);

  return (
    <Card
      className={`cursor-pointer transition-all w-56 ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "hover:border-blue-500/50"
      }`}
      onClick={onSelect}
    >
      <CardContent className="flex items-center gap-2 px-2.5 py-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
          <Icon className="h-3.5 w-3.5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-wider text-blue-500 leading-tight">
            Trigger
          </p>
          <p className="text-xs font-semibold truncate">{label}</p>
          {configSummary && (
            <p className="text-[10px] text-muted-foreground truncate">
              {configSummary}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Individual Action Node
// ---------------------------------------------------------------------------
function ActionNode({
  node,
  isSelected,
  onSelect,
  onRemove,
}: {
  node: ActionNodeData;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const Icon = NODE_ICONS[node.type];
  const label = NODE_LABELS[node.type];
  const configSummary = summarizeActionConfig(node);

  return (
    <Card
      className={`cursor-pointer transition-all w-56 ${
        isSelected
          ? "border-green-500 ring-2 ring-green-500/20"
          : "hover:border-green-500/50"
      }`}
      onClick={onSelect}
    >
      <CardContent className="flex items-center gap-2 px-2.5 py-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green-500/10">
          <Icon className="h-3.5 w-3.5 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-wider text-green-500 leading-tight">
            Action #{node.sortOrder + 1}
          </p>
          <p className="text-xs font-semibold truncate">{label}</p>
          {configSummary && (
            <p className="text-[10px] text-muted-foreground truncate">
              {configSummary}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add-action button
// ---------------------------------------------------------------------------
function AddActionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <Plus className="h-3.5 w-3.5" />
      Add Action
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Main Canvas
// ---------------------------------------------------------------------------
export default function WorkflowCanvas({
  workflow,
  selectedNode,
  onSelectNode,
  onRemoveTrigger,
  onRemoveAction,
  onInsertActionAt,
}: WorkflowCanvasProps) {
  const { trigger, actions } = workflow;

  if (!trigger && actions.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Zap className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-semibold">Build Your Workflow</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Click a trigger from the left panel to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto py-8">
      <div className="flex flex-col items-center gap-0">
        {/* Trigger node */}
        {trigger && (
          <>
            <TriggerNode
              node={trigger}
              isSelected={
                selectedNode?.kind === "trigger" &&
                selectedNode.id === trigger.id
              }
              onSelect={() =>
                onSelectNode({ kind: "trigger", id: trigger.id })
              }
              onRemove={onRemoveTrigger}
            />
            {actions.length > 0 && <Connector />}
          </>
        )}

        {/* Action nodes */}
        {actions.map((action, idx) => (
          <div key={action.id} className="flex flex-col items-center">
            <ActionNode
              node={action}
              isSelected={
                selectedNode?.kind === "action" &&
                selectedNode.id === action.id
              }
              onSelect={() =>
                onSelectNode({ kind: "action", id: action.id })
              }
              onRemove={() => onRemoveAction(action.id)}
            />
            {idx < actions.length - 1 && <Connector />}
          </div>
        ))}

        {/* Add action button at bottom */}
        {trigger && (
          <>
            <Connector />
            <AddActionButton
              onClick={() => onInsertActionAt(actions.length)}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config summary helpers
// ---------------------------------------------------------------------------

function summarizeTriggerConfig(node: TriggerNodeData): string {
  const ws = node.config?.workspaceName as string | undefined;
  if (ws) return `Workspace: ${ws}`;
  return "";
}

function summarizeActionConfig(node: ActionNodeData): string {
  switch (node.type) {
    case "SEND_EMAIL": {
      const to = node.config?.to as string | undefined;
      return to ? `To: ${to}` : "";
    }
    case "CREATE_POST": {
      const content = node.config?.content as string | undefined;
      return content ? content.slice(0, 40) + (content.length > 40 ? "..." : "") : "";
    }
    case "CREATE_TASK": {
      const title = node.config?.taskTitle as string | undefined;
      return title ? `Task: ${title}` : "";
    }
    case "MOVE_TASK": {
      const col = node.config?.targetColumn as string | undefined;
      return col ? `To column: ${col}` : "";
    }
    default:
      return "";
  }
}
