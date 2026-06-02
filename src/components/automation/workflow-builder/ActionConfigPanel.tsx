import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getChatChannels,
  getCurrentUserId,
  getWorkspaceById,
  listWorkspaces,
  type ChatChannel,
  type Workspace,
} from "@/lib/backend-api";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { NODE_ICONS, NODE_LABELS, TEMPLATE_VARIABLES } from "./constants";
import type { ActionNodeData, TriggerNodeData } from "./types";
import VariableInput from "./VariableInput";

type ActionConfigPanelProps = {
  node: ActionNodeData;
  trigger: TriggerNodeData | null;
  onChange: (updated: ActionNodeData) => void;
};

export default function ActionConfigPanel({
  node,
  trigger,
  onChange,
}: ActionConfigPanelProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWs, setLoadingWs] = useState(false);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [wsDetail, setWsDetail] = useState<Workspace | null>(null);
  const [loadingWsDetail, setLoadingWsDetail] = useState(false);

  const needsWorkspace =
    node.type === "CREATE_TASK" || node.type === "MOVE_TASK";
  const needsChannels = node.type === "CREATE_POST";

  useEffect(() => {
    if (!needsWorkspace) return;
    setLoadingWs(true);
    listWorkspaces()
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]))
      .finally(() => setLoadingWs(false));
  }, [needsWorkspace]);

  // Load workspace detail (columns + tasks) for MOVE_TASK when workspace is selected
  const moveTaskWsId = node.type === "MOVE_TASK" ? (node.config?.workspaceId as string) : null;
  useEffect(() => {
    if (!moveTaskWsId) { setWsDetail(null); return; }
    setLoadingWsDetail(true);
    getWorkspaceById(moveTaskWsId)
      .then(setWsDetail)
      .catch(() => setWsDetail(null))
      .finally(() => setLoadingWsDetail(false));
  }, [moveTaskWsId]);

  useEffect(() => {
    if (!needsChannels) return;
    const userId = getCurrentUserId();
    if (!userId) return;
    setLoadingChannels(true);
    getChatChannels(userId)
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setLoadingChannels(false));
  }, [needsChannels]);

  const Icon = NODE_ICONS[node.type];
  const label = NODE_LABELS[node.type];
  const variables = trigger ? (TEMPLATE_VARIABLES[trigger.type] ?? []) : [];

  function updateConfig(key: string, value: unknown) {
    onChange({ ...node, config: { ...node.config, [key]: value } });
  }

  function updateConfigBatch(updates: Record<string, unknown>) {
    onChange({ ...node, config: { ...node.config, ...updates } });
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
          <Icon className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-green-500">
            Action #{node.sortOrder + 1}
          </p>
          <p className="font-semibold">{label}</p>
        </div>
      </div>

      {/* SEND_EMAIL config */}
      {node.type === "SEND_EMAIL" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">To Email</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="recipient@example.com"
              value={(node.config?.to as string) ?? ""}
              onChange={(e) => updateConfig("to", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <VariableInput
              id="email-subject"
              placeholder="e.g. Task completed"
              value={(node.config?.subject as string) ?? ""}
              onChange={(val) => updateConfig("subject", val)}
              variables={variables}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-body">Body</Label>
            <VariableInput
              id="email-body"
              placeholder="Write your email body here..."
              multiline
              rows={4}
              value={(node.config?.body as string) ?? ""}
              onChange={(val) => updateConfig("body", val)}
              variables={variables}
            />
          </div>
        </div>
      )}

      {/* CREATE_POST config */}
      {node.type === "CREATE_POST" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-content">Post Content</Label>
            <VariableInput
              id="post-content"
              placeholder="Write post content..."
              multiline
              rows={5}
              value={(node.config?.content as string) ?? ""}
              onChange={(val) => updateConfig("content", val)}
              variables={variables}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Post To</Label>
            <Select
              value={(node.config?.visibility as string) ?? "PUBLIC"}
              onValueChange={(val) => {
                if (val === "PUBLIC") {
                  updateConfigBatch({ visibility: val, channelIds: [] });
                } else {
                  updateConfig("visibility", val);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public (visible to everyone)</SelectItem>
                <SelectItem value="CHANNELS">Specific Channels</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel selection */}
          {(node.config?.visibility as string) === "CHANNELS" && (
            <div className="space-y-2">
              <Label>Select Channels</Label>
              {loadingChannels ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading channels...</span>
                </div>
              ) : channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No channels available.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-md border p-2">
                  {channels.map((ch) => {
                    const selectedIds = (node.config?.channelIds as string[]) ?? [];
                    const chId = String(ch.id);
                    const isChecked = selectedIds.includes(chId);
                    return (
                      <label
                        key={chId}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...selectedIds, chId]
                              : selectedIds.filter((id) => id !== chId);
                            updateConfig("channelIds", next);
                          }}
                        />
                        <span>{ch.icon ? `${ch.icon} ` : "#"}{ch.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE_TASK config */}
      {node.type === "CREATE_TASK" && (
        <div className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <VariableInput
              id="task-title"
              placeholder="e.g. Follow up on..."
              value={(node.config?.taskTitle as string) ?? ""}
              onChange={(val) => updateConfig("taskTitle", val)}
              variables={variables}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Task Description</Label>
            <VariableInput
              id="task-desc"
              placeholder="Optional description..."
              multiline
              rows={3}
              value={(node.config?.taskDescription as string) ?? ""}
              onChange={(val) => updateConfig("taskDescription", val)}
              variables={variables}
            />
          </div>
        </div>
      )}

      {/* MOVE_TASK config */}
      {node.type === "MOVE_TASK" && (() => {
        const columns = wsDetail?.columns ?? [];
        const completedType = "COMPLETED";
        // All tasks from non-completed columns
        const availableTasks = columns
          .filter((col) => col.type !== completedType)
          .flatMap((col) =>
            (col.tasks ?? []).map((t) => ({ ...t, columnName: col.name, columnId: col.id })),
          );
        const selectedTaskIds = (node.config?.taskIds as string[]) ?? [];
        const allSelected = availableTasks.length > 0 && selectedTaskIds.length === availableTasks.length;

        return (
          <div className="space-y-4">
            {/* Workspace selector */}
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
                    updateConfigBatch({ workspaceId: val, workspaceName: ws?.name ?? "", taskIds: [], taskId: "" });
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

            {/* Task selection */}
            {(node.config?.workspaceId as string) && (
              <div className="space-y-2">
                <Label>Tasks to Move</Label>
                {loadingWsDetail ? (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading tasks...</span>
                  </div>
                ) : availableTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No incomplete tasks in this workspace.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-md border p-2">
                    {/* Select all */}
                    <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted cursor-pointer border-b pb-2 mb-1">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => {
                          updateConfig(
                            "taskIds",
                            checked ? availableTasks.map((t) => String(t.id)) : [],
                          );
                        }}
                      />
                      <span>Select all ({availableTasks.length})</span>
                    </label>
                    {availableTasks.map((task) => {
                      const tid = String(task.id);
                      const isChecked = selectedTaskIds.includes(tid);
                      return (
                        <label
                          key={tid}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const next = checked
                                ? [...selectedTaskIds, tid]
                                : selectedTaskIds.filter((id) => id !== tid);
                              updateConfig("taskIds", next);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="block" title={task.title}>
                              {task.title.length > 25 ? task.title.slice(0, 25) + "..." : task.title}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{task.columnName}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Target column */}
            {(node.config?.workspaceId as string) && (
              <div className="space-y-2">
                <Label>Move To Column</Label>
                {loadingWsDetail ? (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading columns...</span>
                  </div>
                ) : (
                  <Select
                    value={(node.config?.targetColumn as string) ?? ""}
                    onValueChange={(val) => updateConfig("targetColumn", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select target column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col.id} value={col.name}>
                          {col.name}
                          {col.type === completedType ? " (completed)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
