import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textArea";
import type {
  TaskAttachment,
  TaskComment as TaskCommentType,
  Workspace,
  WorkspaceMember,
} from "@/lib/backend-api";
import {
  analyzeImageForChecklist,
  createTaskComment,
  deleteTaskAttachment,
  deleteTaskComment,
  getTaskAttachments,
  getTaskComments,
  uploadTaskAttachment,
} from "@/lib/backend-api";
import githubIcon from "@/assets/github.svg";
import trelloIcon from "@/assets/trello.svg";
import GitHubPRPicker from "./GitHubPRPicker";
import TrelloCardPicker from "./TrelloCardPicker";
import {
  Activity,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  ExternalLink,
  Flag,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  Paperclip,
  Plus,
  Save,
  Send,
  Share2,
  Tag,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ColumnColorMap,
  TaskEditorState,
  TaskLabel,
} from "../types/workspace.types";
import { isLightColor, tintHex, toPastelBackground } from "../utils/color";
import { percentDone } from "../utils/task-meta";

/* ------------------------------------------------------------------ */
/*  Inline-edit input styling (borderless, shows border on hover/focus) */
/* ------------------------------------------------------------------ */
const INLINE_INPUT =
  "border-border/30 bg-transparent hover:border-border focus:border-border transition-colors";
const INLINE_TEXTAREA =
  "border-border/30 bg-transparent hover:border-border focus:border-border transition-colors resize-none";
const INLINE_SELECT =
  "border-border/30 bg-transparent hover:border-border focus-within:border-border transition-colors";

/* ------------------------------------------------------------------ */
/*  Activity helpers                                                   */
/* ------------------------------------------------------------------ */
const ACTIVITY_PREFIX = "@@activity@@";
const CALENDAR_PREFIX = "@@calendar@@";

function isActivityComment(content: string) {
  return content.startsWith(ACTIVITY_PREFIX);
}

function isCalendarComment(content: string) {
  return content.startsWith(CALENDAR_PREFIX) || content.startsWith("📅 ");
}

function parseCalendarComment(content: string) {
  if (content.startsWith(CALENDAR_PREFIX)) {
    const data = content.slice(CALENDAR_PREFIX.length);
    const [title, time, location, meetLink] = data.split("||");
    return { title: title || "", time: time || "", location: location || "", meetLink: meetLink || "" };
  }
  // Legacy emoji format: 📅 title\n🕐 time\n📍 location\n🔗 meetLink
  const lines = content.split("\n");
  const title = (lines[0] || "").replace(/^📅\s*/, "").replace(/^Calendar Event:\s*/, "");
  const time = (lines.find((l) => l.startsWith("🕐")) || "").replace(/^🕐\s*/, "");
  const location = (lines.find((l) => l.startsWith("📍")) || "").replace(/^📍\s*/, "");
  const meetLink = (lines.find((l) => l.startsWith("🔗")) || "").replace(/^🔗\s*/, "");
  return { title, time, location, meetLink };
}

function parseActivityContent(content: string): React.ReactNode {
  const text = content.slice(ACTIVITY_PREFIX.length);

  // Split by markdown links [text](url) and bold **text**
  const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    // Markdown link: [text](url)
    const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
        >
          {linkMatch[1]}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      );
    }
    // Bold: **text**
    const boldMatch = part.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch) {
      return <strong key={i} className="font-semibold text-foreground/90">{boldMatch[1]}</strong>;
    }
    // Inline code: `text`
    const codeMatch = part.match(/^`(.+?)`$/);
    if (codeMatch) {
      return <code key={i} className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">{codeMatch[1]}</code>;
    }
    return part;
  });
}

/* ------------------------------------------------------------------ */
/*  ChecklistPicker — select which AI items to add                     */
/* ------------------------------------------------------------------ */

type ChecklistPickerItem = { id: string; text: string; done: boolean };

