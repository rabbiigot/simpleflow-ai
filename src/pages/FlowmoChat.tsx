import loadingGif from "@/assets/loading.gif";
import logoOnly from "@/assets/logoOnly.png";
import CalendarEventCard from "@/components/layout/AI/CalendarEventCard";
import GitHubEventCard from "@/components/layout/AI/GitHubEventCard";
import { PlanStepsView, ToolResultCards } from "@/components/layout/AI/ToolResultCards";
import { getFlowmoTour, SpotlightOverlay } from "@/components/layout/AI/TourGuide";
import { ImageWithLoader } from "@/components/ui/image-loader";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { speakFlowmo } from "@/lib/flowmo-voice";
import {
  chatAi,
  chatWithDocument,
  chatWithImage,
  getAiEnergy,
  type AiEnergyStatus,
  getCurrentUserId,
  getDashboardOverview,
  getWorkspacesPaged,
  listAiTools,
  type AiChatResponse,
  type DashboardOverviewResponse,
  type Workspace,
  type WorkspaceStatusFilter,
} from "@/lib/backend-api";
import {
  useNotificationSocket,
  type NotificationSocketEvent,
} from "@/hooks/use-notification-socket";
import { emitInvalidation } from "@/lib/invalidation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useFlowmoStore } from "@/store/flowmo-store";
import type { ChatMessage, SessionHistoryEntry } from "@/store/flowmo-store";
import { useAiEvents } from "@/hooks/use-ai-events";
import { useNavigate } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  ImagePlus,
  Layers,
  Loader2,
  Megaphone,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  MoreVertical,
  Paperclip,
  PenSquare,
  Pin,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ═══════════════════════════════════════════
// ── Helpers ──
// ═══════════════════════════════════════════

function isTerminalStatus(status: AiChatResponse["status"]) {
  return status === "success" || status === "partial" || status === "failed" || status === "canceled" || status === "no_action";
}

function isConfirmationFollowupMessage(message: string) {
  const l = message.trim().toLowerCase();
  return ["yes","y","ok","okay","confirm","confirmed","execute","run it","go ahead","proceed","do it","cancel","stop","never mind","never mind.","abort"].includes(l) || l.startsWith("clarification:");
}

function bubbleBase(role: "user" | "assistant") {
  return cn(
    "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-hidden break-words min-w-0",
    role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-card text-card-foreground border border-border rounded-bl-sm",
  );
}


const FILE_ICON_MAP: Record<string, string> = {
  "application/pdf": "PDF", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC", "text/csv": "CSV", "text/plain": "TXT",
};
function getFileLabel(file: File) { return FILE_ICON_MAP[file.type] || file.name.split(".").pop()?.toUpperCase() || "FILE"; }
function isImageFile(file: File) { return file.type.startsWith("image/"); }
function isDocumentFile(file: File) { return file.type in FILE_ICON_MAP; }

// ═══════════════════════════════════════════
// ── Sub-components ──
// ═══════════════════════════════════════════

// ── Suggested Prompts ──

