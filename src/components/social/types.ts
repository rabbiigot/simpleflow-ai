import type {
  SocialPost,
  SocialReactionType,
} from "@/lib/backend-api";
import { PROFILE_STORAGE_KEY } from "@/store/auth-store";

import likeIcon from "@/assets/reactions/like.svg";
import loveIcon from "@/assets/reactions/love.svg";
import hahaIcon from "@/assets/reactions/haha.svg";
import wowIcon from "@/assets/reactions/wow.svg";
import sadIcon from "@/assets/reactions/sad.svg";
import angryIcon from "@/assets/reactions/angry.svg";
import celebrateIcon from "@/assets/reactions/celebrate.svg";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type UiComment = {
  id: string;
  userId: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  createdAtMs: number;
  reactions: Array<{
    id: string;
    type: import("@/lib/backend-api").SocialReactionType;
    userId: string;
    userName: string;
  }>;
  replies: UiComment[];
};

export type UiPost = {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  timestamp: string;
  createdAtMs: number;
  content: string;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | "VIDEO" | null;
  visibility: "PUBLIC" | "CHANNELS";
  channelNames: string[];
  reactionCounts: Record<SocialReactionType, number>;
  userReaction: SocialReactionType | null;
  reactions: Array<{
    id: string;
    type: SocialReactionType;
    userId: string;
    userName: string;
    createdAtMs: number;
  }>;
  comments: UiComment[];
  commentCount: number;
  userCommented: boolean;
  userShared: boolean;
};

export type NotificationItem = {
  id: string;
  text: string;
  timestamp: string;
  createdAtMs: number;
};

export type ProfileState = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  avatarUrl: string;
  bio: string;
};

/* ------------------------------------------------------------------ */
/*  Legacy local types removed — groups/channels/messages are now      */
/*  fully backend-driven via ChatChannel API + WebSocket                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const REACTION_PICKER: Array<{
  type: SocialReactionType;
  emoji: string;
  icon: string;
  label: string;
}> = [
  { type: "LIKE", emoji: "\u{1F44D}", icon: likeIcon, label: "Like" },
  { type: "LOVE", emoji: "\u2764\uFE0F", icon: loveIcon, label: "Love" },
  { type: "HAHA", emoji: "\u{1F602}", icon: hahaIcon, label: "Haha" },
  { type: "WOW", emoji: "\u{1F62E}", icon: wowIcon, label: "Wow" },
  { type: "SAD", emoji: "\u{1F622}", icon: sadIcon, label: "Sad" },
  { type: "ANGRY", emoji: "\u{1F621}", icon: angryIcon, label: "Angry" },
  { type: "CELEBRATE", emoji: "\u{1F389}", icon: celebrateIcon, label: "Celebrate" },
];

/* ------------------------------------------------------------------ */
/*  Utility functions                                                  */
/* ------------------------------------------------------------------ */

export function readProfileFromStorage(
  user: { firstName?: string; lastName?: string; email?: string } | null,
): ProfileState {
  if (typeof window === "undefined") {
    return {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      country: "",
      avatarUrl: "",
      bio: "",
    };
  }

  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProfileState>;
      return {
        firstName: parsed.firstName || user?.firstName || "",
        lastName: parsed.lastName || user?.lastName || "",
        email: parsed.email || user?.email || "",
        country: parsed.country || "",
        avatarUrl: parsed.avatarUrl || "",
        bio: parsed.bio || "",
      };
    }
  } catch {
    // no-op
  }

  return {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    country: "",
    avatarUrl: "",
    bio: "",
  };
}

export function reactionLabel(type: SocialReactionType | null): string {
  if (!type) return "React";
  return REACTION_PICKER.find((item) => item.type === type)?.label ?? "React";
}

export function reactionEmoji(type: SocialReactionType | null): string {
  if (!type) return "\u{1F44D}";
  return REACTION_PICKER.find((item) => item.type === type)?.emoji ?? "\u{1F44D}";
}