function ChecklistPicker({
  items,
  onApply,
  onDismiss,
}: {
  items: ChecklistPickerItem[];
  onApply: (selected: ChecklistPickerItem[]) => void;
  onDismiss: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));

  const toggleItem = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  return (
    <div className="mt-2 rounded-md border border-border bg-background p-2 space-y-1.5">
      {/* Select all */}
      <label className="flex items-center gap-2 text-[11px] font-medium text-foreground cursor-pointer pb-1 border-b border-border/50">
        <input
          type="checkbox"
          className="h-3 w-3 rounded accent-indigo-600"
          checked={selected.size === items.length}
          onChange={toggleAll}
        />
        Select all ({items.length})
      </label>
      {/* Items */}
      <div className="max-h-36 overflow-y-auto space-y-0.5">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2 rounded px-1 py-0.5 text-[11px] text-foreground hover:bg-muted/50 cursor-pointer"
          >
            <input
              type="checkbox"
              className="h-3 w-3 rounded accent-indigo-600"
              checked={selected.has(item.id)}
              onChange={() => toggleItem(item.id)}
            />
            <span className="flex-1 min-w-0 truncate" title={item.text}>{item.text}</span>
          </label>
        ))}
      </div>
      {/* Actions */}
      <div className="flex gap-1.5 pt-1 border-t border-border/50">
        <Button
          size="sm"
          className="h-6 text-[10px] gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={selected.size === 0}
          onClick={() => onApply(items.filter((i) => selected.has(i.id)))}
        >
          <CheckCircle2 className="h-3 w-3" />
          Apply ({selected.size})
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] gap-1"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TaskChatSection (Comments & Activity)                              */
/* ------------------------------------------------------------------ */
function TaskChatSection({
  workspaceId,
  taskId,
  taskTitle,
  currentUserId,
  refreshKey = 0,
  githubEnabled = false,
  analyzeFile,
  onAnalyzeFileConsumed,
  onChecklistSuggestion,
}: {
  workspaceId: string;
  taskId: string;
  taskTitle?: string;
  currentUserId: string;
  refreshKey?: number;
  githubEnabled?: boolean;
  analyzeFile?: File | null;
  onAnalyzeFileConsumed?: () => void;
  onChecklistSuggestion?: (items: Array<{ id: string; text: string; done: boolean }>) => void;
}) {
  const [comments, setComments] = useState<TaskCommentType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pastedImage, setPastedImage] = useState<File | null>(null);
  const [pastedPreview, setPastedPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPRPicker, setShowPRPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    getTaskComments(workspaceId, taskId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => {
        setIsLoading(false);
        isInitialLoad.current = false;
      });
  }, [workspaceId, taskId, refreshKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Auto-trigger analysis when an attachment's "Analyze" button is clicked
  useEffect(() => {
    if (analyzeFile && !isAnalyzing) {
      void handleAnalyzeImage(analyzeFile);
      onAnalyzeFileConsumed?.();
    }
  }, [analyzeFile]);

  const clearPastedImage = () => {
    setPastedImage(null);
    if (pastedPreview) URL.revokeObjectURL(pastedPreview);
    setPastedPreview(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setPastedImage(file);
        setPastedPreview(URL.createObjectURL(file));
        return;
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setPastedImage(file);
    setPastedPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  /** Send image to Flowmo to generate checklist items for this task. */
  const handleAnalyzeImage = async (imageFile: File) => {
    setIsAnalyzing(true);
    try {
      const activityComment = await createTaskComment(workspaceId, taskId, {
        userId: currentUserId,
        content: `${ACTIVITY_PREFIX}Analyzing image with Flowmo to generate checklist...`,
      });
      setComments((prev) => [...prev, activityComment]);

      // Dedicated checklist endpoint — returns { items: string[], summary: string }
      const { items, summary } = await analyzeImageForChecklist(
        imageFile,
        taskTitle,
      );

      if (items.length > 0) {
        const checklistItems = items.map((text) => ({
          id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          done: false,
        }));

        const shortSummary = summary || "Flowmo generated a checklist from the image.";
        const suggestionComment = await createTaskComment(workspaceId, taskId, {
          userId: currentUserId,
          content: `${ACTIVITY_PREFIX}${shortSummary} (${items.length} items)`,
        });
        setComments((prev) => [...prev, { ...suggestionComment, _pendingChecklist: checklistItems } as any]);
      } else {
        const fallbackComment = await createTaskComment(workspaceId, taskId, {
          userId: currentUserId,
          content: `${ACTIVITY_PREFIX}Flowmo analysis: ${summary || "Could not extract checklist items from this image."}`,
        });
        setComments((prev) => [...prev, fallbackComment]);
      }

      clearPastedImage();
    } catch (err) {
      const errComment = await createTaskComment(workspaceId, taskId, {
        userId: currentUserId,
        content: `${ACTIVITY_PREFIX}Failed to analyze image: ${err instanceof Error ? err.message : "Unknown error"}`,
      }).catch(() => null);
      if (errComment) setComments((prev) => [...prev, errComment]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /** Upload image as attachment + post comment */
  const handleSendWithImage = async () => {
    if (!pastedImage || isSending) return;
    setIsSending(true);
    try {
      const attachment = await uploadTaskAttachment(workspaceId, taskId, pastedImage, currentUserId);
      const text = newMessage.trim()
        ? `${newMessage.trim()}\n[Attached: ${attachment.filename}]`
        : `[Attached: ${attachment.filename}]`;
      const comment = await createTaskComment(workspaceId, taskId, {
        userId: currentUserId,
        content: text,
      });
      setComments((prev) => [...prev, comment]);
      setNewMessage("");
      clearPastedImage();
    } catch { /* ignore */ }
    finally { setIsSending(false); }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const comment = await createTaskComment(workspaceId, taskId, {
        userId: currentUserId,
        content: newMessage.trim(),
      });
      setComments((prev) => [...prev, comment]);
      setNewMessage("");
    } catch {
      // silently fail
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteTaskComment(
        workspaceId,
        taskId,
        String(commentId),
        currentUserId,
      );
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground/70 shrink-0">
        <MessageCircle className="h-3.5 w-3.5" />
        Comments & Activity
      </div>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1 py-2"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No activity yet.
          </div>
        ) : (
          comments.map((comment) => {
            if (isCalendarComment(comment.content)) {
              const cal = parseCalendarComment(comment.content);
              return (
                <div key={comment.id} className="flex justify-center py-1">
                  <div className="w-full max-w-sm rounded-lg border bg-muted/40 px-3 py-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-xs font-medium text-foreground">{cal.title}</span>
                    </div>
                    {cal.time && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{cal.time}</span>
                      </div>
                    )}
                    {cal.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{cal.location}</span>
                      </div>
                    )}
                    {cal.meetLink && (
                      <a href={cal.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        Join Meeting
                      </a>
                    )}
                    <div className="text-[9px] text-muted-foreground/60">
                      {comment.user.firstName} {comment.user.lastName} · {new Date(comment.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            }

            if (isActivityComment(comment.content)) {
              const hasPendingChecklist = !!(comment as any)._pendingChecklist;
              return (
                <div key={comment.id} className="flex items-start gap-2 py-1">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                    {hasPendingChecklist
                      ? <Bot className="h-2.5 w-2.5 text-indigo-500" />
                      : comment.content.includes("PR #") || comment.content.includes("View on GitHub")
                        ? <img src={githubIcon} alt="" className="h-2.5 w-2.5 dark:invert" />
                        : <Activity className="h-2.5 w-2.5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>{" "}
                      <span className="whitespace-pre-wrap">{parseActivityContent(comment.content)}</span>
                    </span>
                    <div className="text-[9px] text-muted-foreground/60">
                      {new Date(comment.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {/* Selectable checklist items from AI suggestion */}
                    {hasPendingChecklist && onChecklistSuggestion && (
                      <ChecklistPicker
                        items={(comment as any)._pendingChecklist}
                        onApply={(selected) => {
                          onChecklistSuggestion(selected);
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === comment.id ? { ...c, _pendingChecklist: undefined } as any : c,
                            ),
                          );
                        }}
                        onDismiss={() =>
                          setComments((prev) =>
                            prev.map((c) =>
                              c.id === comment.id ? { ...c, _pendingChecklist: undefined } as any : c,
                            ),
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              );
            }
            const isOwn = String(comment.userId) === currentUserId;
            return (
              <div
                key={comment.id}
                className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={comment.user.avatarUrl || undefined} />
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                    {comment.user.firstName?.[0]}
                    {comment.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-medium text-foreground">
                      {comment.user.firstName} {comment.user.lastName}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`inline-block rounded-lg px-3 py-1.5 text-xs whitespace-pre-wrap ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {comment.content}
                  </div>
                  {/* Selectable checklist items from AI suggestion */}
                  {(comment as any)._pendingChecklist && onChecklistSuggestion && (
                    <ChecklistPicker
                      items={(comment as any)._pendingChecklist}
                      onApply={(selected) => {
                        onChecklistSuggestion(selected);
                        setComments((prev) =>
                          prev.map((c) =>
                            c.id === comment.id ? { ...c, _pendingChecklist: undefined } as any : c,
                          ),
                        );
                      }}
                      onDismiss={() =>
                        setComments((prev) =>
                          prev.map((c) =>
                            c.id === comment.id ? { ...c, _pendingChecklist: undefined } as any : c,
                          ),
                        )
                      }
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Analyzing indicator */}
      {isAnalyzing && (
        <div className="shrink-0 flex items-center gap-2 px-1 py-1.5 border-t text-xs text-indigo-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Flowmo is analyzing the image...
        </div>
      )}

      {/* Image preview thumbnail */}
      {pastedPreview && (
        <div className="shrink-0 flex items-center gap-2 px-1 pt-1.5">
          <div className="relative">
            <img src={pastedPreview} alt="Pasted" className="h-10 w-10 rounded object-cover border" />
            <button
              type="button"
              onClick={clearPastedImage}
              className="absolute -top-1 -right-1 h-3.5 w-3.5 grid place-items-center rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <X className="h-2 w-2" />
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground truncate">{pastedImage?.name || "Pasted image"}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      <div className="shrink-0 relative flex items-end gap-1 mt-2">
        <div className="relative flex-1 min-w-0">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (pastedImage) {
                  void handleSendWithImage();
                } else {
                  void handleSend();
                }
              }
            }}
            onPaste={handlePaste}
            placeholder="Add a comment or paste an image..."
            className="flex-1 h-8 text-xs pl-9"
          />
          {/* Image upload icon inside input */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            title="Attach image"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
        </div>
        {/* Flowmo analyze — only visible when image is attached */}
        {pastedImage && (
          <button
            type="button"
            className="h-8 w-8 shrink-0 grid place-items-center rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
            disabled={isAnalyzing}
            onClick={() => { if (pastedImage) void handleAnalyzeImage(pastedImage); }}
            title="Flowmo will analyze this image to create a checklist"
          >
            <Bot className="h-4 w-4" />
          </button>
        )}
        {/* GitHub PR picker button — only visible when workspace has GitHub enabled */}
        {githubEnabled && (
          <button
            type="button"
            className={`h-8 w-8 shrink-0 grid place-items-center rounded-full transition-colors cursor-pointer ${
              showPRPicker
                ? "text-purple-600 bg-purple-50 dark:bg-purple-950/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            onClick={() => setShowPRPicker((prev) => !prev)}
            title="Link GitHub PR"
          >
            <img src={githubIcon} alt="" className="h-4 w-4 dark:invert" />
          </button>
        )}
        {/* Send button — sends comment (with image as attachment if present) */}
        <Button
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => {
            if (pastedImage) {
              void handleSendWithImage();
            } else {
              void handleSend();
            }
          }}
          disabled={(!newMessage.trim() && !pastedImage) || isSending || isAnalyzing}
          title="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>

        {/* GitHub PR Picker popup */}
        {githubEnabled && showPRPicker && (
          <GitHubPRPicker
            workspaceId={workspaceId}
            taskId={taskId}
            onClose={() => setShowPRPicker(false)}
            onCommentAdded={(comment) => setComments((prev) => [...prev, comment])}
          />
        )}
      </div>
    </div>
  );
}

/** Post an activity entry as a special comment */
export function postTaskActivity(
  workspaceId: string,
  taskId: string,
  userId: string,
  message: string,
) {
  return createTaskComment(workspaceId, taskId, {
    userId,
    content: `${ACTIVITY_PREFIX}${message}`,
  });
}

/* ------------------------------------------------------------------ */
/*  Inline-edit field components                                       */
/* ------------------------------------------------------------------ */

function InlineTitleDescription({
  editor,
  setEditor,
  trelloEnabled = false,
  trelloBoardId = null,
  currentUserId,
}: {
  editor: TaskEditorState;
  setEditor: React.Dispatch<React.SetStateAction<TaskEditorState | null>>;
  trelloEnabled?: boolean;
  trelloBoardId?: string | null;
  currentUserId?: string;
}) {
  const [editingTitle, setEditingTitle] = useState(editor.mode === "create");
  const [editingDesc, setEditingDesc] = useState(false);
  const [showTrelloPicker, setShowTrelloPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingTitle && inputRef.current) inputRef.current.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (editingDesc && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editingDesc]);

  return (
    <div className="space-y-1">
      {/* Replicate from a Trello card — only on create when the workspace has
          Trello enabled. Prefills title + description from the selected card. */}
      {editor.mode === "create" && trelloEnabled && currentUserId && (
        <div className="relative flex justify-end">
          <button
            type="button"
            onClick={() => setShowTrelloPicker((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              showTrelloPicker
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Replicate a Trello card"
          >
            <img src={trelloIcon} alt="" className="h-3.5 w-3.5 dark:invert" />
            Replicate from Trello
          </button>
          {showTrelloPicker && (
            <TrelloCardPicker
              userId={currentUserId}
              boardId={trelloBoardId}
              onClose={() => setShowTrelloPicker(false)}
              onSelect={(card) => {
                setEditor((prev) =>
                  prev
                    ? {
                        ...prev,
                        title: card.name,
                        description: card.description || prev.description,
                      }
                    : prev,
                );
                setShowTrelloPicker(false);
              }}
            />
          )}
        </div>
      )}
      {/* Title */}
      <Label className="text-muted-foreground text-xs">Title</Label>
      {editingTitle || editor.mode === "create" ? (
        <Input
          ref={inputRef}
          value={editor.title}
          onChange={(e) =>
            setEditor((prev) =>
              prev ? { ...prev, title: e.target.value } : prev,
            )
          }
          onBlur={() => setEditingTitle(false)}
          placeholder="Task title"
          className={`${INLINE_INPUT} text-card-foreground font-medium`}
        />
      ) : (
        <div
          onClick={() => setEditingTitle(true)}
          className="cursor-text rounded-md px-3 py-1.5 text-sm font-medium text-card-foreground hover:bg-muted/50 transition-colors"
        >
          {editor.title || (
            <span className="text-muted-foreground font-normal">Untitled</span>
          )}
        </div>
      )}

      {/* Description (right below title) */}
      <Label className="text-muted-foreground text-xs">Description</Label>
      {editingDesc ? (
        <Textarea
          ref={textareaRef}
          value={editor.description}
          onChange={(e) =>
            setEditor((prev) =>
              prev ? { ...prev, description: e.target.value } : prev,
            )
          }
          onBlur={() => setEditingDesc(false)}
          placeholder="Type notes here"
          className={`min-h-16 ${INLINE_TEXTAREA} text-card-foreground text-xs placeholder:text-muted-foreground/50`}
        />
      ) : (
        <div
          onClick={() => setEditingDesc(true)}
          className="cursor-text rounded-md px-3 py-1 text-xs text-card-foreground whitespace-pre-wrap leading-relaxed hover:bg-muted/50 transition-colors"
        >
          {editor.description || (
            <span className="text-muted-foreground/50">Type notes here</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Props & main component                                            */
/* ------------------------------------------------------------------ */
export interface TaskEditorDialogProps {
  editor: TaskEditorState | null;
  setEditor: React.Dispatch<React.SetStateAction<TaskEditorState | null>>;
  columns: NonNullable<Workspace["columns"]>;
  columnColors?: ColumnColorMap;
  labelCatalog: TaskLabel[];
  isSavingEditor: boolean;
  isDeletingTaskId: string | null;
  onSave: () => void;
  onDelete: (taskId: string) => void;
  onShare?: (taskId: string, title: string) => void;
  workspaceId?: string;
  currentUserId?: string;
  members?: WorkspaceMember[];
  /** Snapshot of the editor when it was first opened, for dirty detection */
  editorSnapshot?: TaskEditorState | null;
  githubEnabled?: boolean;
  trelloEnabled?: boolean;
  trelloBoardId?: string | null;
}

export function TaskEditorDialog({
  editor,
  setEditor,
  columns,
  columnColors = {},
  labelCatalog,
  isSavingEditor,
  isDeletingTaskId,
  onSave,
  onDelete,
  onShare,
  workspaceId,
  currentUserId,
  members = [],
  editorSnapshot,
  githubEnabled = false,
  trelloEnabled = false,
  trelloBoardId = null,
}: TaskEditorDialogProps) {
  const bucketColor = editor
    ? columnColors[editor.columnId] || "#94a3b8"
    : "#94a3b8";
  const headerTextDark = isLightColor(bucketColor, 0.14);
  const showChat = !!(workspaceId && currentUserId && editor?.taskId);

  // Refresh comments after save completes (isSavingEditor: true -> false)
  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const prevSavingRef = useRef(false);
  useEffect(() => {
    if (prevSavingRef.current && !isSavingEditor) {
      setChatRefreshKey((k) => k + 1);
    }
    prevSavingRef.current = isSavingEditor;
  }, [isSavingEditor]);

  // S3 Attachments
  const [s3Attachments, setS3Attachments] = useState<TaskAttachment[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [pendingAnalyzeFile, setPendingAnalyzeFile] = useState<File | null>(null);

  useEffect(() => {
    if (!workspaceId || !editor?.taskId || editor.mode === "create") {
      setS3Attachments([]);
      return;
    }
    getTaskAttachments(workspaceId, editor.taskId)
      .then(setS3Attachments)
      .catch(() => setS3Attachments([]));
  }, [workspaceId, editor?.taskId, editor?.mode]);

  const handleFileUpload = async (files: FileList) => {
    if (!workspaceId || !editor?.taskId) return;
    setIsUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const attachment = await uploadTaskAttachment(
          workspaceId,
          editor.taskId,
          file,
          currentUserId,
        );
        setS3Attachments((prev) => [attachment, ...prev]);
      }
    } catch (err) {
      console.error("Failed to upload attachment:", err);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!workspaceId || !editor?.taskId) return;
    try {
      await deleteTaskAttachment(workspaceId, editor.taskId, String(attachmentId));
      setS3Attachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error("Failed to delete attachment:", err);
    }
  };

  // Dirty detection: compare current editor to snapshot
  const isDirty = useMemo(() => {
    if (!editor || !editorSnapshot) return false;
    if (editor.mode === "create") return true; // always show save for create
    return (
      editor.title !== editorSnapshot.title ||
      editor.description !== editorSnapshot.description ||
      editor.columnId !== editorSnapshot.columnId ||
      editor.priority !== editorSnapshot.priority ||
      JSON.stringify(editor.assigneeIds) !==
        JSON.stringify(editorSnapshot.assigneeIds) ||
      editor.startDate !== editorSnapshot.startDate ||
      editor.dueDate !== editorSnapshot.dueDate ||
      editor.repeat !== editorSnapshot.repeat ||
      editor.notes !== editorSnapshot.notes ||
      JSON.stringify(editor.labels) !== JSON.stringify(editorSnapshot.labels) ||
      JSON.stringify(editor.checklist) !==
        JSON.stringify(editorSnapshot.checklist) ||
      JSON.stringify(editor.attachments) !==
        JSON.stringify(editorSnapshot.attachments)
    );
  }, [editor, editorSnapshot]);

  // Auto-save: debounce save for edit mode when dirty
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const editorRef = useRef(editor);
  editorRef.current = editor;

  useEffect(() => {
    const ed = editorRef.current;
    if (!isDirty || !ed || ed.mode === "create" || !ed.title.trim() || isSavingEditor) {
      return;
    }

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      void onSaveRef.current();
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 800);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, isSavingEditor]);

  return (
    <Dialog
      open={Boolean(editor)}
      onOpenChange={(open) => !open && setEditor(null)}
    >
      <DialogContent
        showCloseButton={false}
        className={`border-0 bg-card text-card-foreground overflow-hidden p-0 gap-0 w-[95vw] max-w-[95vw] max-h-[90vh] ${showChat ? "sm:max-w-4xl" : "sm:max-w-2xl"}`}
      >
        {editor && (
          <>
            {/* Colored header */}
            <div
              className="flex items-center gap-2.5 px-4 py-2"
              style={{
                backgroundColor: tintHex(bucketColor, 0.08, "black"),
              }}
            >
              {editor.mode !== "create" && (
                <CircularProgress
                  value={percentDone(editor.checklist)}
                  size={28}
                  strokeWidth={3}
                  trackClassName="text-white/25"
                  progressClassName="text-white"
                  labelClassName={`text-[7px] font-semibold ${headerTextDark ? "!text-gray-800" : "!text-white"}`}
                />
              )}
              {editor.mode !== "create" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-2.5 py-0.5 text-xs font-medium transition-colors hover:bg-white/30"
                      style={{ color: headerTextDark ? "#1e293b" : "#ffffff" }}
                    >
                      {columns.find((c) => String(c.id) === editor.columnId)
                        ?.name || "Unknown"}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[160px]">
                    {columns.map((column) => {
                      const colId = String(column.id);
                      const isActive = colId === editor.columnId;
                      return (
                        <button
                          key={colId}
                          type="button"
                          disabled={isActive}
                          onClick={() => {
                            setEditor((prev) =>
                              prev ? { ...prev, columnId: colId } : prev,
                            );
                          }}
                          className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "bg-muted font-medium text-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: columnColors[colId] || "#94a3b8",
                            }}
                          />
                          {column.name}
                        </button>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <DialogHeader className="p-0 space-y-0 min-w-0 flex-1">
                <DialogTitle
                  className="text-sm font-semibold truncate"
                  style={{ color: headerTextDark ? "#1e293b" : "#ffffff" }}
                >
                  {editor.mode === "create"
                    ? "Create Task"
                    : editor.title || "Untitled"}
                </DialogTitle>
              </DialogHeader>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100"
                style={{ color: headerTextDark ? "#1e293b" : "#ffffff" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Two-panel body */}
            <div className={`flex flex-col md:flex-row ${showChat ? "divide-y md:divide-y-0 md:divide-x divide-border" : ""}`}>
              {/* Left: Form panel */}
              <div
                className={`px-2 py-3 md:px-3 md:py-4 ${showChat ? "flex-1 min-w-0" : "w-full"}`}
              >
                <div className="space-y-4 overflow-y-auto max-h-[55vh] md:max-h-[75vh] px-1 py-1 md:px-3">
                  {/* Title + Description - inline edit */}
                  <InlineTitleDescription
                    editor={editor}
                    setEditor={setEditor}
                    trelloEnabled={trelloEnabled}
                    trelloBoardId={trelloBoardId}
                    currentUserId={currentUserId}
                  />

                  {/* Priority */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      Priority
                    </Label>
                    <Select
                      value={editor.priority}
                      onValueChange={(value: "low" | "medium" | "high") =>
                        setEditor((prev) =>
                          prev ? { ...prev, priority: value } : prev,
                        )
                      }
                    >
                      <SelectTrigger
                        className={`${INLINE_SELECT} text-card-foreground w-fit gap-2`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <span className="inline-flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-gray-400 fill-gray-400" />{" "}
                            Low
                          </span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="inline-flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />{" "}
                            Medium
                          </span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="inline-flex items-center gap-2">
                            <Flag className="h-3.5 w-3.5 text-red-500 fill-red-500" />{" "}
                            High
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assignee (multi) */}
                  <div className="space-y-1">
                    <Label className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                      <User className="h-3 w-3" /> Assignee
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="group flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-muted/50"
                        >
                          {editor.assigneeIds.length === 0 ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
                              <UserPlus className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <>
                              <div className="flex -space-x-2">
                                {editor.assigneeIds.slice(0, 3).map((id) => {
                                  const m = members.find(
                                    (mb) => String(mb.userId) === id,
                                  );
                                  return m ? (
                                    <Avatar
                                      key={id}
                                      className="h-6 w-6 border-2 border-card"
                                    >
                                      <AvatarImage
                                        src={m.user.avatarUrl || undefined}
                                      />
                                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                        {m.user.firstName?.[0]}
                                        {m.user.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : null;
                                })}
                                {editor.assigneeIds.length > 3 && (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[8px] font-medium">
                                    +{editor.assigneeIds.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-card-foreground">
                                {(() => {
                                  const first = members.find(
                                    (mb) =>
                                      String(mb.userId) ===
                                      editor.assigneeIds[0],
                                  );
                                  if (!first) return "";
                                  const name = `${first.user.firstName} ${first.user.lastName}`;
                                  return editor.assigneeIds.length > 1
                                    ? `${name} +${editor.assigneeIds.length - 1}`
                                    : name;
                                })()}
                              </span>
                            </>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="min-w-[200px]"
                      >
                        {members.map((m) => {
                          const id = String(m.userId);
                          const isSelected = editor.assigneeIds.includes(id);
                          return (
                            <button
                              key={m.userId}
                              type="button"
                              onClick={() =>
                                setEditor((prev) => {
                                  if (!prev) return prev;
                                  const ids = isSelected
                                    ? prev.assigneeIds.filter((i) => i !== id)
                                    : [...prev.assigneeIds, id];
                                  return { ...prev, assigneeIds: ids };
                                })
                              }
                              className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                                isSelected
                                  ? "bg-primary/10 font-medium text-foreground"
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={m.user.avatarUrl || undefined}
                                />
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {m.user.firstName?.[0]}
                                  {m.user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              {m.user.firstName} {m.user.lastName}
                              {isSelected && (
                                <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary" />
                              )}
                            </button>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Dates + Repeat */}
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" /> Start date
                      </Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex h-9 w-full items-center gap-2 rounded-md border border-transparent bg-transparent px-3 text-sm transition-colors hover:border-border text-card-foreground"
                          >
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {editor.startDate ? (
                              new Date(editor.startDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            ) : (
                              <span className="text-muted-foreground">
                                Not set
                              </span>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-auto p-0"
                        >
                          <CalendarWidget
                            mode="single"
                            selected={
                              editor.startDate
                                ? new Date(editor.startDate)
                                : undefined
                            }
                            onSelect={(date) =>
                              setEditor((prev) => {
                                if (!prev) return prev;
                                if (!date) return { ...prev, startDate: "" };
                                const yyyy = date.getFullYear();
                                const mm = String(date.getMonth() + 1).padStart(
                                  2,
                                  "0",
                                );
                                const dd = String(date.getDate()).padStart(
                                  2,
                                  "0",
                                );
                                return {
                                  ...prev,
                                  startDate: `${yyyy}-${mm}-${dd}`,
                                };
                              })
                            }
                            captionLayout="dropdown"
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-1">
                      <Label className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="h-3 w-3" /> Due date
                      </Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={`flex h-9 w-full items-center gap-2 rounded-md border border-transparent bg-transparent px-3 text-sm transition-colors hover:border-border ${
                              editor.dueDate &&
                              new Date(editor.dueDate) < new Date()
                                ? "text-red-600 font-medium"
                                : "text-card-foreground"
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {editor.dueDate ? (
                              new Date(editor.dueDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            ) : (
                              <span className="text-muted-foreground">
                                Not set
                              </span>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-auto p-0"
                        >
                          <CalendarWidget
                            mode="single"
                            selected={
                              editor.dueDate
                                ? new Date(editor.dueDate)
                                : undefined
                            }
                            onSelect={(date) =>
                              setEditor((prev) => {
                                if (!prev) return prev;
                                if (!date) return { ...prev, dueDate: "" };
                                const yyyy = date.getFullYear();
                                const mm = String(date.getMonth() + 1).padStart(
                                  2,
                                  "0",
                                );
                                const dd = String(date.getDate()).padStart(
                                  2,
                                  "0",
                                );
                                return {
                                  ...prev,
                                  dueDate: `${yyyy}-${mm}-${dd}`,
                                };
                              })
                            }
                            captionLayout="dropdown"
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        Repeat
                      </Label>
                      <Select
                        value={editor.repeat}
                        onValueChange={(value) =>
                          setEditor((prev) =>
                            prev ? { ...prev, repeat: value } : prev,
                          )
                        }
                      >
                        <SelectTrigger
                          className={`${INLINE_SELECT} text-card-foreground`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Does not repeat</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="space-y-1">
                    <Label className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                      <Tag className="h-3 w-3" /> Labels
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={editor.newLabelName}
                          onChange={(event) =>
                            setEditor((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    newLabelName: event.target.value,
                                    selectedExistingLabel: "",
                                  }
                                : prev,
                            )
                          }
                          onFocus={() =>
                            setEditor((prev) =>
                              prev
                                ? { ...prev, _labelDropdownOpen: true }
                                : prev,
                            )
                          }
                          onBlur={() =>
                            setTimeout(
                              () =>
                                setEditor((prev) =>
                                  prev
                                    ? { ...prev, _labelDropdownOpen: false }
                                    : prev,
                                ),
                              150,
                            )
                          }
                          placeholder="Type or select a label"
                          className={`${INLINE_INPUT} text-card-foreground placeholder:text-muted-foreground/50`}
                        />
                        {(() => {
                          const filtered = editor._labelDropdownOpen
                            ? labelCatalog.filter((label) =>
                                label.name
                                  .toLowerCase()
                                  .includes(
                                    (editor.newLabelName || "").toLowerCase(),
                                  ),
                              )
                            : [];
                          return filtered.length > 0 ? (
                            <div className="absolute z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                              {filtered.map((label) => (
                                <button
                                  key={`${label.name}-${label.color}`}
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() =>
                                    setEditor((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            newLabelName: label.name,
                                            newLabelColor: label.color,
                                            selectedExistingLabel: label.name,
                                            _labelDropdownOpen: false,
                                          }
                                        : prev,
                                    )
                                  }
                                >
                                  <span
                                    className="inline-block h-3 w-3 rounded-full"
                                    style={{ backgroundColor: label.color }}
                                  />
                                  {label.name}
                                </button>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                        disabled={!editor.newLabelName.trim()}
                        onClick={() =>
                          setEditor((prev) => {
                            if (!prev || !prev.newLabelName.trim()) return prev;

                            let nextLabel: TaskLabel | null = null;

                            if (prev.selectedExistingLabel) {
                              const existing = labelCatalog.find(
                                (label) =>
                                  label.name.toLowerCase() ===
                                  prev.selectedExistingLabel.toLowerCase(),
                              );
                              if (existing) {
                                nextLabel = existing;
                              }
                            }

                            if (!nextLabel && prev.newLabelName.trim()) {
                              nextLabel = {
                                name: prev.newLabelName.trim(),
                                color: prev.newLabelColor || "#94a3b8",
                              };
                            }

                            if (!nextLabel) return prev;

                            const alreadyExists = prev.labels.some(
                              (label) =>
                                label.name.toLowerCase() ===
                                nextLabel!.name.toLowerCase(),
                            );
                            if (alreadyExists) return prev;

                            return {
                              ...prev,
                              labels: [...prev.labels, nextLabel],
                              selectedExistingLabel: "",
                              newLabelName: "",
                            };
                          })
                        }
                      >
                        <label
                          className="relative h-4 w-4 shrink-0 cursor-pointer rounded-full"
                          style={{ backgroundColor: editor.newLabelColor }}
                        >
                          <input
                            type="color"
                            value={editor.newLabelColor}
                            onChange={(event) => {
                              event.stopPropagation();
                              setEditor((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      newLabelColor: event.target.value,
                                    }
                                  : prev,
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </label>
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>

                    {editor.labels.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {editor.labels.map((label) => (
                          <button
                            key={`${label.name}-${label.color}`}
                            type="button"
                            onClick={() =>
                              setEditor((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      labels: prev.labels.filter(
                                        (item) =>
                                          item.name.toLowerCase() !==
                                          label.name.toLowerCase(),
                                      ),
                                    }
                                  : prev,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]"
                            style={{
                              borderColor: label.color,
                              backgroundColor: toPastelBackground(
                                label.color,
                                0.14,
                              ),
                              color: "var(--foreground)",
                            }}
                          >
                            {label.name}
                            <X className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Checklist */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground text-xs">
                        Checklist (
                        {editor.checklist.filter((item) => item.done).length}/
                        {editor.checklist.length})
                      </Label>
                      <span className="text-xs text-muted-foreground/70">
                        {percentDone(editor.checklist)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {editor.checklist.map((item) => (
                        <label
                          key={item.id}
                          className="group flex items-center gap-2 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setEditor((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      checklist: prev.checklist.map((ci) =>
                                        ci.id === item.id
                                          ? { ...ci, done: !ci.done }
                                          : ci,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                            className="rounded-full"
                          >
                            {item.done ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/50" />
                            )}
                          </button>
                          <span
                            className={
                              item.done
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {item.text}
                          </span>
                          <button
                            type="button"
                            className="ml-auto text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              setEditor((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      checklist: prev.checklist.filter(
                                        (ci) => ci.id !== item.id,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </label>
                      ))}

                      <div className="flex gap-2">
                        <Input
                          value={editor.newChecklistItem}
                          onChange={(event) =>
                            setEditor((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    newChecklistItem: event.target.value,
                                  }
                                : prev,
                            )
                          }
                          placeholder="Add checklist item"
                          className={`${INLINE_INPUT} text-card-foreground placeholder:text-muted-foreground/50`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 rounded-full border-border bg-card p-0 hover:bg-muted"
                          onClick={() =>
                            setEditor((prev) => {
                              if (!prev || !prev.newChecklistItem.trim())
                                return prev;
                              return {
                                ...prev,
                                checklist: [
                                  ...prev.checklist,
                                  {
                                    id: `ci-${Date.now()}`,
                                    text: prev.newChecklistItem.trim(),
                                    done: false,
                                  },
                                ],
                                newChecklistItem: "",
                              };
                            })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-1">
                    <Label className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                      <Paperclip className="h-3 w-3" /> Attachments
                      {isUploadingFile && (
                        <span className="text-[10px] text-blue-500 ml-1">Uploading...</span>
                      )}
                    </Label>
                    <div className="space-y-2">
                      {/* S3-backed attachments with image preview */}
                      {s3Attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="group rounded-md border border-border/30 overflow-hidden hover:border-border transition-colors"
                        >
                          {attachment.mimetype.startsWith("image/") && (
                            <div className="relative">
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={attachment.url}
                                  alt={attachment.filename}
                                  className="w-full max-h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  loading="lazy"
                                />
                              </a>
                              <button
                                type="button"
                                className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-700 shadow-sm"
                                onClick={async () => {
                                  try {
                                    const resp = await fetch(attachment.url);
                                    const blob = await resp.blob();
                                    const file = new File([blob], attachment.filename, { type: attachment.mimetype });
                                    // Use the chat section's analyze function via a ref-like pattern:
                                    // Post as activity + trigger checklist generation
                                    setPendingAnalyzeFile(file);
                                  } catch { /* ignore */ }
                                }}
                                title="Flowmo will analyze this image to create a checklist"
                              >
                                <Bot className="h-3 w-3" />
                                Analyze
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 px-2 py-1.5">
                            <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate flex-1 text-xs text-foreground hover:underline"
                            >
                              {attachment.filename}
                            </a>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {attachment.size > 1024 * 1024
                                ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`
                                : `${Math.round(attachment.size / 1024)} KB`}
                            </span>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {/* Legacy string-only attachments (backward compat) */}
                      {editor.attachments.map((name) => (
                        <div
                          key={name}
                          className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/50 transition-colors"
                        >
                          <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate flex-1">{name}</span>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() =>
                              setEditor((prev) =>
                                prev
                                  ? { ...prev, attachments: prev.attachments.filter((item) => item !== name) }
                                  : prev,
                              )
                            }
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className={`flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors ${isUploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                        <Plus className="h-3.5 w-3.5" />
                        {isUploadingFile ? "Uploading..." : "Choose file"}
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            if (workspaceId && editor.taskId && editor.mode === "edit") {
                              void handleFileUpload(files);
                            } else {
                              // Fallback for create mode: just store names
                              const names = Array.from(files).map((f) => f.name);
                              setEditor((prev) => {
                                if (!prev) return prev;
                                const unique = names.filter((n) => !prev.attachments.includes(n));
                                if (unique.length === 0) return prev;
                                return { ...prev, attachments: [...prev.attachments, ...unique] };
                              });
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Comments & Activity panel */}
              {showChat && (
                <div className="w-full md:w-[360px] shrink-0 flex flex-col px-3 pt-3 pb-2 md:px-4 md:pt-4 max-h-[45vh] md:max-h-[78vh]">
                  <div className="flex-1 flex flex-col min-h-0">
                    <TaskChatSection
                      workspaceId={workspaceId!}
                      taskId={editor.taskId!}
                      taskTitle={editor.title}
                      currentUserId={currentUserId!}
                      refreshKey={chatRefreshKey}
                      githubEnabled={githubEnabled}
                      analyzeFile={pendingAnalyzeFile}
                      onAnalyzeFileConsumed={() => setPendingAnalyzeFile(null)}
                      onChecklistSuggestion={(items) => {
                        setEditor((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            checklist: [...prev.checklist, ...items],
                          };
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-3 py-2.5 md:px-5 md:py-3">
              <div className="flex items-center gap-1">
                {editor.taskId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (!editor.taskId) return;
                      onDelete(editor.taskId);
                    }}
                    disabled={isDeletingTaskId === editor.taskId}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                {onShare && editor.taskId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onShare(editor.taskId, editor.title)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                {editor?.calendarEvent && (
                  <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-emerald-400 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400" title={`${editor.calendarEvent.title} — ${editor.calendarEvent.time}`}>
                    <Calendar className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{editor.calendarEvent.title}</span>
                    {editor.calendarEvent.time && <span className="text-[9px] opacity-75">· {editor.calendarEvent.time}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editor.mode === "create" ? (
                  <Button
                    size="sm"
                    onClick={() => void onSave()}
                    disabled={isSavingEditor || !editor.title.trim()}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {isSavingEditor ? "Creating..." : "Create Task"}
                  </Button>
                ) : (
                  <>
                    {isSavingEditor && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    )}
                    {autoSaved && !isSavingEditor && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        Saved
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditor(null)}
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
