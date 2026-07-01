import { Handle, Position, type NodeProps, type NodeTypes } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { LOGIC_ICONS, NODE_ICONS, NODE_LABELS } from "../constants";
import type {
  ActionNodeData,
  IfElseNodeData,
  SwitchNodeData,
  TriggerNodeData,
  WorkflowNode,
} from "../types";

export type RunStatus = "running" | "success" | "failed";

export type WfNodeData = {
  wf: WorkflowNode;
  invalid?: boolean;
  /** Live state while a test run replays through this node. */
  runStatus?: RunStatus;
  onDelete: (id: string) => void;
};

const NODE_WIDTH = 230;

const handleClass =
  "!h-3 !w-3 !border-2 !border-background !bg-muted-foreground/70";

// Static accent class strings (Tailwind JIT can only see complete literals).
type Accent = "blue" | "green" | "amber" | "violet";
const ACCENT: Record<
  Accent,
  { selectedRing: string; iconBg: string; iconText: string; eyebrow: string }
> = {
  blue: {
    selectedRing: "border-blue-500 ring-2 ring-blue-500/25",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-500",
    eyebrow: "text-blue-500",
  },
  green: {
    selectedRing: "border-green-500 ring-2 ring-green-500/25",
    iconBg: "bg-green-500/10",
    iconText: "text-green-500",
    eyebrow: "text-green-500",
  },
  amber: {
    selectedRing: "border-amber-500 ring-2 ring-amber-500/25",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-500",
    eyebrow: "text-amber-500",
  },
  violet: {
    selectedRing: "border-violet-500 ring-2 ring-violet-500/25",
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-500",
    eyebrow: "text-violet-500",
  },
};

function DeleteButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nodrag absolute -right-2 -top-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full border bg-background text-destructive shadow-sm group-hover:flex hover:bg-destructive/10"
      aria-label="Delete node"
    >
      <Trash2 className="h-3 w-3" />
    </button>
  );
}

function Shell({
  accent,
  selected,
  invalid,
  runStatus,
  children,
  onDelete,
}: {
  accent: Accent;
  selected?: boolean;
  invalid?: boolean;
  runStatus?: RunStatus;
  children: React.ReactNode;
  onDelete: (e: React.MouseEvent) => void;
}) {
  // Test-run state takes visual priority over selection/validity.
  const ring =
    runStatus === "running"
      ? "border-primary wf-node-running"
      : runStatus === "success"
        ? "border-emerald-500 ring-2 ring-emerald-500/25"
        : runStatus === "failed"
          ? "border-rose-500 ring-2 ring-rose-500/30"
          : selected
            ? ACCENT[accent].selectedRing
            : invalid
              ? "border-destructive/60 ring-2 ring-destructive/15"
              : "border-border hover:border-foreground/20";
  return (
    <div
      className={`group relative rounded-xl border bg-card shadow-sm transition-all ${ring}`}
      style={{ width: NODE_WIDTH }}
    >
      <DeleteButton onClick={onDelete} />
      {children}
    </div>
  );
}

