import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatSocket, type ChatSocketMessage } from "@/hooks/use-chat-socket";
import {
  getChatMessages,
  getNotificationPreferences,
  inviteToChatChannel,
  sendChatMessageWithMedia,
  setNotificationPreference,
  toggleChatReaction,
  type ChatChannel,
  type ChatMessageData,
} from "@/lib/backend-api";
import { ImageWithLoader } from "@/components/ui/image-loader";
import {
  ArrowLeft,
  Bell,
  BellOff,
  ClipboardList,
  CornerDownRight,
  Crown,
  ImagePlus,
  Loader2,
  Mail,
  Send,
  Share2,
  Smile,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getChannelIcon } from "./CreateChannelDialog";

type Props = {
  channel: ChatChannel;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserInitials: string;
  onBack: () => void;
  boardId?: number;
};

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";
}

export default function GroupChat({
  channel,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserInitials,
  onBack,
  boardId,
}: Props) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);

  // Notification mute state for linked workspace
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    getNotificationPreferences()
      .then((prefs) => {
        const pref = prefs.find((p) => p.boardId === boardId);
        setIsMuted(pref?.muted ?? false);
      })
      .catch(() => {});
  }, [boardId]);

  const handleToggleMuteChannel = useCallback(async () => {
    if (!boardId) return;
    await setNotificationPreference(boardId, !isMuted).catch(() => {});
    setIsMuted((prev) => !prev);
    toast.success(isMuted ? "Notifications enabled" : "Notifications muted");
  }, [boardId, isMuted]);

  useEffect(() => {
    if (!emojiPickerMsgId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-emoji-picker]")) {
        setEmojiPickerMsgId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [emojiPickerMsgId]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatImageRef = useRef<HTMLInputElement | null>(null);
  const [pendingChatMedia, setPendingChatMedia] = useState<File | null>(null);
  const [chatMediaPreview, setChatMediaPreview] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { joinChannel, leaveChannel, sendMessage, addListener, isConnected } =
    useChatSocket(currentUserId);

  const channelId = String(channel.id);

  // Load history
  useEffect(() => {
    setIsLoading(true);
    getChatMessages(channelId, 100)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [channelId]);

  // Join WebSocket channel
  useEffect(() => {
    joinChannel(channelId);
    return () => leaveChannel(channelId);
  }, [channelId, joinChannel, leaveChannel]);

  // Listen for new messages
  useEffect(() => {
    return addListener((msg: ChatSocketMessage) => {
      if (
        msg.type === "new_message" &&
        String(msg.channelId) === channelId &&
        msg.message
      ) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(msg.message!.id)))
            return prev;
          return [...prev, msg.message!];
        });
      }
    });
  }, [channelId, addListener]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleSend = async () => {
    const trimmed = draft.trim();
    const media = pendingChatMedia;
    if (!trimmed && !media) return;

    // Clear state immediately
    setDraft("");
    setReplyTo(null);
    setShowEmoji(false);
    setPendingChatMedia(null);
    if (chatMediaPreview) {
      setChatMediaPreview(null);
    }
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (media) {
      // Upload media via REST then the websocket will broadcast
      try {
        await sendChatMessageWithMedia(
          channelId,
          currentUserId,
          media,
          trimmed || undefined,
          replyTo ? String(replyTo.id) : undefined,
        );
      } catch (err) {
        console.error("Failed to send media message:", err);
      }
    } else {
      sendMessage(channelId, trimmed, replyTo ? String(replyTo.id) : undefined);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const msg = messages.find((m) => String(m.id) === messageId);
      const myExisting = (msg?.reactions ?? []).find(
        (r) => r.userId === Number(currentUserId),
      );
      const isSameEmoji = myExisting?.emoji === emoji;

      // If same emoji, toggle off. If different emoji, remove old first then add new.
      if (myExisting && !isSameEmoji) {
        await toggleChatReaction(
          channelId,
          messageId,
          currentUserId,
          myExisting.emoji,
        );
      }
      const { added } = await toggleChatReaction(
        channelId,
        messageId,
        currentUserId,
        emoji,
      );

      setMessages((prev) =>
        prev.map((m) => {
          if (String(m.id) !== messageId) return m;
          // Remove all reactions from this user
          const reactions = (m.reactions ?? []).filter(
            (r) => r.userId !== Number(currentUserId),
          );
          if (added) {
            reactions.push({
              id: 0,
              emoji,
              userId: Number(currentUserId),
              user: { id: Number(currentUserId), firstName: "", lastName: "" },
            });
          }
          return { ...m, reactions };
        }),
      );
    } catch {
      /* ignore */
    }
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setIsInviting(true);
    try {
      const result = await inviteToChatChannel(channelId, email, currentUserId);
      if (result.autoAdded) {
        toast.success(`${email} has been added to the channel`);
      } else if ((result as any).emailSent === false) {
        toast.warning(`Invite created but email could not be sent to ${email}`);
      } else {
        toast.success(`Invite sent to ${email}`);
      }
      setInviteEmail("");
      setShowInvite(false);
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const { Icon: ChannelIcon } = getChannelIcon(channel.icon ?? "hash");

  return (
    <Card className="flex h-[calc(100vh-14rem)] flex-col gap-0 overflow-hidden py-0">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ChannelIcon className="h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground truncate" title={channel.name}>
              {channel.name.length > 25 ? `${channel.name.slice(0, 25)}...` : channel.name}
            </h2>
            <span
              className={`inline-block h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
          </div>
          {channel.description && (
            <p className="text-xs text-muted-foreground truncate">
              {channel.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
            onClick={() => setShowMembers(true)}
          >
            <Users className="h-3.5 w-3.5" />
            {channel.members.length}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground"
            onClick={() => setShowInvite(true)}
            title="Invite by email"
          >
            <Mail className="h-3.5 w-3.5" />
          </Button>
          {boardId && (
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${isMuted ? "text-red-400" : "text-amber-500"}`}
              onClick={handleToggleMuteChannel}
              title={isMuted ? "Unmute notifications" : "Mute notifications"}
            >
              {isMuted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* ---- Messages ---- */}
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-3 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => {
                const isMe = String(msg.userId) === String(currentUserId);
                const name = isMe
                  ? currentUserName
                  : [msg.user?.firstName, msg.user?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    msg.user?.email ||
                    "User";
                const avatar = isMe
                  ? currentUserAvatar
                  : msg.user?.avatarUrl || "";
                const ini = isMe
                  ? currentUserInitials
                  : initials(
                      msg.user?.firstName ?? "",
                      msg.user?.lastName ?? "",
                    );

                const isActivity = msg.content.startsWith("@@activity@@");
                if (isActivity) {
                  const activityText = msg.content.slice("@@activity@@".length);
                  return (
                    <div key={msg.id} className="flex items-start gap-2 py-0.5">
                      <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="text-[7px] bg-muted text-muted-foreground">
                          {ini}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {name}
                          </span>{" "}
                          {activityText}
                        </span>
                        <div className="text-[9px] text-muted-foreground/60">
                          {new Date(msg.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                const isSharedPost = !!(msg as any).sharedPost;

                if (isSharedPost) {
                  const sp = (msg as any).sharedPost;
                  const postAuthor =
                    [sp.post?.user?.firstName, sp.post?.user?.lastName]
                      .filter(Boolean)
                      .join(" ") || "Someone";
                  const source =
                    sp.post?.channels?.length > 0
                      ? `#${sp.post.channels.map((c: any) => c.name).join(", #")}`
                      : "Public";

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="text-[10px]">
                          {ini}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="rounded-xl border border-border bg-card p-3 shadow-sm w-full">
                          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-muted-foreground">
                            <Share2 className="h-3 w-3" />
                            <span className="font-medium">{name}</span>
                            <span>shared a post</span>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/50 p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[12px] font-semibold text-foreground">
                                {postAuthor}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                · from {source}
                              </span>
                            </div>
                            {(() => {
                              const raw = sp.post?.content || msg.content;
                              if (
                                typeof raw === "string" &&
                                raw.startsWith("{")
                              ) {
                                try {
                                  const parsed = JSON.parse(raw);
                                  if (parsed?._type === "task-card") {
                                    return (
                                      <div className="rounded-md bg-background/60 p-2.5 mt-1">
                                        <div className="flex items-start gap-2">
                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                            <ClipboardList className="h-3 w-3 text-primary" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs font-semibold text-foreground">
                                              {parsed.title}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                              From: {parsed.workspace}
                                            </div>
                                          </div>
                                        </div>
                                        {parsed.message && (
                                          <p className="mt-1.5 text-xs text-foreground whitespace-pre-wrap">
                                            {parsed.message}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                } catch {
                                  /* not JSON */
                                }
                              }
                              return (
                                <p className="text-[13px] text-foreground leading-relaxed">
                                  {raw}
                                </p>
                              );
                            })()}
                          </div>
                        </div>
                        <span className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Task card shared as regular message
                if (msg.content.startsWith("{")) {
                  try {
                    const parsed = JSON.parse(msg.content);
                    if (parsed?._type === "task-card") {
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={avatar} />
                            <AvatarFallback className="text-[10px]">
                              {ini}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="rounded-xl border border-border bg-card p-3 shadow-sm w-full">
                              <div className="flex items-center gap-1.5 mb-2 text-[11px] text-muted-foreground">
                                <ClipboardList className="h-3 w-3" />
                                <span className="font-medium">{name}</span>
                                <span>shared a task</span>
                              </div>
                              <div className="rounded-lg border border-border bg-gray-50 dark:bg-muted/50 p-3">
                                <div className="flex items-start gap-2">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                    <ClipboardList className="h-3 w-3 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold text-foreground">
                                      {parsed.title}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                      From: {parsed.workspace}
                                    </div>
                                  </div>
                                </div>
                                {parsed.message && (
                                  <p className="mt-1.5 text-xs text-foreground whitespace-pre-wrap">
                                    {parsed.message}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="mt-0.5 text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  } catch {
                    /* not JSON */
                  }
                }

                const msgId = String(msg.id);
                const isHovered = hoveredMsgId === msgId;
                const reactions = msg.reactions ?? [];
                const replyMsg = msg.replyTo;

                const CHAT_REACTIONS = [
                  "👍",
                  "❤️",
                  "😂",
                  "😮",
                  "😢",
                  "😡",
                  "🎉",
                ];
                const showEmojiPicker = emojiPickerMsgId === msgId;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-center gap-1 ${isMe ? "flex-row-reverse" : ""}`}
                    onMouseEnter={() => setHoveredMsgId(msgId)}
                    onMouseLeave={() => {
                      setHoveredMsgId(null);
                      if (!showEmojiPicker) setEmojiPickerMsgId(null);
                    }}
                  >
                    <Avatar className="h-8 w-8 shrink-0 self-start">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-[10px]">
                        {ini}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message content */}
                    <div
                      className={`max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* Message bubble with reply behind */}
                      <div className="relative">
                        {/* Reply pill behind the main bubble */}
                        {replyMsg && (
                          <div className={`w-fit max-w-[220px] rounded-2xl px-3 py-1.5 pb-4 text-[11px] bg-muted/50 border border-border/30 ${isMe ? "rounded-br-sm ml-auto" : "rounded-bl-sm"}`}>
                            <p className="text-muted-foreground/60 truncate">{replyMsg.content}</p>
                          </div>
                        )}
                        {/* Main chat bubble on top */}
                        <div
                          className={`w-fit rounded-2xl px-3 py-2 text-sm ${replyMsg ? "-mt-3 relative z-10" : ""} ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-tr-sm ml-auto"
                              : "bg-muted text-foreground rounded-tl-sm"
                          }`}
                        >
                          {!isMe && (
                            <p className="mb-0.5 text-[11px] font-semibold text-primary">
                              {name}
                            </p>
                          )}
                          {msg.content}
                          {(msg as any).mediaUrl && (msg as any).mediaType === "IMAGE" && (
                            <a href={(msg as any).mediaUrl} target="_blank" rel="noopener noreferrer">
                              <ImageWithLoader
                                src={(msg as any).mediaUrl}
                                alt="Shared image"
                                wrapperClassName="mt-1.5 max-h-48 rounded-lg"
                                className="max-h-48 rounded-lg object-cover border border-white/20 cursor-pointer hover:opacity-90 transition-opacity"
                                loading="lazy"
                              />
                            </a>
                          )}
                          {(msg as any).mediaUrl && (msg as any).mediaType === "VIDEO" && (
                            <video
                              src={(msg as any).mediaUrl}
                              controls
                              className="mt-1.5 max-h-48 rounded-lg border border-white/20"
                            />
                          )}
                        </div>

                        {/* Emoji picker popup above bubble */}
                        {showEmojiPicker && (
                          <div
                            className={`absolute bottom-full mb-1 z-30 ${isMe ? "right-0" : "left-0"}`}
                            data-emoji-picker
                          >
                            <div className="flex items-center gap-0.5 rounded-full border bg-card px-1.5 py-0.5 shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150">
                              {CHAT_REACTIONS.map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted hover:scale-125 transition-transform text-base"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    void handleReaction(msgId, e);
                                    setEmojiPickerMsgId(null);
                                  }}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reactions display */}
                      {reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(
                            reactions.reduce<Record<string, number>>(
                              (acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                                return acc;
                              },
                              {},
                            ),
                          ).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              type="button"
                              className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] transition-colors ${
                                reactions.some(
                                  (r) =>
                                    r.emoji === emoji &&
                                    r.userId === Number(currentUserId),
                                )
                                  ? "border-primary/40 bg-primary/10"
                                  : "border-border hover:bg-muted"
                              }`}
                              onClick={() => void handleReaction(msgId, emoji)}
                            >
                              <span>{emoji}</span>
                              <span className="text-muted-foreground">
                                {count}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Hover actions beside the chat - emoji + reply buttons */}
                    <div
                      className={`flex items-center gap-0.5 mb-4 self-center transition-all duration-150 ${
                        isHovered
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none"
                      }`}
                    >
                      <button
                        type="button"
                        data-emoji-picker
                        className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setEmojiPickerMsgId(showEmojiPicker ? null : msgId);
                        }}
                        title="React"
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="h-7 w-7 grid place-items-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setReplyTo(msg);
                          textareaRef.current?.focus();
                        }}
                        title="Reply"
                      >
                        <CornerDownRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      {/* ---- Input ---- */}
      <div className="border-t px-4 py-3">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-primary">
                Replying to {replyTo.user.firstName} {replyTo.user.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {replyTo.content}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {/* Media preview */}
        {chatMediaPreview && (
          <div className="flex items-center gap-2 mb-2">
            <div className="relative inline-block">
              <ImageWithLoader src={chatMediaPreview} alt="Preview" wrapperClassName="h-16 w-16 rounded-lg" className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
              <button
                type="button"
                onClick={() => { setPendingChatMedia(null); setChatMediaPreview(null); }}
                className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground truncate">{pendingChatMedia?.name}</span>
          </div>
        )}
        <input
          ref={chatImageRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setPendingChatMedia(file);
            setChatMediaPreview(URL.createObjectURL(file));
            e.target.value = "";
          }}
        />
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                resizeTextarea();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={pendingChatMedia ? "Add a caption..." : `Message #${channel.name}`}
              className="min-h-[40px] max-h-[120px] w-full resize-none rounded-2xl border border-border bg-background py-2.5 pl-4 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
            />
            <div className="absolute right-2 bottom-3 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => chatImageRef.current?.click()}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                title="Upload image"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowEmoji((prev) => !prev)}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                title="Emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
              {showEmoji && (
                <div className="absolute bottom-9 right-0 z-50">
                  <EmojiPicker
                    onSelect={(emoji) => {
                      setDraft((prev) => prev + emoji);
                      resizeTextarea();
                    }}
                    onClose={() => setShowEmoji(false)}
                  />
                </div>
              )}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => void handleSend()}
            disabled={!draft.trim() && !pendingChatMedia}
            className="h-10 rounded-full mb-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ---- Members Dialog ---- */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Members ({channel.members.length})</DialogTitle>
            <DialogDescription>People in this channel</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 space-y-2 overflow-y-auto py-2">
            {channel.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.user.avatarUrl ?? ""} />
                  <AvatarFallback className="text-xs">
                    {initials(member.user.firstName, member.user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.user.firstName} {member.user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.user.email}
                  </p>
                </div>
                {member.role === "ADMIN" && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Crown className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMembers(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowMembers(false);
                setShowInvite(true);
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Invite Dialog ---- */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite to #{channel.name}</DialogTitle>
            <DialogDescription>
              Send an email invite to add someone to this channel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isInviting) void handleInvite();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleInvite()}
              disabled={!inviteEmail.trim() || isInviting}
            >
              {isInviting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