const SUGGESTED_PROMPTS = [
  { icon: <FolderOpen className="h-4 w-4" />, label: "Create a workspace", prompt: "Create a workspace named " },
  { icon: <ClipboardList className="h-4 w-4" />, label: "Show my tasks", prompt: "List all tasks in workspace " },
  { icon: <Layers className="h-4 w-4" />, label: "List workspaces", prompt: "List my workspaces" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Dashboard overview", prompt: "Show me my dashboard overview" },
  { icon: <Sparkles className="h-4 w-4" />, label: "Productivity insights", prompt: "Show me my productivity insights" },
  { icon: <FileText className="h-4 w-4" />, label: "Create a post", prompt: "Create a post saying " },
];

// ── Slash Commands ──

type SubCommand = { label: string; description: string; prompt: string };
type SlashCategory = { command: string; description: string; icon: ReactNode; subs: SubCommand[] };

const SLASH_CATEGORIES: SlashCategory[] = [
  {
    command: "/task", description: "Manage tasks", icon: <ClipboardList className="h-4 w-4" />,
    subs: [
      { label: "List tasks", description: "Get all tasks in a workspace", prompt: "List all tasks in workspace [workspace name]" },
      { label: "Create task", description: "Create a single task", prompt: "Create a task titled [task title] in workspace [workspace name]" },
      { label: "Create multiple", description: "Create several tasks at once", prompt: "Create tasks in workspace [workspace name]: [task 1], [task 2], [task 3]" },
      { label: "Get task", description: "Get task details", prompt: "Get details of task [task title] in workspace [workspace name]" },
      { label: "Update task", description: "Update a task", prompt: "Update task [task title] description to [new description] in workspace [workspace name]" },
      { label: "Complete task", description: "Mark task as completed", prompt: "Complete task [task title] in workspace [workspace name]" },
      { label: "Move task", description: "Change task status", prompt: "Move task [task title] to [IN PROGRESS] in workspace [workspace name]" },
      { label: "Delete task", description: "Remove a task", prompt: "Delete task [task title] in workspace [workspace name]" },
    ],
  },
  {
    command: "/workspace", description: "Manage workspaces", icon: <FolderOpen className="h-4 w-4" />,
    subs: [
      { label: "List workspaces", description: "Get all your workspaces", prompt: "List my workspaces" },
      { label: "Create workspace", description: "Create a new workspace", prompt: "Create a workspace named [workspace name]" },
      { label: "Create with tasks", description: "Workspace + tasks in one go", prompt: "Create workspace [workspace name] with tasks: [task 1], [task 2], [task 3]" },
      { label: "Get workspace", description: "View workspace details", prompt: "Get workspace [workspace name]" },
      { label: "Update workspace", description: "Update name or description", prompt: "Update workspace [workspace name]" },
      { label: "Delete workspace", description: "Remove a workspace", prompt: "Delete workspace [workspace name]" },
      { label: "List members", description: "See workspace members", prompt: "List members of workspace [workspace name]" },
      { label: "Add status", description: "Add a custom column", prompt: "Add status [status name] to workspace [workspace name]" },
      { label: "Add custom field", description: "Add a field to workspace", prompt: "Add custom field [field name] to workspace [workspace name]" },
    ],
  },
  {
    command: "/post", description: "Social feed", icon: <Megaphone className="h-4 w-4" />,
    subs: [
      { label: "Get all posts", description: "View social feed", prompt: "Get all posts" },
      { label: "Create post", description: "Publish a new post", prompt: "Create a post saying [your message here]" },
      { label: "Update post", description: "Edit a post", prompt: "Update my post to say [new content]" },
      { label: "Delete post", description: "Remove a post", prompt: "Delete my latest post" },
      { label: "Comment", description: "Comment on a post", prompt: "Comment [your comment] on post" },
      { label: "Share post", description: "Share to channels", prompt: "Share post to channel [channel name]" },
    ],
  },
  {
    command: "/invite", description: "Invite users", icon: <UserPlus className="h-4 w-4" />,
    subs: [
      { label: "To workspace", description: "Invite user to workspace", prompt: "Invite [email@example.com] to workspace [workspace name]" },
      { label: "To channel", description: "Invite user to channel", prompt: "Invite [email@example.com] to channel [channel name]" },
    ],
  },
  {
    command: "/analytics", description: "Dashboard & insights", icon: <BarChart3 className="h-4 w-4" />,
    subs: [
      { label: "Overview", description: "Key metrics summary", prompt: "Show me my dashboard overview" },
      { label: "Insights", description: "Productivity insights", prompt: "Show me my productivity insights" },
      { label: "Reports", description: "Weekly reports", prompt: "Show me my weekly reports" },
    ],
  },
  {
    command: "/channel", description: "Chat channels", icon: <MessageSquare className="h-4 w-4" />,
    subs: [
      { label: "List channels", description: "View your channels", prompt: "List my channels" },
      { label: "Create channel", description: "Start a new channel", prompt: "Create a channel named [channel name]" },
      { label: "Send message", description: "Message a channel", prompt: "Send [your message] in channel [channel name]" },
      { label: "Get messages", description: "View channel messages", prompt: "Get messages from channel [channel name]" },
    ],
  },
  {
    command: "/automation", description: "Automations", icon: <Zap className="h-4 w-4" />,
    subs: [
      { label: "List automations", description: "View your automations", prompt: "List my automations" },
      { label: "Create automation", description: "Set up a new automation", prompt: "Create automation [name] when task is completed then send email" },
      { label: "Test automation", description: "Test-fire an automation", prompt: "Test automation [automation name]" },
    ],
  },
  {
    command: "/batch", description: "Batch operations", icon: <Layers className="h-4 w-4" />,
    subs: [
      { label: "Complete all tasks", description: "Mark all tasks as done", prompt: "Complete all tasks in workspace [workspace name]" },
      { label: "Move all tasks", description: "Move tasks to a column", prompt: "Move all tasks in [column name] to [target column] in workspace [workspace name]" },
      { label: "Create many tasks", description: "Create multiple tasks at once", prompt: "Create these tasks in workspace [workspace name]: [task 1], [task 2], [task 3], [task 4], [task 5]" },
      { label: "Invite multiple users", description: "Invite several people", prompt: "Invite these emails to workspace [workspace name]: [email1], [email2], [email3]" },
      { label: "Delete all tasks", description: "Remove all tasks in a column", prompt: "Delete all tasks in column [column name] in workspace [workspace name]" },
    ],
  },
  {
    command: "/profile", description: "Your profile", icon: <Bot className="h-4 w-4" />,
    subs: [
      { label: "Get profile", description: "View your profile info", prompt: "Show me my profile" },
      { label: "Update profile", description: "Edit your profile", prompt: "Update my profile bio to [your bio]" },
    ],
  },
];

// ── Typing Dots ──

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

// ── Markdown ──

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        code: ({ className, children, ...props }) => {
          if (className?.includes("language-")) {
            return <pre className="my-2 rounded-lg bg-muted/80 border border-border px-3 py-2 overflow-x-auto text-xs"><code className={className} {...props}>{children}</code></pre>;
          }
          return <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>{children}</code>;
        },
        table: ({ children }) => <div className="my-2 overflow-x-auto rounded-lg border border-border"><table className="w-full text-xs">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-muted/60 border-b border-border">{children}</thead>,
        th: ({ children }) => <th className="px-3 py-1.5 text-left font-semibold text-foreground">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5 border-t border-border/50">{children}</td>,
        h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-400 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>,
        hr: () => <hr className="my-3 border-border" />,
        a: ({ href, children, ...props }) => {
          if (href && /^(javascript|data|vbscript):/i.test(href)) {
            return <span>{children}</span>;
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
              {...props}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ═══════════════════════════════════════════
// ── Main Component ──
// ═══════════════════════════════════════════

const FlowmoChat = () => {
  const navigate = useNavigate();
  const user = useAuthStore((store) => store.user);
  const displayName = (user?.firstName || "").trim() || "there";

  // ── Store ──
  const allMessages = useFlowmoStore((s) => s.messages);
  const setMessages = useFlowmoStore((s) => s.setMessages);
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const hasOlderMessages = allMessages.length > visibleCount;
  const messages = useMemo(() => {
    if (allMessages.length <= visibleCount) return allMessages;
    return allMessages.slice(allMessages.length - visibleCount);
  }, [allMessages, visibleCount]);
  const pendingConfirmationId = useFlowmoStore((s) => s.pendingConfirmationId);
  const saveConfirmationId = useFlowmoStore((s) => s.saveConfirmationId);
  const sessionId = useFlowmoStore((s) => s.sessionId);
  const saveSessionId = useFlowmoStore((s) => s.saveSessionId);
  const startNewSession = useFlowmoStore((s) => s.startNewSession);
  const loadSession = useFlowmoStore((s) => s.loadSession);
  const deleteSessionHistory = useFlowmoStore((s) => s.deleteSessionHistory);
  const renameSession = useFlowmoStore((s) => s.renameSession);
  const sessionHistory = useFlowmoStore((s) => s.sessionHistory);
  const activeHistoryId = useFlowmoStore((s) => s.activeHistoryId);

  // ── Local state ──
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const skipScrollRef = useRef(false);

  // Drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Session sidebar
  const [showSessions, setShowSessions] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [kebabOpenId, setKebabOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Slash menu
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<SlashCategory | null>(null);

  // Message actions
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice
  const voiceSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const sendMessageRef = useRef<(raw: string, files?: File[]) => Promise<void>>(undefined);

  // ── Page Tour ──
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const flowmoTour = getFlowmoTour();

  useEffect(() => {
    const handler = () => { setTourActive(true); setTourStepIndex(0); };
    window.addEventListener("simpleflow:start-flowmo-tour", handler);
    return () => window.removeEventListener("simpleflow:start-flowmo-tour", handler);
  }, []);

  // Proactive suggestions
  const [dashboardData, setDashboardData] = useState<DashboardOverviewResponse | null>(null);

  const { events, isConnected: wsConnected } = useAiEvents();
  const [apiOnline, setApiOnline] = useState(false);
  const isConnected = wsConnected || apiOnline;
  const hasUserMessages = allMessages.some((m) => m.role === "user");

  // Listen for GitHub PR events (needed when panel is not mounted on /flowmo page)
  const currentUserId = getCurrentUserId();
  const { addListener: addNotifListener } = useNotificationSocket(currentUserId);

  // Flowmo daily energy (Free plan); null/unlimited = no badge shown
  const [energy, setEnergy] = useState<AiEnergyStatus | null>(null);
  const refreshEnergy = useCallback(() => {
    if (!currentUserId) return;
    getAiEnergy(currentUserId)
      .then(setEnergy)
      .catch(() => setEnergy(null));
  }, [currentUserId]);
  useEffect(() => {
    refreshEnergy();
  }, [refreshEnergy]);


  useEffect(() => {
    return addNotifListener((event: NotificationSocketEvent) => {
      if (event.type === "new_notification" && event.notification) {
        const notif = event.notification;
        // Push calendar events into chat — skip duplicates
        if ((notif.type as string) === "CALENDAR_EVENT") {
          const calId = `calendar-${notif.id}`;
          setMessages((prev) => {
            if (prev.some((m) => m.id === calId)) return prev;
            const msg = notif.message || "";
            const locationMatch = msg.match(/---location:(.+)/);
            const meetMatch = msg.match(/---meet:(.+)/);
            const timeLine = msg.split("\n")[0] || "";
            return [
              ...prev,
              {
                id: calId,
                role: "assistant",
                type: "calendar_event",
                title: notif.title,
                time: timeLine,
                location: locationMatch?.[1] || null,
                meetLink: meetMatch?.[1] || null,
                createdAt: Date.now(),
              } as ChatMessage,
            ];
          });
        }

        if ((notif.type as string) === "GITHUB_EVENT" && notif.title?.includes("PR #")) {
          const prMatch = notif.title.match(/^PR #(\d+) (\w+): (.+)$/);
          const prNumber = prMatch ? Number(prMatch[1]) : null;
          const action = prMatch ? prMatch[2] : null;
          const prTitle = prMatch ? prMatch[3] : notif.title;
          const msg = notif.message || "";
          const repoLine = msg.match(/---repo:(.+)/);
          const urlLine = msg.match(/---url:(.+)/);
          const authorLine = msg.match(/---author:(.+)/);
          const shaLine = msg.match(/---sha:(.+)/);
          const bodyText = msg.split("\n---")[0].trim();

          setMessages((prev) => {
            const existingIdx = prev.findIndex(
              (m) => m.type === "github_event" && (m as any).prNumber === prNumber && (m as any).repoFullName === (repoLine?.[1] || ""),
            );
            if (existingIdx !== -1) {
              const updated = [...prev];
              updated[existingIdx] = { ...updated[existingIdx], action, createdAt: Date.now() } as ChatMessage;
              return updated;
            }
            return [
              ...prev,
              {
                id: `github-pr-${prNumber}-${action}-${Date.now()}`,
                role: "assistant", type: "github_event", eventType: "pull_request",
                action, title: prTitle, body: bodyText || null, prNumber,
                repoFullName: repoLine?.[1] || "", url: urlLine?.[1] || "",
                authorLogin: authorLine?.[1] || "", sha: shaLine?.[1] || "",
                createdAt: Date.now(),
              } as ChatMessage,
            ];
          });
        }
      }
    });
  }, [addNotifListener, setMessages]);

  // ── Effects ──

  useEffect(() => {
    const uid = getCurrentUserId() || undefined;
    getWorkspacesPaged({ userId: uid, pageSize: 100, excludeStatus: ["archived" as WorkspaceStatusFilter] })
      .then((res) => setWorkspaces(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    listAiTools().then(() => setApiOnline(true)).catch(() => setApiOnline(false));
  }, []);

  useEffect(() => {
    const uid = getCurrentUserId() || undefined;
    getDashboardOverview(uid).then(setDashboardData).catch(() => {});
  }, []);

  useEffect(() => {
    if (skipScrollRef.current) { skipScrollRef.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`; }
  }, [inputText]);

  useEffect(() => {
    const img = pendingFiles.find(isImageFile);
    if (img) {
      const reader = new FileReader();
      reader.onload = (ev) => setPendingImagePreview(ev.target?.result as string);
      reader.readAsDataURL(img);
    } else { setPendingImagePreview(null); }
  }, [pendingFiles]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      // Cmd+K → new chat
      if (meta && e.key === "k") { e.preventDefault(); startNewSession(); setSelectedWorkspace(null); setShowSessions(false); setVisibleCount(PAGE_SIZE); }
      // Cmd+/ → focus input
      if (meta && e.key === "/") { e.preventDefault(); textareaRef.current?.focus(); }
      // Cmd+Shift+S → toggle sidebar
      if (meta && e.shiftKey && e.key.toLowerCase() === "s") { e.preventDefault(); setShowSessions((v) => !v); }
      // Esc → close menus
      if (e.key === "Escape") { setShowSessions(false); setShowWorkspacePicker(false); setKebabOpenId(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [startNewSession]);

  // ── File handling ──
  const addFiles = useCallback((files: FileList | File[]) => { setPendingFiles((prev) => [...prev, ...Array.from(files)]); }, []);
  const removeFile = useCallback((i: number) => { setPendingFiles((prev) => prev.filter((_, idx) => idx !== i)); }, []);
  const clearFiles = useCallback(() => { setPendingFiles([]); setPendingImagePreview(null); }, []);

  // ── Drag & drop ──
  const handleDragEnter = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current++; if (e.dataTransfer.types.includes("Files")) setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current--; if (dragCounterRef.current === 0) setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current = 0; setIsDragging(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }, [addFiles]);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }, [addFiles]);

  // ── Copy ──
  const copyMessage = useCallback((id: string, text: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }); }, []);

  // ── Voice ──
  function getSpeechCtor(): (new () => any) | null {
    if (typeof window === "undefined") return null;
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
  }

  const startRecording = useCallback(() => {
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    try { recognitionRef.current?.abort(); } catch {}
    finalTranscriptRef.current = "";
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    const resetTimer = () => { if (silenceTimer) clearTimeout(silenceTimer); silenceTimer = setTimeout(() => recognition.stop(), 2000); };

    recognition.onresult = (event: any) => {
      let final_ = "", interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) final_ += (final_ ? " " : "") + t;
        else interim += (interim ? " " : "") + t;
      }
      if (final_) finalTranscriptRef.current = final_;
      setInputText(final_ ? (interim ? `${final_} ${interim}` : final_) : interim);
      resetTimer();
    };
    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      setIsRecording(false); recognitionRef.current = null;
      const raw = finalTranscriptRef.current.trim();
      if (raw) { setInputText(""); sendMessageRef.current?.(raw); }
      finalTranscriptRef.current = "";
    };
    recognition.onerror = () => { if (silenceTimer) clearTimeout(silenceTimer); setIsRecording(false); recognitionRef.current = null; finalTranscriptRef.current = ""; };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    resetTimer();
  }, []);

  const toggleVoice = useCallback(() => {
    if (isRecording) { recognitionRef.current?.stop(); return; }
    startRecording();
  }, [isRecording, startRecording]);

  // ── Send message ──
  const sendMessage = useCallback(
    async (raw: string, files?: File[]) => {
      const text = raw.trim();
      const filesToSend = files ?? pendingFiles;
      const imageFile = filesToSend.find(isImageFile) || null;
      if ((!text && !filesToSend.length) || isSending) return;

      const displayText = filesToSend.length
        ? `${text || "Analyze " + (filesToSend.length === 1 ? "this file" : "these files") + " and create tasks"}`
        : text;

      const docFile = filesToSend.find(isDocumentFile) || null;
      setMessages((prev) => [...prev, {
        id: `user-${Date.now()}`, role: "user", type: "text", text: displayText, createdAt: Date.now(),
        ...(imageFile && pendingImagePreview ? { imagePreview: pendingImagePreview } : {}),
        ...(docFile ? { documentFile: { name: docFile.name, label: getFileLabel(docFile) } } : {}),
      } as ChatMessage]);
      setIsSending(true);
      clearFiles();

      try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) throw new Error("No signed-in user id found. Please sign up or log in again.");

        const context: Record<string, unknown> = { userId: currentUserId };
        if (selectedWorkspace) { context.workspaceName = selectedWorkspace.name; context.workspaceId = selectedWorkspace.id; }

        let result: AiChatResponse;
        if (imageFile) {
          result = await chatWithImage(imageFile, text || undefined, context, true);
        } else if (docFile) {
          result = await chatWithDocument(docFile, text || undefined, context, true, sessionId ?? undefined);
        } else {
          const shouldUse = Boolean(pendingConfirmationId) && isConfirmationFollowupMessage(text);
          const cid = shouldUse ? (pendingConfirmationId ?? undefined) : undefined;
          if (pendingConfirmationId && !shouldUse) saveConfirmationId(null);
          result = await chatAi(text, context, cid, true, sessionId ?? undefined);
        }

        if (result.sessionId != null) saveSessionId(result.sessionId);
        if (result.status === "confirmation_required" && result.confirmationId) saveConfirmationId(result.confirmationId);
        else if (isTerminalStatus(result.status)) saveConfirmationId(null);

        if (isTerminalStatus(result.status)) {
          const tags = new Set<string>();
          const toolsRun = (result.results ?? []).filter((r) => r.success).map((r) => r.tool);
          for (const t of toolsRun) {
            if (t.startsWith("workspace.")) tags.add("workspaces");
            if (t.startsWith("social.")) tags.add("social");
            if (t.startsWith("timeRecord.")) tags.add("timeRecords");
          }
          emitInvalidation(Array.from(tags), toolsRun);
          if (tags.has("workspaces")) {
            const uid = getCurrentUserId() || undefined;
            getWorkspacesPaged({ userId: uid, pageSize: 100, excludeStatus: ["archived" as WorkspaceStatusFilter] }).then((res) => setWorkspaces(res.items)).catch(() => {});
          }
        }

        setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", type: "response", response: result, createdAt: Date.now() }]);
        void speakFlowmo(result.message || result.confirmationPrompt || "");
      } catch (error) {
        setMessages((prev) => [...prev, { id: `assistant-error-${Date.now()}`, role: "assistant", type: "error", text: error instanceof Error ? error.message : "Failed to execute AI chat orchestration.", createdAt: Date.now() }]);
      } finally { setIsSending(false); refreshEnergy(); }
    },
    [isSending, pendingConfirmationId, pendingImagePreview, pendingFiles, saveConfirmationId, saveSessionId, selectedWorkspace, sessionId, setMessages, clearFiles],
  );
  sendMessageRef.current = sendMessage;

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); void sendMessage(inputText); setInputText(""); resetSlashMenu(); };

  // ── Slash menu logic ──
  const filteredCategories = useMemo(() => {
    if (!showSlashMenu || activeCategory) return [];
    const q = slashFilter.toLowerCase();
    return SLASH_CATEGORIES.filter((cat) => cat.command.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q));
  }, [showSlashMenu, slashFilter, activeCategory]);

  const filteredSubs = useMemo(() => {
    if (!showSlashMenu || !activeCategory) return [];
    return activeCategory.subs;
  }, [showSlashMenu, activeCategory]);

  const menuItems = activeCategory ? filteredSubs : filteredCategories;
  const menuLength = menuItems.length;

  function resetSlashMenu() {
    setShowSlashMenu(false);
    setSlashFilter("");
    setSlashSelectedIndex(0);
    setActiveCategory(null);
  }

  const selectSubCommand = useCallback((sub: SubCommand) => {
    let prompt = sub.prompt;
    if (selectedWorkspace) {
      prompt = prompt.replace("[workspace name]", selectedWorkspace.name);
    }
    setInputText(prompt);
    resetSlashMenu();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      const match = /\[([^\]]+)\]/.exec(prompt);
      if (match) el.setSelectionRange(match.index, match.index + match[0].length);
    });
  }, [selectedWorkspace]);

  const selectCategory = useCallback((cat: SlashCategory) => {
    setActiveCategory(cat);
    setSlashSelectedIndex(0);
    setInputText("");
    textareaRef.current?.focus();
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInputText(value);
    if (activeCategory) return;
    if (value === "/") {
      setShowSlashMenu(true); setSlashFilter(""); setSlashSelectedIndex(0);
    } else if (value.startsWith("/") && !value.includes(" ")) {
      setShowSlashMenu(true); setSlashFilter(value); setSlashSelectedIndex(0);
    } else {
      resetSlashMenu();
    }
  }, [activeCategory]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Slash menu navigation
    if (showSlashMenu && menuLength > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashSelectedIndex((p) => (p < menuLength - 1 ? p + 1 : 0)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashSelectedIndex((p) => (p > 0 ? p - 1 : menuLength - 1)); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (activeCategory) { const sub = filteredSubs[slashSelectedIndex]; if (sub) selectSubCommand(sub); }
        else { const cat = filteredCategories[slashSelectedIndex]; if (cat) selectCategory(cat); }
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); resetSlashMenu(); return; }
      if (e.key === "Backspace" && activeCategory && !inputText) { e.preventDefault(); setActiveCategory(null); setSlashSelectedIndex(0); setInputText("/"); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(inputText); setInputText(""); resetSlashMenu(); }
    // Up arrow in empty input → fill last user message for editing
    if (e.key === "ArrowUp" && !inputText && !showSlashMenu) {
      const last = [...messages].reverse().find((m) => m.role === "user" && m.type === "text");
      if (last && last.type === "text") { e.preventDefault(); setInputText(last.text); }
    }
  };

  const thinkingLabel = useMemo(() => {
    if (!isSending) return "";
    const last = events.length > 0 ? events[events.length - 1] : undefined;
    if (last?.type === "tool_start") return `Running ${(last as any).tool ?? ""}`;
    if (last?.type === "planning") return "Planning";
    return "Thinking";
  }, [events, isSending]);

  // ── Proactive suggestions ──
  const proactiveSuggestions = useMemo(() => {
    if (!dashboardData || hasUserMessages) return [];
    const suggestions: Array<{ text: string; prompt: string }> = [];
    const { summary, todayTasks } = dashboardData;

    if (todayTasks?.length) {
      const pending = todayTasks.filter((t) => !t.done);
      if (pending.length) suggestions.push({ text: `You have ${pending.length} pending task${pending.length > 1 ? "s" : ""} today`, prompt: "Show me my tasks for today" });
    }
    if (summary?.totalTasks && summary.totalTasks > 0) {
      suggestions.push({ text: `${summary.tasksCompleted}/${summary.totalTasks} tasks completed (${summary.successRate}%)`, prompt: "Show me my dashboard overview" });
    }
    if (summary?.monthlyHoursTracked != null) {
      suggestions.push({ text: `${summary.monthlyHoursTracked}h tracked this month`, prompt: "Show me my productivity insights" });
    }
    return suggestions.slice(0, 3);
  }, [dashboardData, hasUserMessages]);

  // ── Workspace context ──
  const wsContext = useMemo(() => {
    if (!selectedWorkspace || !dashboardData?.goals) return null;
    const goal = dashboardData.goals.find((g) => g.workspaceId === Number(selectedWorkspace.id));
    return goal ?? null;
  }, [selectedWorkspace, dashboardData]);

  // ── Group sessions ──
  const groupedSessions = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const groups: { label: string; entries: SessionHistoryEntry[] }[] = [
      { label: "Today", entries: [] }, { label: "Yesterday", entries: [] },
      { label: "Previous 7 Days", entries: [] }, { label: "Older", entries: [] },
    ];
    const q = searchQuery.toLowerCase().trim();
    for (const entry of sessionHistory) {
      if (q && !entry.title.toLowerCase().includes(q)) continue;
      const d = new Date(entry.updatedAt); d.setHours(0, 0, 0, 0);
      if (d.getTime() >= today.getTime()) groups[0].entries.push(entry);
      else if (d.getTime() >= yesterday.getTime()) groups[1].entries.push(entry);
      else if (d.getTime() >= weekAgo.getTime()) groups[2].entries.push(entry);
      else groups[3].entries.push(entry);
    }
    return groups.filter((g) => g.entries.length > 0);
  }, [sessionHistory, searchQuery]);

  // ═══════════════════════════════════════════
  // ── Render ──
  // ═══════════════════════════════════════════

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-background" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-indigo-400 rounded-lg m-2 pointer-events-none">
          <div className="flex flex-col items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <Upload className="h-12 w-12" />
            <span className="text-lg font-semibold">Drop files here</span>
            <span className="text-sm text-muted-foreground">PDF, Excel, Word, images, and more</span>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b bg-card pl-4 pr-4 h-13 shrink-0">
        <div className="flex items-center gap-2">
          <img src={loadingGif} alt="Flowmo" className="h-7" />
          <span className="text-sm font-semibold text-indigo-700 dark:text-blue-400">Flowmo</span>
          <span className={`inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium ${isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
            {isConnected ? "Active" : "Offline"}
          </span>
          {energy && !energy.unlimited && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5"
              title={`Flowmo energy: ${energy.remaining}/${energy.limit} left today · ${energy.costPerPrompt} per action`}
            >
              <span className="text-[10px]">⚡</span>
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <span
                  className={`block h-full rounded-full transition-all ${energy.remaining <= 0 ? "bg-red-400" : energy.remaining <= energy.costPerPrompt ? "bg-orange-400" : "bg-amber-400"}`}
                  style={{
                    width: `${energy.limit > 0 ? Math.max(0, Math.min(100, (energy.remaining / energy.limit) * 100)) : 0}%`,
                  }}
                />
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {energy.remaining}/{energy.limit}
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden sm:inline text-[10px] text-muted-foreground/50 mr-2">⌘K new · ⌘/ focus · ⌘⇧S history</span>
          <button type="button" data-tour="flowmo-new-session" onClick={() => { startNewSession(); setSelectedWorkspace(null); setShowSessions(false); setVisibleCount(PAGE_SIZE); }} className="flex items-center gap-1.5 rounded-md hover:bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" title="New chat (⌘K)">
            <PenSquare className="h-3.5 w-3.5" /><span>New Chat</span>
          </button>
          <div className="h-5 w-px bg-border" />
          <button type="button" data-tour="flowmo-history" onClick={() => setShowSessions((v) => !v)} className={cn("grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none transition-colors", showSessions && "bg-muted text-primary")} title="Chat history (⌘⇧S)">
            <Menu className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted focus:outline-none text-muted-foreground hover:text-foreground transition-colors" title="Close (Esc)">
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Workspace context bar ── */}
      {selectedWorkspace && (
        <div className="flex items-center gap-3 border-b bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <FolderOpen className="h-3 w-3 text-indigo-500" />
            <span className="font-medium text-foreground">{selectedWorkspace.name}</span>
          </div>
          {wsContext && (
            <>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{wsContext.completedTasks}/{wsContext.totalTasks} tasks done</span>
                <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${wsContext.progress}%` }} />
                </div>
                <span>{wsContext.progress}%</span>
              </div>
            </>
          )}
          <button type="button" onClick={() => navigate({ to: `/workspace/project/${selectedWorkspace.id}`, search: { tab: "tasks" } })} className="ml-auto text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            Open <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Greeting */}
          <div className="border-b bg-card pl-4 pr-4 py-2 shrink-0">
            <div className="text-sm font-semibold text-foreground">Hi {displayName}</div>
            <div className="text-xs text-muted-foreground">Ask anything or describe what you'd like to do.</div>
          </div>

          {/* Messages / Empty State */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full min-h-0">
              <div className="max-w-3xl mx-auto p-4 space-y-3">
                {/* ── Empty state ── */}
                {!hasUserMessages && (
                  <div className="py-6">
                    <div className="text-center mb-6">
                      <img src={loadingGif} alt="Flowmo" className="h-14 mx-auto mb-3" />
                      <h2 className="text-lg font-semibold text-foreground">What can I help you with?</h2>
                      <p className="text-xs text-muted-foreground mt-1">Choose a suggestion or type your own message</p>
                    </div>

                    {/* Proactive suggestions */}
                    {proactiveSuggestions.length > 0 && (
                      <div className="max-w-lg mx-auto mb-4">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 px-1">Your overview</div>
                        <div className="space-y-1.5">
                          {proactiveSuggestions.map((s) => (
                            <button key={s.text} type="button" onClick={() => { setInputText(s.prompt); textareaRef.current?.focus(); }}
                              className="w-full flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2 text-xs text-left text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors">
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              <span>{s.text}</span>
                              <ChevronRight className="h-3 w-3 ml-auto shrink-0 text-amber-500" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto" data-tour="flowmo-quick-actions">
                      {SUGGESTED_PROMPTS.map((sp) => (
                        <button key={sp.label} type="button" onClick={() => { setInputText(sp.prompt); textareaRef.current?.focus(); }}
                          className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground hover:border-indigo-300 transition-colors">
                          <span className="shrink-0 text-indigo-500">{sp.icon}</span>
                          <span>{sp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Load older messages ── */}
                {hasOlderMessages && (
                  <div className="flex justify-center pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoadingOlder(true);
                        skipScrollRef.current = true;
                        setTimeout(() => {
                          setVisibleCount((prev) => prev + PAGE_SIZE);
                          setIsLoadingOlder(false);
                        }, 400);
                      }}
                      disabled={isLoadingOlder}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-full border border-border hover:bg-muted flex items-center gap-1.5"
                    >
                      {isLoadingOlder ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Loading...</>
                      ) : (
                        <>Load older messages ({allMessages.length - visibleCount} more)</>
                      )}
                    </button>
                  </div>
                )}

                {/* ── Messages ── */}
                {messages.map((message) => {
                  if (message.type === "response") {
                    const r = message.response;
                    const isConfirm = r.status === "confirmation_required";
                    return (
                      <div key={message.id} className="group/msg flex justify-start gap-2">
                        <div className={bubbleBase("assistant")}>
                          <div className="flex items-center gap-2 font-semibold text-foreground">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/70 bg-white p-0.5">
                              <img src={logoOnly} alt="" className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span>Flowmo</span>
                          </div>
                          <div className="mt-1"><MarkdownContent content={r.message} /></div>

                          {/* Multi-step plan visualization (only for action objects, not plain tool name strings) */}
                          {(r.plannedActions as unknown[])?.length > 0 &&
                            typeof (r.plannedActions as unknown[])[0] === "object" && (
                            <PlanStepsView
                              actions={r.plannedActions as unknown[]}
                              results={isTerminalStatus(r.status) ? r.results : undefined}
                            />
                          )}

                          {/* Interactive result cards */}
                          <ToolResultCards results={r.results} navigate={navigate} />

                          {r.confirmationPrompt && <div className="mt-2 rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground">{r.confirmationPrompt}</div>}
                          {isConfirm && (
                            <div className="mt-3 flex gap-2">
                              <Button type="button" size="sm" onClick={() => void sendMessage("yes", [])} disabled={isSending} className="bg-indigo-600 hover:bg-indigo-700 text-white"><Send /> Execute</Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => void sendMessage("cancel", [])} disabled={isSending}><X /> Cancel</Button>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col gap-0.5 pt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <button type="button" onClick={() => copyMessage(message.id, r.message)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Copy">
                            {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" onClick={() => { const last = [...messages].reverse().find((m) => m.role === "user" && m.type === "text"); if (last && last.type === "text") void sendMessage(last.text, []); }} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Retry">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (message.type === "github_event") {
                    return (
                      <div key={message.id} className="group/msg flex justify-start gap-2">
                        <div className={bubbleBase("assistant")}>
                          <GitHubEventCard
                            title={message.title}
                            body={message.body}
                            prNumber={message.prNumber}
                            repoFullName={message.repoFullName}
                            action={message.action}
                            url={message.url}
                            sha={message.sha}
                            actionCompleted={message.actionCompleted}
                            onActionCompleted={() => {
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === message.id
                                    ? { ...m, actionCompleted: true } as ChatMessage
                                    : m,
                                ),
                              );
                            }}
                          />
                        </div>
                      </div>
                    );
                  }

                  if (message.type === "calendar_event") {
                    return (
                      <div key={message.id} className="group/msg flex justify-start gap-2">
                        <div className={bubbleBase("assistant")}>
                          <CalendarEventCard
                            title={message.title}
                            time={message.time}
                            location={message.location}
                            meetLink={message.meetLink}
                            actionCompleted={(message as any).actionCompleted}
                            onActionCompleted={(action) => {
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === message.id ? { ...m, actionCompleted: action } as ChatMessage : m,
                                ),
                              );
                            }}
                          />
                        </div>
                      </div>
                    );
                  }

                  if (message.role === "assistant") {
                    return (
                      <div key={message.id} className="group/msg flex justify-start gap-2">
                        <div className={bubbleBase("assistant")}>
                          {message.type === "error" ? (
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <div className="text-red-700 dark:text-red-400 font-medium">Something went wrong</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{message.text}</div>
                                <button type="button" onClick={() => { const last = [...messages].reverse().find((m) => m.role === "user" && m.type === "text"); if (last && last.type === "text") void sendMessage(last.text, []); }}
                                  className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                                  <RefreshCw className="h-3 w-3" /> Try again
                                </button>
                              </div>
                            </div>
                          ) : (
                            <MarkdownContent content={message.text} />
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col gap-0.5 pt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <button type="button" onClick={() => copyMessage(message.id, message.text)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Copy">
                            {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="group/msg flex justify-end gap-2">
                      <div className="shrink-0 flex flex-col gap-0.5 pt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <button type="button" onClick={() => copyMessage(message.id, message.text)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title="Copy">
                          {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <div className={bubbleBase("user")}>
                        {message.imagePreview && <ImageWithLoader src={message.imagePreview} alt="Uploaded" wrapperClassName="mb-2 max-h-40 rounded-lg" className="max-h-40 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />}
                        {message.documentFile && (
                          <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/30 bg-white/15 px-3 py-2">
                            <FileText className="h-5 w-5 text-white/80 shrink-0" />
                            <span className="text-sm truncate max-w-[200px] text-white">{message.documentFile.name}</span>
                            <span className="text-[10px] font-semibold text-white bg-white/20 px-1.5 py-0.5 rounded shrink-0">{message.documentFile.label}</span>
                          </div>
                        )}
                        {message.text}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isSending && (
                  <div className="flex justify-start">
                    <div className={cn(bubbleBase("assistant"), "py-3")}>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-purple-500/70 bg-white p-0.5">
                          <img src={logoOnly} alt="" className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold text-indigo-700 dark:text-blue-400">Flowmo</span>
                        <TypingDots />
                        <span className="text-xs text-muted-foreground">{thinkingLabel}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offline banner */}
                {!isConnected && hasUserMessages && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                    <WifiOff className="h-4 w-4 shrink-0" />
                    <span>Flowmo is offline. Your messages will be sent when connection is restored.</span>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          </div>

          {/* ── Input area ── */}
          <div className="shrink-0 p-4">
            <div className="max-w-3xl mx-auto">
              {/* File previews */}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
                  {pendingFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="relative group/file">
                      {isImageFile(file) && pendingImagePreview ? (
                        <ImageWithLoader src={pendingImagePreview} alt="Preview" wrapperClassName="h-16 w-16 rounded-lg" className="h-16 w-16 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs">
                          <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0">{getFileLabel(file)}</span>
                        </div>
                      )}
                      <button type="button" onClick={() => removeFile(idx)} className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600 opacity-0 group-hover/file:opacity-100 transition-opacity" title="Remove">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf,.pdf,.xlsx,.xls,.docx,.doc,.csv,.txt" className="hidden" onChange={handleFileSelect} />

              {/* Slash command menu */}
              {showSlashMenu && menuLength > 0 && (
                <div className="mb-2 mx-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                  {activeCategory && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border hover:bg-muted/50"
                      onClick={() => { setActiveCategory(null); setSlashSelectedIndex(0); setInputText("/"); textareaRef.current?.focus(); }}
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span className="shrink-0">{activeCategory.icon}</span>
                      <span className="font-medium">{activeCategory.command}</span>
                    </button>
                  )}
                  <div className="max-h-[320px] overflow-y-auto">
                    {!activeCategory
                      ? filteredCategories.map((cat, index) => (
                          <button
                            key={cat.command}
                            type="button"
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                              index === slashSelectedIndex ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-muted/50",
                            )}
                            onMouseEnter={() => setSlashSelectedIndex(index)}
                            onClick={() => selectCategory(cat)}
                          >
                            <span className="shrink-0 text-muted-foreground">{cat.icon}</span>
                            <span className="font-medium text-foreground">{cat.command}</span>
                            <span className="text-muted-foreground truncate">{cat.description}</span>
                            <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                          </button>
                        ))
                      : filteredSubs.map((sub, index) => (
                          <button
                            key={sub.label}
                            type="button"
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                              index === slashSelectedIndex ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-muted/50",
                            )}
                            onMouseEnter={() => setSlashSelectedIndex(index)}
                            onClick={() => selectSubCommand(sub)}
                          >
                            <span className="font-medium text-foreground">{sub.label}</span>
                            <span className="text-muted-foreground truncate">{sub.description}</span>
                          </button>
                        ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-3" data-tour="flowmo-input">
                <div className="relative flex-1 min-w-0">
                  <textarea ref={textareaRef} rows={1}
                    placeholder={isRecording ? "Listening..." : pendingFiles.length ? "Describe what to do with these files..." : 'Message Flowmo... (type "/" for commands)'}
                    className="min-h-[46px] max-h-[120px] w-full resize-none rounded-2xl border border-border bg-background py-3 pl-4 pr-24 text-sm leading-[22px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                    value={inputText} onChange={(e) => handleInputChange(e.target.value)} onKeyDown={handleKeyDown}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {voiceSupported && (
                      <button type="button" onClick={toggleVoice}
                        className={cn("grid h-8 w-8 place-items-center rounded-full focus:outline-none transition-colors",
                          isRecording ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 animate-pulse" : "text-muted-foreground hover:bg-muted"
                        )} title={isRecording ? "Stop recording" : "Voice input"}>
                        {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </button>
                    )}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted focus:outline-none" title="Attach files">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted focus:outline-none" title="Upload image">
                      <ImagePlus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={isSending || (!inputText.trim() && !pendingFiles.length)} className="h-[46px] shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-5">
                  <Send />{pendingFiles.length ? "Analyze" : "Send"}
                </Button>
              </form>

              {/* Workspace picker */}
              <div className="flex items-center gap-2 mt-2 px-1" data-tour="flowmo-workspace">
                <div className="relative">
                  <button type="button" onClick={() => setShowWorkspacePicker((v) => !v)}
                    className={cn("flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-colors",
                      selectedWorkspace ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300" : "border-border bg-background text-muted-foreground hover:bg-muted")}>
                    <FolderOpen className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{selectedWorkspace ? selectedWorkspace.name : "All workspaces"}</span>
                    <ChevronDown className="ml-auto h-2.5 w-2.5 shrink-0" />
                  </button>
                  {showWorkspacePicker && (
                    <div className="absolute left-0 bottom-full mb-1 w-56 z-50 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                      <ScrollArea className="max-h-[200px]">
                        <button type="button" className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/50", !selectedWorkspace && "bg-indigo-50 dark:bg-indigo-950/30")} onClick={() => { setSelectedWorkspace(null); setShowWorkspacePicker(false); }}>
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" /><span>All workspaces</span>{!selectedWorkspace && <Check className="ml-auto h-3 w-3 text-indigo-600" />}
                        </button>
                        {workspaces.map((ws) => (
                          <button key={ws.id} type="button" className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/50", selectedWorkspace?.id === ws.id && "bg-indigo-50 dark:bg-indigo-950/30")} onClick={() => { setSelectedWorkspace(ws); setShowWorkspacePicker(false); }}>
                            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{ws.name}</span>{selectedWorkspace?.id === ws.id && <Check className="ml-auto h-3 w-3 text-indigo-600" />}
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sessions sidebar ── */}
        {showSessions && (
          <div className="absolute top-0 right-0 bottom-0 z-40 flex">
            <div className="flex-1" onClick={() => setShowSessions(false)} />
            <div className="w-72 h-full bg-card border-l border-border flex flex-col shadow-xl animate-in slide-in-from-right-2 duration-200">
              <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Chat History</span>
              </div>
              <div className="px-3 py-2 border-b border-border shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                </div>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-2">
                  {sessionHistory.length === 0 && <div className="px-4 py-10 text-center text-xs text-muted-foreground">No previous chats yet.<br />Start a conversation to see it here.</div>}
                  {groupedSessions.length === 0 && sessionHistory.length > 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground">No chats match "{searchQuery}"</div>}
                  {groupedSessions.map((group) => (
                    <div key={group.label} className="mb-3 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</div>
                      {group.entries.map((entry) => {
                        const isActive = entry.id === activeHistoryId;
                        const isRen = renamingId === entry.id;
                        return (
                          <div key={entry.id} className={cn("group relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer transition-colors", isActive ? "bg-indigo-50 dark:bg-indigo-950/30 text-foreground" : "bg-gray-50 dark:bg-gray-900/40 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-foreground")} onClick={() => { if (!isRen) { loadSession(entry.id); setShowSessions(false); setKebabOpenId(null); setVisibleCount(PAGE_SIZE); } }}>
                            <div className="flex-1 min-w-0">
                              {isRen ? (
                                <input type="text" className="w-full bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400" value={renameValue} autoFocus
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { renameSession(entry.id, renameValue.trim() || entry.title); setRenamingId(null); } if (e.key === "Escape") setRenamingId(null); }}
                                  onBlur={() => { renameSession(entry.id, renameValue.trim() || entry.title); setRenamingId(null); }}
                                  onClick={(e) => e.stopPropagation()} />
                              ) : <div className="truncate">{entry.title}</div>}
                            </div>
                            {!isRen && (
                              <div className="relative shrink-0">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setKebabOpenId((p) => p === entry.id ? null : entry.id); }} className={cn("grid h-6 w-6 place-items-center rounded hover:bg-background transition-opacity", kebabOpenId === entry.id ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                                {kebabOpenId === entry.id && (
                                  <div className="absolute right-0 top-full mt-1 z-50 w-32 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                                    <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted" onClick={(e) => { e.stopPropagation(); setKebabOpenId(null); }}><Pin className="h-3 w-3" /> Pin</button>
                                    <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted" onClick={(e) => { e.stopPropagation(); setRenamingId(entry.id); setRenameValue(entry.title); setKebabOpenId(null); }}><Edit3 className="h-3 w-3" /> Rename</button>
                                    <button type="button" className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={(e) => { e.stopPropagation(); deleteSessionHistory(entry.id); setKebabOpenId(null); }}><Trash2 className="h-3 w-3" /> Delete</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Page Tour overlay */}
      {tourActive && flowmoTour && flowmoTour.steps[tourStepIndex] && (
        <SpotlightOverlay
          step={flowmoTour.steps[tourStepIndex]}
          stepIndex={tourStepIndex}
          totalSteps={flowmoTour.steps.length}
          onNext={() => {
            const next = tourStepIndex + 1;
            if (next >= flowmoTour.steps.length) { setTourActive(false); return; }
            setTourStepIndex(next);
          }}
          onPrev={() => { if (tourStepIndex > 0) setTourStepIndex(tourStepIndex - 1); }}
          onClose={() => setTourActive(false)}
        />
      )}
    </div>
  );
};

export default FlowmoChat;
