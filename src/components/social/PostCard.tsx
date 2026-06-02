import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { SocialReactionType } from "@/lib/backend-api";
import { ImageWithLoader } from "@/components/ui/image-loader";
import { ClipboardList, Globe, Lock, MessageCircle, MessageSquare, MoreHorizontal, Rss, Reply, Send, Share2, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ReactionPickerHover } from "./ReactionPicker";
import { reactionIcon, reactionLabel, topReactionEmojis, type UiComment, type UiPost } from "./types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 52) return `${weeks}w`;
  return `${Math.floor(weeks / 52)}y`;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type PostCardProps = {
  /** The fully-mapped UI post object. */
  post: UiPost;
  /** The signed-in user's id. */
  currentUserId: string;
  /** Avatar URL for the signed-in user (shown next to comment input). */
  currentUserAvatar?: string;
  /** Initials for the signed-in user's avatar fallback. */
  currentUserInitials: string;
  /** Called when the user picks a reaction on this post. */
  onReaction: (postId: string, type: SocialReactionType) => void;
  /** Called when the user submits a comment. parentId for replies. */
  onComment: (postId: string, content: string, parentId?: string) => void;
  /** Called when the user reacts to a comment. */
  onCommentReaction?: (commentId: string, type: SocialReactionType) => void;
  /** Called when the user chooses "Delete" from the three-dot menu. Omit to hide the option. */
  onDeletePost?: (postId: string) => void;
  /** Called when the user shares the post. channelIds empty = public. */
  onShare?: (postId: string, channelIds: string[], visibility: "PUBLIC" | "CHANNELS") => void;
  /** Called when the user shares the post to a channel's chat. */
  onShareToChat?: (postId: string, channelId: string) => void;
  /** Available channels for sharing. */
  channels?: Array<{ id: number | string; name: string; icon?: string | null }>;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type TaskCardData = { _type: "task-card"; title: string; workspace: string; message?: string };

function parseTaskCard(content: string): TaskCardData | null {
  if (!content.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed?._type === "task-card") return parsed as TaskCardData;
  } catch {
    // not JSON
  }
  return null;
}

