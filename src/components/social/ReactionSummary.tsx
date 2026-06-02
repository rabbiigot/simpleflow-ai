import { Button } from "@/components/ui/button";
import type {
  SocialReaction,
  SocialReactionType,
} from "@/lib/backend-api";
import { ReactionPickerHover } from "./ReactionPicker";
import {
  reactionIcon,
  reactionLabel,
  topReactionEmojis,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type ReactionSummaryProps = {
  /** Full list of reactions on the post (used to compute emoji badges and total). */
  reactions: SocialReaction[];
  /** Callback fired when the user picks or toggles a reaction. */
  onReact: (type: SocialReactionType) => void;
  /** Id of the currently signed-in user -- used to detect their active reaction. */
  currentUserId: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildCounts(reactions: SocialReaction[]) {
  const counts: Record<SocialReactionType, number> = {
    LIKE: 0,
    LOVE: 0,
    CELEBRATE: 0,
    WOW: 0,
    HAHA: 0,
    SAD: 0,
    ANGRY: 0,
  };

  for (const r of reactions) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }

  return counts;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ReactionSummary({
  reactions,
  onReact,
  currentUserId,
}: ReactionSummaryProps) {
  const counts = buildCounts(reactions);
  const total = reactions.length;
  const emojis = topReactionEmojis(counts);
  const userReaction =
    reactions.find((r) => r.userId === currentUserId)?.type ?? null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      {/* Left side: overlapping emoji badges + total count */}
      <div className="flex items-center gap-1.5">
        {emojis.length > 0 && (
          <span className="inline-flex items-center -space-x-1">
            {emojis.map((iconSrc, idx) => (
              <img
                key={`${iconSrc}-${idx}`}
                src={iconSrc}
                alt=""
                className="relative inline-block h-5 w-5 rounded-full border border-white shadow-sm"
                style={{ zIndex: emojis.length - idx }}
              />
            ))}
          </span>
        )}
        {total > 0 && <span>{total}</span>}
      </div>

      {/* Right side: React / Like button with hover picker */}
      <ReactionPickerHover onReact={onReact} currentReaction={userReaction}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          {userReaction ? (
            <img src={reactionIcon(userReaction)} alt="" className="h-5 w-5" />
          ) : (
            <span className="text-sm">React</span>
          )}
        </Button>
      </ReactionPickerHover>
    </div>
  );
}