function Body({
  icon,
  accent,
  eyebrow,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  accent: Accent;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ACCENT[accent].iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[9px] font-semibold uppercase tracking-wider leading-tight ${ACCENT[accent].eyebrow}`}
        >
          {eyebrow}
        </p>
        <p className="truncate text-sm font-semibold">{title}</p>
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------
function TriggerNode({ data, selected }: NodeProps) {
  const d = data as unknown as WfNodeData;
  const node = d.wf.data as TriggerNodeData;
  const Icon = NODE_ICONS[node.type];
  const ws = node.config?.workspaceName as string | undefined;
  return (
    <Shell
      accent="blue"
      selected={selected}
      invalid={d.invalid}
      runStatus={d.runStatus}
      onDelete={(e) => {
        e.stopPropagation();
        d.onDelete(node.id);
      }}
    >
      <Body
        accent="blue"
        icon={<Icon className={`h-4 w-4 ${ACCENT.blue.iconText}`} />}
        eyebrow="Trigger"
        title={NODE_LABELS[node.type]}
        subtitle={ws ? `Workspace: ${ws}` : undefined}
      />
      <Handle type="source" position={Position.Right} id="out" className={handleClass} />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------
function ActionNode({ data, selected }: NodeProps) {
  const d = data as unknown as WfNodeData;
  const node = d.wf.data as ActionNodeData;
  const Icon = NODE_ICONS[node.type];
  return (
    <Shell
      accent="green"
      selected={selected}
      invalid={d.invalid}
      runStatus={d.runStatus}
      onDelete={(e) => {
        e.stopPropagation();
        d.onDelete(node.id);
      }}
    >
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Body
        accent="green"
        icon={<Icon className={`h-4 w-4 ${ACCENT.green.iconText}`} />}
        eyebrow="Action"
        title={NODE_LABELS[node.type]}
        subtitle={summarizeAction(node)}
      />
      <Handle type="source" position={Position.Right} id="out" className={handleClass} />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// IF / ELSE
// ---------------------------------------------------------------------------
function IfElseNode({ data, selected }: NodeProps) {
  const d = data as unknown as WfNodeData;
  const node = d.wf.data as IfElseNodeData;
  const Icon = LOGIC_ICONS.ifElse;
  const count = node.conditions.length;
  return (
    <Shell
      accent="amber"
      selected={selected}
      invalid={d.invalid}
      runStatus={d.runStatus}
      onDelete={(e) => {
        e.stopPropagation();
        d.onDelete(node.id);
      }}
    >
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Body
        accent="amber"
        icon={<Icon className={`h-4 w-4 ${ACCENT.amber.iconText}`} />}
        eyebrow="Condition"
        title="IF / ELSE"
        subtitle={count ? `${count} condition${count > 1 ? "s" : ""}` : "No conditions set"}
      />
      <div className="flex flex-col items-end gap-0.5 border-t px-3 py-1 text-[9px] font-bold">
        <span className="text-emerald-600">TRUE →</span>
        <span className="text-rose-500">FALSE →</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: "62%" }}
        className="!h-3 !w-3 !border-2 !border-background !bg-emerald-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: "84%" }}
        className="!h-3 !w-3 !border-2 !border-background !bg-rose-500"
      />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// SWITCH
// ---------------------------------------------------------------------------
function SwitchNode({ data, selected }: NodeProps) {
  const d = data as unknown as WfNodeData;
  const node = d.wf.data as SwitchNodeData;
  const Icon = LOGIC_ICONS.switch;
  const handles = [
    ...node.cases.map((c) => ({ id: c.id, label: c.label })),
    { id: "default", label: "Default" },
  ];
  return (
    <Shell
      accent="violet"
      selected={selected}
      invalid={d.invalid}
      runStatus={d.runStatus}
      onDelete={(e) => {
        e.stopPropagation();
        d.onDelete(node.id);
      }}
    >
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Body
        accent="violet"
        icon={<Icon className={`h-4 w-4 ${ACCENT.violet.iconText}`} />}
        eyebrow="Switch"
        title={node.field ? `On: ${node.field}` : "Switch"}
        subtitle={`${node.cases.length} case${node.cases.length === 1 ? "" : "s"} + default`}
      />
      <div className="flex flex-col items-end gap-1 border-t px-2 py-1.5">
        {handles.map((h) => (
          <span
            key={h.id}
            className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-600"
          >
            {h.label} →
          </span>
        ))}
      </div>
      {handles.map((h, i) => (
        <Handle
          key={h.id}
          type="source"
          position={Position.Right}
          id={h.id}
          style={{ top: `${((i + 1) / (handles.length + 1)) * 100}%` }}
          className="!h-3 !w-3 !border-2 !border-background !bg-violet-500"
        />
      ))}
    </Shell>
  );
}

function summarizeAction(node: ActionNodeData): string | undefined {
  switch (node.type) {
    case "SEND_EMAIL":
      return (node.config?.to as string) ? `To: ${node.config.to}` : "Not configured";
    case "CREATE_POST": {
      const c = node.config?.content as string | undefined;
      return c ? c.slice(0, 32) + (c.length > 32 ? "…" : "") : "Not configured";
    }
    case "CREATE_TASK":
      return (node.config?.taskTitle as string)
        ? `Task: ${node.config.taskTitle}`
        : "Not configured";
    case "MOVE_TASK":
      return (node.config?.targetColumn as string)
        ? `→ ${node.config.targetColumn}`
        : "Not configured";
    default:
      return undefined;
  }
}

export const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  ifElse: IfElseNode,
  switch: SwitchNode,
};
