import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ACTION_PALETTE, NODE_ICONS, TRIGGER_PALETTE } from "./constants";
import type { PaletteItem, WorkflowState } from "./types";

type NodePaletteProps = {
  workflow: WorkflowState;
  onAddTrigger: (item: PaletteItem) => void;
  onAddAction: (item: PaletteItem) => void;
};

export default function NodePalette({
  workflow,
  onAddTrigger,
  onAddAction,
}: NodePaletteProps) {
  const hasTrigger = workflow.trigger !== null;

  return (
    <ScrollArea className="max-h-56 md:max-h-none md:h-full">
      <div className="space-y-4 p-3">
        {/* Triggers section */}
        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Triggers
          </h3>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {TRIGGER_PALETTE.map((item) => {
              const Icon = NODE_ICONS[item.type];
              const disabled = hasTrigger;
              return (
                <Card
                  key={item.type}
                  className={`cursor-pointer transition-colors ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:border-blue-500/60"
                  }`}
                  onClick={() => !disabled && onAddTrigger(item)}
                >
                  <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
                      <Icon className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Actions section */}
        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </h3>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {ACTION_PALETTE.map((item) => {
              const Icon = NODE_ICONS[item.type];
              return (
                <Card
                  key={item.type}
                  className="cursor-pointer transition-colors hover:border-green-500/60"
                  onClick={() => onAddAction(item)}
                >
                  <CardContent className="flex items-center gap-2 px-2.5 py-1.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green-500/10">
                      <Icon className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
