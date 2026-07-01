import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listWorkspaces, type Workspace } from "@/lib/backend-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CRON_PRESETS, NODE_ICONS, NODE_LABELS } from "./constants";
import type { TriggerNodeData } from "./types";

type TriggerConfigPanelProps = {
  node: TriggerNodeData;
  onChange: (updated: TriggerNodeData) => void;
};

export default function TriggerConfigPanel({
  node,
  onChange,
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

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-xs text-muted-foreground">
          Need to branch on field values? Drag an{" "}
          <span className="font-semibold text-amber-600">IF / ELSE</span> or{" "}
          <span className="font-semibold text-violet-600">Switch</span> block
          onto the canvas from the Logic section.
        </p>
      </div>
    </div>
  );
}
