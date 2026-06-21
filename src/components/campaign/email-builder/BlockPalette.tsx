import {
  Type,
  Heading,
  Crown,
  Image,
  Columns2,
  MousePointerClick,
  Play,
  Minus,
  MoveVertical,
  Share2,
  Code,
} from "lucide-react";
import { BLOCK_DEFINITIONS, type BlockType } from "./types";

const ICON_MAP: Record<string, React.ElementType> = {
  Type,
  Heading,
  Crown,
  Image,
  Columns2,
  MousePointerClick,
  Play,
  Minus,
  MoveVertical,
  Share2,
  Code,
};

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
  compact?: boolean;
}

export default function BlockPalette({ onAddBlock, compact }: BlockPaletteProps) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {!compact && (
        <p className="text-[11px] text-muted-foreground">
          Click a block to add it to the selected section
        </p>
      )}
      <div className={`grid gap-1.5 ${compact ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-3"}`}>
        {BLOCK_DEFINITIONS.map((def) => {
          const Icon = ICON_MAP[def.icon] || Type;
          return (
            <button
              key={def.type}
              className={`flex flex-col items-center gap-1.5 rounded-md border border-border bg-background hover:bg-accent hover:border-primary/30 transition-colors cursor-pointer text-center group ${
                compact ? "p-1.5" : "p-3"
              }`}
              onClick={(e) => { e.stopPropagation(); onAddBlock(def.type); }}
            >
              <Icon className={`text-muted-foreground group-hover:text-primary transition-colors ${compact ? "w-3.5 h-3.5" : "w-5 h-5"}`} />
              <span className={`font-medium leading-tight ${compact ? "text-[9px]" : "text-[11px]"}`}>{def.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
