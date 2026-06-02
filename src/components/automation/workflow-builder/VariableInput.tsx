import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

type VariableInputProps = {
  value: string;
  onChange: (value: string) => void;
  variables: string[];
  placeholder?: string;
  id?: string;
  multiline?: boolean;
  rows?: number;
};

export default function VariableInput({
  value,
  onChange,
  variables,
  placeholder,
  id,
  multiline = false,
  rows = 4,
}: VariableInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const [slashPos, setSlashPos] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = variables.filter((v) =>
    v.toLowerCase().includes(filter.toLowerCase()),
  );

  const insertVariable = useCallback(
    (variable: string) => {
      if (slashPos === null) return;
      const before = value.slice(0, slashPos);
      const afterSlash = value.slice(slashPos);
      // Find end of the "/filter" text to replace
      const match = afterSlash.match(/^\/\S*/);
      const replaceLen = match ? match[0].length : 1;
      const after = value.slice(slashPos + replaceLen);
      const newValue = before + variable + after;
      onChange(newValue);
      setShowMenu(false);
      setSlashPos(null);
      setFilter("");

      // Restore cursor position after the inserted variable
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          const cursorPos = before.length + variable.length;
          el.focus();
          el.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [value, slashPos, onChange],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPos = e.target.selectionStart ?? newValue.length;
      onChange(newValue);

      // Check if we just typed "/" or are continuing to filter after "/"
      const textUpToCursor = newValue.slice(0, cursorPos);
      const lastSlash = textUpToCursor.lastIndexOf("/");

      if (lastSlash !== -1) {
        const afterSlash = textUpToCursor.slice(lastSlash + 1);
        // Only show menu if there's no space after the slash (user is still typing the filter)
        if (!/\s/.test(afterSlash)) {
          setSlashPos(lastSlash);
          setFilter(afterSlash);
          setShowMenu(true);
          setMenuIndex(0);
          return;
        }
      }

      setShowMenu(false);
      setSlashPos(null);
      setFilter("");
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showMenu || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenuIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMenuIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertVariable(filtered[menuIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMenu(false);
      }
    },
    [showMenu, filtered, menuIndex, insertVariable],
  );

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const baseClass =
    "border-input bg-background-secondary flex w-full rounded-md border-[0.5px] px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          id={id}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(baseClass, "resize-none")}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(baseClass, "h-9")}
        />
      )}

      {variables.length > 0 && !showMenu && (
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Type <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">/</kbd> to insert a variable
        </p>
      )}

      {showMenu && filtered.length > 0 && (
        <div
          ref={menuRef}
          className="absolute left-0 z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
        >
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Variables
          </p>
          {filtered.map((v, i) => (
            <button
              key={v}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors",
                i === menuIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                insertVariable(v);
              }}
              onMouseEnter={() => setMenuIndex(i)}
            >
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {v}
              </code>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
