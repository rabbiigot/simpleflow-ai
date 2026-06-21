import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConditionLogicGate, ConditionOperator } from "@/lib/backend-api";
import { listWorkspaces, type Workspace } from "@/lib/backend-api";
import { Filter, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CONDITION_OPERATOR_LABELS, CRON_PRESETS, NODE_ICONS, NODE_LABELS } from "./constants";
import type { ConditionNodeData, TriggerNodeData } from "./types";

type TriggerConfigPanelProps = {
  node: TriggerNodeData;
  onChange: (updated: TriggerNodeData) => void;
  conditions: ConditionNodeData[];
  onAddCondition: () => void;
  onUpdateCondition: (updated: ConditionNodeData) => void;
  onRemoveCondition: (id: string) => void;
};

export default function TriggerConfigPanel({
  node,
  onChange,
  conditions,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
}: TriggerConfigPanelProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWs, setLoadingWs] = useState(false);

  const needsWorkspace =
    node.type === "TASK_COMPLETED" ||
    node.type === "TASK_MOVED" ||
    node.type === "TASK_CREATED" ||
    node.type === "TASK_UPDATED";

  useEffect(() => {
    if (!needsWorkspace) return;
    setLoadingWs(true);
    listWorkspaces()
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]))
      .finally(() => setLoadingWs(false));
  }, [needsWorkspace]);

  const Icon = NODE_ICONS[node.type];
  const label = NODE_LABELS[node.type];

  function updateConfig(key: string, value: unknown) {
    onChange({ ...node, config: { ...node.config, [key]: value } });
  }

  function updateConfigBatch(updates: Record<string, unknown>) {
    onChange({ ...node, config: { ...node.config, ...updates } });
  }

  return (
    <div className="space-y-6 p-3 md:p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <Icon className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-blue-500">
            Trigger
          </p>
          <p className="font-semibold">{label}</p>
        </div>
      </div>

      {/* Workspace selector for task-based triggers */}
      {needsWorkspace && (
        <div className="space-y-2">
          <Label>Workspace</Label>
          {loadingWs ? (
            <div className="flex items-center gap-2 py-1">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading workspaces...</span>
            </div>
          ) : (
            <Select
              value={(node.config?.workspaceId as string) ?? ""}
              onValueChange={(val) => {
                const ws = workspaces.find((w) => w.id === val);
                updateConfigBatch({ workspaceId: val, workspaceName: ws?.name ?? "" });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* POST_CREATED has no extra config beyond trigger type */}
      {node.type === "POST_CREATED" && (
        <p className="text-sm text-muted-foreground">
          This trigger fires whenever a new social post is created. No
          additional configuration needed.
        </p>
      )}

      {/* CRON trigger config */}
      {node.type === "CRON" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cron Expression</Label>
            <input
              type="text"
              placeholder="0 9 * * MON"
              value={(node.config?.cronExpression as string) ?? ""}
              onChange={(e) => updateConfig("cronExpression", e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="text-xs text-muted-foreground">
              Format: minute hour day-of-month month day-of-week
            </p>
          </div>

          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="flex flex-wrap gap-1.5">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.expression}
                  type="button"
                  onClick={() => updateConfig("cronExpression", preset.expression)}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Timezone (optional)</Label>
            <select
              value={(node.config?.timezone as string) ?? ""}
              onChange={(e) => updateConfig("timezone", e.target.value || undefined)}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Server default</option>
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Conditions (If/Else) — always shown inside trigger config */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">Conditions</span>
          </div>
          <button
            type="button"
            onClick={onAddCondition}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        {conditions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No conditions. Add conditions to only run actions when specific
            field values match.
          </p>
        )}

        {conditions.map((cond, idx) => (
          <div
            key={cond.id}
            className="rounded-lg border border-amber-500/30 p-3 space-y-2 bg-amber-500/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600">
                {idx === 0 ? "IF" : cond.logicGate}
              </span>
              <button
                type="button"
                onClick={() => onRemoveCondition(cond.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {idx > 0 && (
              <select
                value={cond.logicGate}
                onChange={(e) =>
                  onUpdateCondition({
                    ...cond,
                    logicGate: e.target.value as ConditionLogicGate,
                  })
                }
                className="h-10 md:h-7 w-full rounded border border-border bg-background px-2 text-xs"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            )}

            <input
              type="text"
              placeholder="Field (e.g. customFieldValues.priority)"
              value={cond.field}
              onChange={(e) =>
                onUpdateCondition({ ...cond, field: e.target.value })
              }
              className="h-10 md:h-7 w-full rounded border border-border bg-background px-2 text-xs"
            />

            <select
              value={cond.operator}
              onChange={(e) =>
                onUpdateCondition({
                  ...cond,
                  operator: e.target.value as ConditionOperator,
                })
              }
              className="h-10 md:h-7 w-full rounded border border-border bg-background px-2 text-xs"
            >
              {(
                Object.entries(CONDITION_OPERATOR_LABELS) as Array<
                  [ConditionOperator, string]
                >
              ).map(([op, label]) => (
                <option key={op} value={op}>
                  {label}
                </option>
              ))}
            </select>

            {cond.operator !== "IS_EMPTY" &&
              cond.operator !== "IS_NOT_EMPTY" && (
                <input
                  type="text"
                  placeholder="Value"
                  value={cond.value}
                  onChange={(e) =>
                    onUpdateCondition({ ...cond, value: e.target.value })
                  }
                  className="h-10 md:h-7 w-full rounded border border-border bg-background px-2 text-xs"
                />
              )}
          </div>
        ))}
      </div>

    </div>
  );
}
