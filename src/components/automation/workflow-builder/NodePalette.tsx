import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { PALETTE_DND_MIME } from "./canvas/FlowCanvas";
import {
  ACTION_PALETTE,
  LOGIC_ICONS,
  LOGIC_PALETTE,
  NODE_ICONS,
  TRIGGER_PALETTE,
} from "./constants";
import type { PaletteItem } from "./types";

type NodePaletteProps = {
  hasTrigger: boolean;
  insertMode: boolean;
  onCancelInsert: () => void;
  onAdd: (item: PaletteItem) => void;
};

function PaletteCard({
  item,
  icon,
  hoverClass,
  disabled,
  onAdd,
}: {
  item: PaletteItem;
  icon: React.ReactNode;
  hoverClass: string;
  disabled?: boolean;
  onAdd: (item: PaletteItem) => void;
}) {
  return (
    <Card
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_DND_MIME, JSON.stringify(item));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`gap-0 py-0 transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : `cursor-grab active:cursor-grabbing ${hoverClass}`
      }`}
      onClick={() => !disabled && onAdd(item)}
    >
      <CardContent className="flex items-center gap-2 px-2.5 py-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
          {icon}
        </div>
        <span className="text-xs font-medium">{item.label}</span>
      </CardContent>
    </Card>
  );
}

export default function NodePalette({
  hasTrigger,
  insertMode,
  onCancelInsert,
  onAdd,
}: NodePaletteProps) {
  return (
    <ScrollArea className="max-h-72 md:max-h-none md:h-full">
      <div className="space-y-4 p-3">
        {insertMode && (
          <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 px-2.5 py-2 text-xs">
            <span className="font-medium text-primary">Inserting between steps…</span>
            <button
              type="button"
              onClick={onCancelInsert}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Cancel insert"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Click to append, or drag onto the canvas.
        </p>

        {/* Triggers */}
        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Triggers
          </h3>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {TRIGGER_PALETTE.map((item) => {
              const Icon = NODE_ICONS[item.type as keyof typeof NODE_ICONS];
              return (
                <PaletteCard
                  key={item.type}
                  item={item}
                  disabled={hasTrigger}
                  hoverClass="hover:border-blue-500/60"
                  icon={
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
                      <Icon className="h-3.5 w-3.5 text-blue-500" />
                    </span>
                  }
                  onAdd={onAdd}
                />
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </h3>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {ACTION_PALETTE.map((item) => {
              const Icon = NODE_ICONS[item.type as keyof typeof NODE_ICONS];
              return (
                <PaletteCard
                  key={item.type}
                  item={item}
                  hoverClass="hover:border-green-500/60"
                  icon={
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/10">
                      <Icon className="h-3.5 w-3.5 text-green-500" />
                    </span>
                  }
                  onAdd={onAdd}
                />
              );
            })}
          </div>
        </div>

        {/* Logic */}
        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Logic
          </h3>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
            {LOGIC_PALETTE.map((item) => {
              const Icon = LOGIC_ICONS[item.kind as "ifElse" | "switch"];
              const isIf = item.kind === "ifElse";
              return (
                <PaletteCard
                  key={item.type}
                  item={item}
                  hoverClass={isIf ? "hover:border-amber-500/60" : "hover:border-violet-500/60"}
                  icon={
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${
                        isIf ? "bg-amber-500/10" : "bg-violet-500/10"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${isIf ? "text-amber-500" : "text-violet-500"}`}
                      />
                    </span>
                  }
                  onAdd={onAdd}
                />
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
