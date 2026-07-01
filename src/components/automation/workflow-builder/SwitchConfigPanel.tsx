import type { ConditionOperator } from "@/lib/backend-api";
import { Label } from "@/components/ui/label";
import { Plus, Split, Trash2 } from "lucide-react";
import { CONDITION_OPERATOR_LABELS } from "./constants";
import { newSwitchCase } from "./graph";
import type { SwitchCase, SwitchNodeData } from "./types";

type Props = {
  node: SwitchNodeData;
  onChange: (updated: SwitchNodeData) => void;
};

export default function SwitchConfigPanel({ node, onChange }: Props) {
  function updateField(field: string) {
    onChange({ ...node, field });
  }

  function addCase() {
    onChange({ ...node, cases: [...node.cases, newSwitchCase(node.cases.length)] });
  }

  function updateCase(updated: SwitchCase) {
    onChange({
      ...node,
      cases: node.cases.map((c) => (c.id === updated.id ? updated : c)),
    });
  }

  function removeCase(id: string) {
    onChange({ ...node, cases: node.cases.filter((c) => c.id !== id) });
  }

  return (
    <div className="space-y-6 p-3 md:p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Split className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-500">
            Switch
          </p>
          <p className="font-semibold">Multi-branch</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Evaluates a field against each case in order and follows the first match.
        If nothing matches, the <span className="font-semibold">Default</span>{" "}
        branch runs.
      </p>

      <div className="space-y-2">
        <Label>Field to evaluate</Label>
        <input
          type="text"
          placeholder="e.g. columnName, customFieldValues.priority"
          value={node.field}
          onChange={(e) => updateField(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Cases</span>
          <button
            type="button"
            onClick={addCase}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors"
          >
            <Plus className="h-3 w-3" /> Add case
          </button>
        </div>

        {node.cases.map((c, idx) => (
          <div
            key={c.id}
            className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={c.label}
                placeholder={`Case ${idx + 1}`}
                onChange={(e) => updateCase({ ...c, label: e.target.value })}
                className="h-7 flex-1 rounded border border-border bg-background px-2 text-xs font-semibold text-violet-700"
              />
              <button
                type="button"
                onClick={() => removeCase(c.id)}
                className="ml-2 text-muted-foreground transition-colors hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <select
              value={c.operator}
              onChange={(e) =>
                updateCase({ ...c, operator: e.target.value as ConditionOperator })
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

            {c.operator !== "IS_EMPTY" && c.operator !== "IS_NOT_EMPTY" && (
              <input
                type="text"
                placeholder="Value to match"
                value={c.value}
                onChange={(e) => updateCase({ ...c, value: e.target.value })}
                className="h-10 md:h-7 w-full rounded border border-border bg-background px-2 text-xs"
              />
            )}
          </div>
        ))}

        {node.cases.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No cases. Add at least one case, or everything goes to Default.
          </p>
        )}
      </div>
    </div>
  );
}
