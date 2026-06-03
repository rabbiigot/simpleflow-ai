import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textArea";
import type {
  AutomationActionType,
  AutomationData,
  AutomationTriggerType,
  ConditionLogicGate,
  ConditionOperator,
} from "@/lib/backend-api";
import { Save } from "lucide-react";
import { useCallback, useState } from "react";
import ActionConfigPanel from "./ActionConfigPanel";
import NodePalette from "./NodePalette";
import TriggerConfigPanel from "./TriggerConfigPanel";
import type {
  ActionNodeData,
  ConditionNodeData,
  PaletteItem,
  SelectedNode,
  TriggerNodeData,
  WorkflowState,
} from "./types";
import WorkflowCanvas from "./WorkflowCanvas";

type WorkflowBuilderProps = {
  /** If editing an existing automation, pass it here. */
  initial?: AutomationData | null;
  /** Called on save with the workflow data for the parent to persist. */
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

function uid() {
  return crypto.randomUUID();
}

function buildInitialState(initial?: AutomationData | null): {
  name: string;
  description: string;
  workflow: WorkflowState;
} {
  if (!initial) {
    return { name: "", description: "", workflow: { trigger: null, actions: [], conditions: [] } };
  }
  return {
    name: initial.name,
    description: initial.description ?? "",
    workflow: {
      trigger: initial.trigger
        ? {
            id: initial.trigger.id,
            type: initial.trigger.type,
            config: initial.trigger.config ?? {},
          }
        : null,
      actions: initial.actions.map((a) => ({
        id: a.id,
        type: a.type,
        config: a.config ?? {},
        sortOrder: a.sortOrder,
      })),
      conditions: (initial.conditions ?? []).map((c) => ({
        id: c.id ?? uid(),
        field: c.field,
        operator: c.operator,
        value: c.value ?? "",
        logicGate: c.logicGate,
        sortOrder: c.sortOrder,
      })),
    },
  };
}

export default function WorkflowBuilder({
  initial,
  onSave,
  saving,
}: WorkflowBuilderProps) {
  const init = buildInitialState(initial);
  const [name, setName] = useState(init.name);
  const [description, setDescription] = useState(init.description);
  const [workflow, setWorkflow] = useState<WorkflowState>(init.workflow);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  // ---- Palette handlers ----

  const handleAddTrigger = useCallback((item: PaletteItem) => {
    const newTrigger: TriggerNodeData = {
      id: uid(),
      type: item.type as AutomationTriggerType,
      config: {},
    };
    setWorkflow((prev) => ({ ...prev, trigger: newTrigger }));
    setSelectedNode({ kind: "trigger", id: newTrigger.id });
  }, []);

  const handleAddAction = useCallback((item: PaletteItem) => {
    setWorkflow((prev) => {
      const newAction: ActionNodeData = {
        id: uid(),
        type: item.type as AutomationActionType,
        config: {},
        sortOrder: prev.actions.length,
      };
      return { ...prev, actions: [...prev.actions, newAction] };
    });
  }, []);

  // ---- Canvas handlers ----

  const handleRemoveTrigger = useCallback(() => {
    setWorkflow((prev) => ({ ...prev, trigger: null }));
    setSelectedNode(null);
  }, []);

  const handleRemoveAction = useCallback(
    (id: string) => {
      setWorkflow((prev) => ({
        ...prev,
        actions: prev.actions
          .filter((a) => a.id !== id)
          .map((a, i) => ({ ...a, sortOrder: i })),
      }));
      if (selectedNode?.kind === "action" && selectedNode.id === id) {
        setSelectedNode(null);
      }
    },
    [selectedNode],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInsertActionAt = useCallback((_index: number) => {
    // When clicking the "+" button, we show the palette for the user to pick
    // For simplicity, no-op: clicking a palette action already appends it.
  }, []);

  // ---- Config panel handlers ----

  const handleTriggerConfigChange = useCallback(
    (updated: TriggerNodeData) => {
      setWorkflow((prev) => ({ ...prev, trigger: updated }));
    },
    [],
  );

  const handleActionConfigChange = useCallback(
    (updated: ActionNodeData) => {
      setWorkflow((prev) => ({
        ...prev,
        actions: prev.actions.map((a) => (a.id === updated.id ? updated : a)),
      }));
    },
    [],
  );

  // ---- Find selected node data ----

  const selectedTrigger =
    selectedNode?.kind === "trigger" && workflow.trigger?.id === selectedNode.id
      ? workflow.trigger
      : null;

  const selectedAction =
    selectedNode?.kind === "action"
      ? workflow.actions.find((a) => a.id === selectedNode.id) ?? null
      : null;

  // ---- Save handler ----

  // ---- Condition handlers ----

  const handleAddCondition = useCallback(() => {
    const newCondition: ConditionNodeData = {
      id: uid(),
      field: "",
      operator: "EQUALS" as ConditionOperator,
      value: "",
      logicGate: "AND" as ConditionLogicGate,
      sortOrder: workflow.conditions.length,
    };
    setWorkflow((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCondition],
    }));
  }, [workflow.conditions.length]);

  const handleUpdateCondition = useCallback((updated: ConditionNodeData) => {
    setWorkflow((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) =>
        c.id === updated.id ? updated : c,
      ),
    }));
  }, []);

  const handleRemoveCondition = useCallback((id: string) => {
    setWorkflow((prev) => ({
      ...prev,
      conditions: prev.conditions
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, sortOrder: i })),
    }));
  }, []);

  function handleSave() {
    onSave({
      name: name.trim(),
      description: description.trim(),
      trigger: workflow.trigger
        ? { type: workflow.trigger.type, config: workflow.trigger.config }
        : undefined,
      actions: workflow.actions.map((a) => ({
        type: a.type,
        config: a.config,
        sortOrder: a.sortOrder,
      })),
      conditions: workflow.conditions.length > 0
        ? workflow.conditions.map((c) => ({
            field: c.field,
            operator: c.operator,
            value: c.value || undefined,
            logicGate: c.logicGate,
            sortOrder: c.sortOrder,
          }))
        : undefined,
    });
  }

  const canSave = name.trim().length > 0 && workflow.trigger !== null;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar: name, description, save */}
      <div className="flex flex-wrap items-end gap-4 border-b px-4 py-3">
        <div className="flex-1 min-w-[200px] space-y-1">
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
        <div className="flex-1 min-w-[200px] space-y-1">
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
          onClick={handleSave}
          disabled={!canSave || saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : initial ? "Update" : "Save"}
        </Button>
      </div>

      {/* 3-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: Node palette */}
        <aside className="w-56 shrink-0 border-r">
          <NodePalette
            workflow={workflow}
            onAddTrigger={handleAddTrigger}
            onAddAction={handleAddAction}
          />
        </aside>

        {/* Center panel: Canvas */}
        <main className="flex-1 min-w-0 bg-muted/30">
          <WorkflowCanvas
            workflow={workflow}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onRemoveTrigger={handleRemoveTrigger}
            onRemoveAction={handleRemoveAction}
            onInsertActionAt={handleInsertActionAt}
          />
        </main>

        {/* Right panel: Config */}
        <aside className="w-72 shrink-0 border-l overflow-hidden">
          <ScrollArea className="h-full max-h-full">
            {selectedTrigger && (
              <TriggerConfigPanel
                node={selectedTrigger}
                onChange={handleTriggerConfigChange}
                conditions={workflow.conditions}
                onAddCondition={handleAddCondition}
                onUpdateCondition={handleUpdateCondition}
                onRemoveCondition={handleRemoveCondition}
              />
            )}
            {selectedAction && (
              <ActionConfigPanel
                node={selectedAction}
                trigger={workflow.trigger}
                onChange={handleActionConfigChange}
              />
            )}
            {!selectedTrigger && !selectedAction && (
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