function totalReactions(
  reactionCounts: Record<SocialReactionType, number>,
): number {
  return Object.values(reactionCounts).reduce((sum, c) => sum + c, 0);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PostCard({
  post,
  currentUserId,
  currentUserAvatar,
  currentUserInitials,
  onReaction,
  onComment,
  onCommentReaction,
  onDeletePost,
  onShare,
  onShareToChat,
  channels = [],
}: PostCardProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);

  const isOwner = post.authorId === currentUserId;

  /* ---- actions ---- */

  const handleReaction = (type: SocialReactionType) => {
    onReaction(post.id, type);
  };

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onComment(post.id, trimmed);
    setCommentText("");
  };

  const handleSharePublic = () => {
    onShare?.(String(post.id), [], "PUBLIC");
    setShowShareMenu(false);
  };

  const handleShareToChannel = (channelId: string) => {
    onShare?.(String(post.id), [channelId], "CHANNELS");
    setShowShareMenu(false);
    setExpandedChannelId(null);
  };

  const handleShareToChannelChat = (channelId: string) => {
    onShareToChat?.(String(post.id), channelId);
    setShowShareMenu(false);
    setExpandedChannelId(null);
  };

  const [expandedChannelId, setExpandedChannelId] = useState<string | null>(null);

  /* ---- derived data ---- */

  const total = totalReactions(post.reactionCounts);
  const emojis = topReactionEmojis(post.reactionCounts);

  return (
    <Card id={`post-${post.id}`}>
      {/* ------------------------------------------------------------ */}
      {/*  Header: avatar + author + timestamp + three-dot menu         */}
      {/* ------------------------------------------------------------ */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const to = post.authorId === currentUserId ? "/social/profile" : `/social/profile/${post.authorId}`;
                navigate({ to });
              }}
              className="shrink-0"
            >
              <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-shadow">
                <AvatarImage src={post.avatar || "/placeholder.svg"} />
                <AvatarFallback>{post.author[0] ?? "U"}</AvatarFallback>
              </Avatar>
            </button>
            <div>
              <button
                type="button"
                onClick={() => {
                  const to = post.authorId === currentUserId ? "/social/profile" : `/social/profile/${post.authorId}`;
                  navigate({ to });
                }}
                className="text-sm font-semibold text-foreground leading-tight hover:underline text-left"
              >
                {post.author}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{post.timestamp}</span>
                <span>·</span>
                {post.visibility === "CHANNELS" && post.channelNames.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-primary/80">
                    <Lock className="h-3 w-3" />
                    {post.channelNames.join(", ")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Public
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Three-dot menu */}
          {isOwner && onDeletePost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground"
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">Post options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeletePost(post.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* -------------------------------------------------------------- */}
        {/*  Content                                                        */}
        {/* -------------------------------------------------------------- */}
        {(() => {
          const taskCard = parseTaskCard(post.content);
          if (taskCard) {
            return (
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{taskCard.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">From: {taskCard.workspace}</div>
                  </div>
                </div>
                {taskCard.message && (
                  <p className="mt-2.5 text-[13px] text-foreground whitespace-pre-wrap">
                    {taskCard.message}
                  </p>
                )}
              </div>
            );
          }
          return (
            <>
              {post.content && (
                <p className="whitespace-pre-wrap text-[15px] text-foreground">
                  {post.content}
                </p>
              )}
              {post.mediaUrl && post.mediaType === "IMAGE" && (
                <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">
                  <ImageWithLoader
                    src={post.mediaUrl}
                    alt="Post media"
                    wrapperClassName="mt-2 w-full max-h-96 rounded-lg"
                    className="w-full max-h-96 rounded-lg object-cover border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                </a>
              )}
              {post.mediaUrl && post.mediaType === "VIDEO" && (
                <video
                  src={post.mediaUrl}
                  controls
                  className="mt-2 w-full max-h-96 rounded-lg border border-gray-200 dark:border-gray-700"
                />
              )}
            </>
          );
        })()}

        {/* -------------------------------------------------------------- */}
        {/*  Reaction summary bar                                           */}
        {/* -------------------------------------------------------------- */}
        {(total > 0 || post.commentCount > 0) && (
          <div className="flex items-center justify-between px-1 text-[13px] text-muted-foreground">
            {total > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center -space-x-1">
                  {emojis.map((iconSrc, idx) => (
                    <img
                      key={`${iconSrc}-${idx}`}
                      src={iconSrc}
                      alt=""
                      className="relative inline-block h-[18px] w-[18px] rounded-full border border-white shadow-sm"
                      style={{ zIndex: emojis.length - idx }}
                    />
                  ))}
                </span>
                <span>{total}</span>
              </div>
            ) : (
              <span />
            )}
            {post.commentCount > 0 && (
              <button
                type="button"
                className="hover:underline"
                onClick={() => setShowComments((prev) => !prev)}
              >
                {post.commentCount}{" "}
                {post.commentCount === 1 ? "comment" : "comments"}
              </button>
            )}
          </div>
        )}

        <Separator />

        {/* -------------------------------------------------------------- */}
        {/*  Action bar: React, Comment, Share                              */}
        {/* -------------------------------------------------------------- */}
        <div className="grid grid-cols-3 gap-1">
          {/* React button with hover picker */}
          <ReactionPickerHover
            onReact={handleReaction}
            currentReaction={post.userReaction}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-center gap-2 hover:bg-accent hover:text-foreground ${
                post.userReaction ? "text-blue-500" : "text-muted-foreground"
              }`}
            >
              {post.userReaction ? (
                <img src={reactionIcon(post.userReaction)} alt="" className="h-5 w-5" />
              ) : (
                <span className="text-sm">React</span>
              )}
            </Button>
          </ReactionPickerHover>

          {/* Comment button */}
          <Button
            variant="ghost"
            size="sm"
            className={`w-full justify-center gap-2 hover:bg-accent hover:text-foreground ${
              post.userCommented ? "text-blue-500" : "text-muted-foreground"
            }`}
            onClick={() => setShowComments((prev) => !prev)}
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>

          {/* Share button with dropdown */}
          <DropdownMenu open={showShareMenu} onOpenChange={setShowShareMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-center gap-2 hover:bg-accent hover:text-foreground ${
                  post.userShared ? "text-blue-500" : "text-muted-foreground"
                }`}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleSharePublic}>
                <Globe className="mr-2 h-4 w-4" />
                Share publicly
              </DropdownMenuItem>
              {channels.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Share to channel
                  </div>
                  {channels.map((ch) => {
                    const chId = String(ch.id);
                    const isExpanded = expandedChannelId === chId;
                    return (
                      <div key={ch.id}>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setExpandedChannelId(isExpanded ? null : chId);
                          }}
                        >
                          <span className="mr-2 text-sm">#</span>
                          <span className="flex-1">{ch.name}</span>
                        </DropdownMenuItem>
                        {isExpanded && (
                          <div className="ml-6 space-y-0.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => handleShareToChannel(chId)}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                            >
                              <Rss className="h-3 w-3 text-muted-foreground" />
                              Post in Feed
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareToChannelChat(chId)}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                            >
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              Post in Chat
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* -------------------------------------------------------------- */}
        {/*  Comments section                                               */}
        {/* -------------------------------------------------------------- */}
        {showComments && (
          <>
            <Separator />
            <div className="space-y-4">
              {/* Existing comments */}
              {post.comments.length > 0 && (
                <div className="space-y-3">
                  {post.comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={String(post.id)}
                      currentUserId={currentUserId}
                      currentUserAvatar={currentUserAvatar}
                      currentUserInitials={currentUserInitials}
                      onReaction={onCommentReaction}
                      onReply={(parentId, content) => onComment(String(post.id), content, parentId)}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      replyText={replyText}
                      setReplyText={setReplyText}
                    />
                  ))}
                </div>
              )}

              {/* New comment input */}
              <div className="flex gap-2.5">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={currentUserAvatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>{currentUserInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    className="rounded-full"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim()}
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  CommentItem                                                        */
/* ------------------------------------------------------------------ */

function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserAvatar,
  currentUserInitials,
  onReaction,
  onReply,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  depth = 0,
}: {
  comment: UiComment;
  postId: string;
  currentUserId: string;
  currentUserAvatar?: string;
  currentUserInitials: string;
  onReaction?: (commentId: string, type: SocialReactionType) => void;
  onReply: (parentId: string, content: string) => void;
  replyingTo: { id: string; author: string } | null;
  setReplyingTo: (v: { id: string; author: string } | null) => void;
  replyText: string;
  setReplyText: (v: string) => void;
  depth?: number;
}) {
  const userReaction = comment.reactions.find(
    (r) => String(r.userId) === String(currentUserId),
  )?.type ?? null;

  const handleSubmitReply = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onReply(comment.id, trimmed);
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className={depth > 0 ? "ml-10" : ""}>
      <div className="flex gap-2.5">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.avatar || "/placeholder.svg"} />
          <AvatarFallback>{comment.author[0] ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="relative inline-block max-w-full rounded-lg bg-secondary px-3 py-2 mb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-semibold text-foreground">{comment.author}</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAtMs)}</span>
            </div>
            <p className="text-[13px] text-foreground">{comment.content}</p>
            {/* Reaction emoji badge — bottom-right corner overlapping the edge */}
            {comment.reactions.length > 0 && (
              <div className="absolute -bottom-2.5 -right-1 flex items-center gap-0.5 rounded-full border border-border bg-card px-1.5 py-0.5 shadow-sm">
                {comment.reactions
                  .reduce<Array<{ type: SocialReactionType; count: number }>>((acc, r) => {
                    const existing = acc.find((a) => a.type === r.type);
                    if (existing) existing.count++;
                    else acc.push({ type: r.type, count: 1 });
                    return acc;
                  }, [])
                  .slice(0, 3)
                  .map((r) => (
                    <img key={r.type} src={reactionIcon(r.type)} alt="" className="h-3.5 w-3.5" />
                  ))}
                <span className="text-[10px] text-muted-foreground ml-0.5">
                  {comment.reactions.length}
                </span>
              </div>
            )}
          </div>

          {/* Actions row — like, dislike, reply */}
          <div className="flex items-center gap-1 px-1 text-[11px]">
            {onReaction && (
              <ReactionPickerHover
                onReact={(type) => onReaction(comment.id, type)}
                currentReaction={userReaction}
              >
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors ${
                    userReaction && userReaction !== "SAD" && userReaction !== "ANGRY"
                      ? "text-blue-500"
                      : "text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <ThumbsUp className="h-3 w-3" strokeWidth={1.5} />
                </button>
              </ReactionPickerHover>
            )}
            {onReaction && (
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors ${
                  userReaction === "SAD" || userReaction === "ANGRY"
                    ? "text-blue-500"
                    : "text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                }`}
                onClick={() => onReaction(comment.id, "SAD")}
              >
                <ThumbsDown className="h-3 w-3" strokeWidth={1.5} />
              </button>
            )}
            {depth === 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setReplyingTo({ id: comment.id, author: comment.author })}
              >
                <Reply className="h-3 w-3" strokeWidth={1.5} />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyingTo?.id === comment.id && (
            <div className="mt-2 flex items-center gap-2">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={currentUserAvatar || "/placeholder.svg"} />
                <AvatarFallback className="text-[9px]">{currentUserInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 items-center gap-1.5">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmitReply();
                    if (e.key === "Escape") setReplyingTo(null);
                  }}
                  placeholder={`Reply to ${comment.author}...`}
                  className="h-8 text-xs"
                  autoFocus
                />
                <Button size="sm" className="h-8 w-8 p-0" onClick={handleSubmitReply} disabled={!replyText.trim()}>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              currentUserAvatar={currentUserAvatar}
              currentUserInitials={currentUserInitials}
              onReaction={onReaction}
              onReply={onReply}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
