import type { SocialReactionType } from "@/lib/backend-api";
import { useRef, useState } from "react";
import { REACTION_PICKER } from "./types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type ReactionPickerProps = {
  /** Called when the user clicks one of the reaction emojis. */
  onReact: (type: SocialReactionType) => void;
  /** The reaction type the current user has already applied (if any). */
  currentReaction?: SocialReactionType | null;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A Facebook-style floating emoji reaction bar.
 *
 * Intended to be rendered inside a parent that controls visibility
 * (e.g. on hover or on click).  If you need a self-contained
 * hover-wrapper, use `<ReactionPickerHover>` below.
 */
export function ReactionPickerBar({
  onReact,
  currentReaction,
}: ReactionPickerProps) {
  const [hoveredType, setHoveredType] = useState<SocialReactionType | null>(
    null,
  );

  return (
    <div className="flex items-end gap-1 rounded-full border bg-white px-2 py-1.5 shadow-lg">
      {REACTION_PICKER.map((reaction) => {
        const isHovered = hoveredType === reaction.type;
        const isActive = currentReaction === reaction.type;

        return (
          <div
            key={reaction.type}
            className="relative flex flex-col items-center"
          >
            {/* Tooltip label -- visible on hover */}
            {isHovered && (
              <span className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-full bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-white shadow">
                {reaction.label}
              </span>
            )}

            <button
              type="button"
              className={[
                "grid h-9 w-9 place-items-center rounded-full transition-transform duration-150",
                isHovered ? "scale-[1.3]" : "scale-100",
                isActive
                  ? "ring-2 ring-primary ring-offset-1"
                  : "hover:bg-accent",
              ].join(" ")}
              onClick={() => onReact(reaction.type)}
              onMouseEnter={() => setHoveredType(reaction.type)}
              onMouseLeave={() => setHoveredType(null)}
              aria-label={reaction.label}
              title={reaction.label}
            >
              <img src={reaction.icon} alt={reaction.label} className="h-7 w-7" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Self-contained hover wrapper                                       */
/* ------------------------------------------------------------------ */

export type ReactionPickerHoverProps = ReactionPickerProps & {
  children: React.ReactNode;
};

/**
 * Wraps `children` (typically a "Like / React" button) and displays the
 * floating `ReactionPickerBar` above it on hover.
 *
 * The picker stays visible while the cursor is anywhere inside the
 * wrapper (button + picker area).  A small delay on mouse-leave prevents
 * flickering when the cursor moves between the button and the bar.
 */
export function ReactionPickerHover({
  onReact,
  currentReaction,
  children,
}: ReactionPickerHoverProps) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setVisible(true);
  };

  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 300);
  };

  const handleReact = (type: SocialReactionType) => {
    setVisible(false);
    onReact(type);
  };

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      {visible && (
        <div className="absolute bottom-full left-0 z-30 mb-1">
          <ReactionPickerBar
            onReact={handleReact}
            currentReaction={currentReaction}
          />
        </div>
      )}
      {children}
    </div>
  );
}

export default ReactionPickerHover;
