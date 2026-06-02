import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Workspace } from "@/lib/backend-api";
import { useDroppable } from "@dnd-kit/core";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PRESET_COLUMN_COLORS, isLightColor, tintHex } from "../utils/color";

export function WorkspaceColumn({
  column,
  color,
  onColorChange,
  onAddTask,
  onRename,
  onDelete,
  children,
}: {
  column: NonNullable<Workspace["columns"]>[number];
  color: string;
  onColorChange: (columnId: string, color: string) => void;
  onAddTask: (columnId: string) => void;
  onRename?: (columnId: string, name: string) => void;
  onDelete?: (columnId: string) => void;
  children: React.ReactNode;
}) {
  const droppableId = `column-${column.id}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(color);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  useEffect(() => {
    if (!isColorMenuOpen) {
      setDraftColor(color);
    }
  }, [color, isColorMenuOpen]);

  const light = isLightColor(color);

  const DEFAULT_BUCKET_NAMES = ["to do", "in progress", "done"];
  const isCustomColumn =
    column.type === "NORMAL" &&
    !DEFAULT_BUCKET_NAMES.includes(column.name.toLowerCase().trim());

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-[290px] shrink-0 flex-col rounded-xl border border-border bg-card p-2.5 ${
        isOver ? "ring-2 ring-ring" : ""
      }`}
    >
      <div
        className="mb-2 flex items-center justify-between rounded-md px-2 py-1.5"
        style={{
          backgroundImage: `linear-gradient(90deg, ${tintHex(
            color,
            0.14,
            "white",
          )} 0%, ${tintHex(color, 0.14, "white")} 70%, ${tintHex(
            color,
            0.22,
            "white",
          )} 80%, ${tintHex(color, 0.3, "white")} 90%, ${tintHex(
            color,
            0.36,
            "white",
          )} 100%)`,
        }}
      >
        <div className="mx-3 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                const trimmed = editName.trim();
                if (trimmed && trimmed !== column.name && onRename) {
                  onRename(String(column.id), trimmed);
                } else {
                  setEditName(column.name);
                }
                setIsEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === "Escape") {
                  setEditName(column.name);
                  setIsEditing(false);
                }
              }}
              className={`w-full bg-transparent text-sm font-semibold outline-none border-b ${light ? "text-gray-900 border-gray-400" : "text-white border-white/60"}`}
            />
          ) : (
            <div
              className={`text-sm font-semibold cursor-pointer ${light ? "text-gray-900" : "text-white"}`}
              onDoubleClick={() => {
                setEditName(column.name);
                setIsEditing(true);
              }}
              title="Double-click to rename"
            >
              {column.name}
            </div>
          )}
          <div className={`text-[10px] ${light ? "text-gray-700" : "text-white/90"}`}>
            {column.tasks?.length ?? 0} tasks
          </div>
        </div>
        <div className="ml-1.5 flex items-center gap-0.5 rounded-full border border-white/70 bg-white/45 px-1 py-0.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 rounded-full px-1.5 text-[10px] text-foreground/60 hover:bg-white/70 hover:text-black"
            onClick={() => onAddTask(String(column.id))}
          >
            <Plus className="mr-0.5 h-3 w-3" />
            Add
          </Button>
          {isCustomColumn && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 rounded-full p-0 text-foreground/60 hover:bg-red-100 hover:text-red-600"
              onClick={() => onDelete(String(column.id))}
              title="Delete bucket"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          <DropdownMenu
            open={isColorMenuOpen}
            onOpenChange={setIsColorMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-5 w-5 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
                aria-label={`Change ${column.name} column color`}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-lg border border-border bg-popover p-2.5"
            >
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground">
                  Column color
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLUMN_COLORS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`h-5 w-5 rounded-full border-2 border-background ${
                        draftColor.toLowerCase() === preset.toLowerCase()
                          ? "ring-2 ring-ring"
                          : ""
                      }`}
                      style={{ backgroundColor: preset }}
                      onClick={() => setDraftColor(preset)}
                      aria-label={`Use preset color ${preset}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftColor}
                    onChange={(event) => setDraftColor(event.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-sm border border-border bg-background p-0.5"
                  />
                  <div className="rounded-sm border border-border bg-muted px-2 py-1 font-mono text-[11px] uppercase text-muted-foreground">
                    {draftColor}
                  </div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => {
                      setDraftColor(color);
                      setIsColorMenuOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => {
                      onColorChange(String(column.id), draftColor);
                      setIsColorMenuOpen(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}
