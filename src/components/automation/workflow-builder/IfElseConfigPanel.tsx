import type { ConditionLogicGate, ConditionOperator } from "@/lib/backend-api";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { CONDITION_OPERATOR_LABELS } from "./constants";
import { uid } from "./graph";
import type { ConditionNodeData, IfElseNodeData } from "./types";

type Props = {
  node: IfElseNodeData;
  onChange: (updated: IfElseNodeData) => void;
};

export default function IfElseConfigPanel({ node, onChange }: Props) {
  const conditions = node.conditions;

  function addCondition() {
    const next: ConditionNodeData = {
      id: uid(),
      field: "",
      operator: "EQUALS",
      value: "",
      logicGate: "AND",
      sortOrder: conditions.length,
    };
    onChange({ ...node, conditions: [...conditions, next] });
  }

  function updateCondition(updated: ConditionNodeData) {
    onChange({
      ...node,
      conditions: conditions.map((c) => (c.id === updated.id ? updated : c)),
    });
  }

  function removeCondition(id: string) {
    onChange({
      ...node,
      conditions: conditions
        .filter((c) => c.id !== id)
        .map((c, i) => ({ ...c, sortOrder: i })),
    });
  }

  return (
    <div className="space-y-6 p-3 md:p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <GitBranch className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-500">
            Condition
          </p>
          <p className="font-semibold">IF / ELSE</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        When all conditions pass, the flow follows the{" "}
        <span className="font-semibold text-emerald-600">TRUE</span> branch;
        otherwise it follows the{" "}
        <span className="font-semibold text-rose-500">FALSE</span> branch.
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Conditions</span>
          <button
            type="button"
            onClick={addCondition}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        {conditions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No conditions yet. An IF with no conditions always takes the TRUE
            branch.
          </p>
        )}

        {conditions.map((cond, idx) => (
          <div
            key={cond.id}
            className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600">
                {idx === 0 ? "IF" : cond.logicGate}
              </span>
              <button
                type="button"
                onClick={() => removeCondition(cond.id)}
                className="text-muted-foreground transition-colors hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {idx > 0 && (
              <select
                value={cond.logicGate}
                onChange={(e) =>
                  updateCondition({
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
              placeholder="Field (e.g. taskTitle, customFieldValues.priority)"
              value={cond.field}
              onChange={(e) => updateCondition({ ...cond, field: e.target.value })}
              className="h-10 md:h-7 w-full rounded border border-border bg-background px-2 text-xs"
            />

            <select
              value={cond.operator}
              onChange={(e) =>
                updateCondition({
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

            {cond.operator !== "IS_EMPTY" && cond.operator !== "IS_NOT_EMPTY" && (
              <input
                type="text"
                placeholder="Value"
                value={cond.value}
                onChange={(e) => updateCondition({ ...cond, value: e.target.value })}
                className="h-10 md:h-7 w-full rounded border border-border bg-background px-2 text-xs"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