export function reactionIcon(type: SocialReactionType | null): string {
  if (!type) return likeIcon;
  return REACTION_PICKER.find((item) => item.type === type)?.icon ?? likeIcon;
}

export function displayName(post: SocialPost): string {
  const firstName = post.user?.firstName?.trim();
  const lastName = post.user?.lastName?.trim();

  if (firstName || lastName) {
    return [firstName, lastName].filter(Boolean).join(" ");
  }

  return post.user?.email || "User";
}

export function mapPost(post: SocialPost, currentUserId: string): UiPost {
  const initialCounts: Record<SocialReactionType, number> = {
    LIKE: 0,
    LOVE: 0,
    CELEBRATE: 0,
    WOW: 0,
    HAHA: 0,
    SAD: 0,
    ANGRY: 0,
  };

  let userReaction: SocialReactionType | null = null;

  const reactions = (post.reactions ?? []).map((reaction) => {
    initialCounts[reaction.type] = (initialCounts[reaction.type] || 0) + 1;

    if (reaction.userId === currentUserId) {
      userReaction = reaction.type;
    }

    const userName =
      [reaction.user?.firstName, reaction.user?.lastName]
        .filter(Boolean)
        .join(" ") || reaction.user?.email || "Someone";

    return {
      id: reaction.id,
      type: reaction.type,
      userId: reaction.userId,
      userName,
      createdAtMs: Date.parse(reaction.createdAt || post.createdAt),
    };
  });

  const mapComment = (comment: any): UiComment => ({
    id: String(comment.id),
    userId: String(comment.userId || comment.user?.id || ""),
    author:
      [comment.user?.firstName, comment.user?.lastName]
        .filter(Boolean)
        .join(" ") ||
      comment.user?.email ||
      "User",
    avatar: "/placeholder.svg",
    content: comment.content,
    timestamp: new Date(comment.createdAt).toLocaleString(),
    createdAtMs: Date.parse(comment.createdAt),
    reactions: (comment.reactions ?? []).map((r: any) => ({
      id: String(r.id),
      type: r.type,
      userId: String(r.userId),
      userName: [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") || "Someone",
    })),
    replies: (comment.replies ?? []).map(mapComment),
  });

  const comments = (post.comments ?? []).map(mapComment);

  const channelNames = ((post as any).channels ?? []).map(
    (ch: { name?: string }) => ch.name || "channel",
  );

  const allCommentUserIds = new Set<string>();
  const collectCommentUserIds = (c: UiComment) => {
    allCommentUserIds.add(String(c.userId));
    c.replies.forEach(collectCommentUserIds);
  };
  comments.forEach(collectCommentUserIds);

  const shares = ((post as any).shares ?? []) as Array<{ sharedById: number | string }>;

  return {
    id: post.id,
    authorId: String(post.userId || post.user?.id || ""),
    author: displayName(post),
    avatar: "/placeholder.svg",
    timestamp: new Date(post.createdAt).toLocaleString(),
    createdAtMs: Date.parse(post.createdAt),
    content: post.content,
    mediaUrl: (post as any).mediaUrl || null,
    mediaType: (post as any).mediaType || null,
    visibility: ((post as any).visibility as "PUBLIC" | "CHANNELS") || "PUBLIC",
    channelNames,
    reactionCounts: initialCounts,
    userReaction,
    reactions,
    comments,
    commentCount: comments.length,
    userCommented: allCommentUserIds.has(String(currentUserId)),
    userShared: shares.some((s) => String(s.sharedById) === String(currentUserId)),
  };
}

export function topReactionEmojis(
  reactionCounts: Record<SocialReactionType, number>,
): string[] {
  return REACTION_PICKER.filter((item) => (reactionCounts[item.type] || 0) > 0)
    .sort((a, b) => reactionCounts[b.type] - reactionCounts[a.type])
    .slice(0, 3)
    .map((item) => item.icon);
}
