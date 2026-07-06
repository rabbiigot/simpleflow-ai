import githubIcon from "@/assets/github.svg";
import googleIcon from "@/assets/google.png";
import trelloIcon from "@/assets/trello.svg";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GroupChat from "@/components/social/GroupChat";
import { useInvalidation } from "@/hooks/use-invalidation";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  createWorkspaceChannel,
  getChatChannel,
  addWorkspaceStatus,
  addWorkspaceMember,
  createSocialPost,
  getChatChannels,
  createWorkspaceTask,
  deleteWorkspaceColumn,
  deleteWorkspaceTask,
  getChannelMembersForInvite,
  getCurrentUserId,
  getNotificationPreferences,
  getWorkspaceById,
  getWorkspaceTaskLabels,
  inviteWorkspaceMember,
  moveWorkspaceTask,
  removeWorkspaceMember,
  sendChatMessage,
  setNotificationPreference,
  toggleWorkspaceCalendar,
  toggleWorkspaceGitHub,
  toggleWorkspaceTrello,
  updateWorkspace,
  updateWorkspaceColumn,
  updateWorkspaceTask,
  type ChatChannel,
  type Workspace,
  type WorkspaceUser,
} from "@/lib/backend-api";
import { emitInvalidation } from "@/lib/invalidation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  Check,
  Filter,
  GanttChartSquare,
  LayoutDashboard,
  LayoutGrid,
  List,
  Loader2,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Target,
  UserPlus,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DashboardView } from "./components/DashboardView";
import { WorkspaceCalendarView } from "./components/WorkspaceCalendarView";
import { GanttChart } from "./components/GanttChart";
import { ListView } from "./components/ListView";
import { SortableTaskCard } from "./components/SortableTaskCard";
import { TaskDragPreview } from "./components/TaskDragPreview";
import { TaskEditorDialog, postTaskActivity } from "./components/TaskEditorDialog";
import { WorkspaceColumn } from "./components/WorkspaceColumn";
import type {
  ColumnColorMap,
  TaskEditorState,
  TaskLabel,
  TaskMeta,
} from "./types/workspace.types";
import { DEFAULT_COLUMN_COLORS } from "./utils/color";
import {
  mergeCustomFieldValues,
  parseTaskMeta,
} from "./utils/task-meta";

type ViewMode = "board" | "list";

export default function WorkspaceProjects() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const workspaceId = params.projectId as string | undefined;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newColumnName, setNewColumnName] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Workspace title is truncated beside the back arrow; click to expand it fully.
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [showFilterCard, setShowFilterCard] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const { tab: projectTab = "dashboard" } = useSearch({ strict: false }) as { tab?: "dashboard" | "tasks" | "channel" | "gantt" | "calendar" };
  const setProjectTab = useCallback((tab: "dashboard" | "tasks" | "channel" | "gantt" | "calendar") => {
    navigate({ search: { tab } as any, replace: true });
  }, [navigate]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<string | null>(null);
  const [fullChannel, setFullChannel] = useState<ChatChannel | null>(null);

  // Notification mute state
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    getNotificationPreferences()
      .then((prefs) => {
        const pref = prefs.find((p) => String(p.boardId) === workspaceId);
        setIsMuted(pref?.muted ?? false);
      })
      .catch(() => {});
  }, [workspaceId]);

  const handleToggleMuteWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    await setNotificationPreference(Number(workspaceId), !isMuted).catch(() => {});
    setIsMuted((prev) => !prev);
    toast.success(isMuted ? "Notifications enabled" : "Notifications muted");
  }, [workspaceId, isMuted]);

  // Auto-fetch channel data when landing on the channel tab (e.g. on reload)
  useEffect(() => {
    if (projectTab === "channel" && workspace?.channel && !fullChannel) {
      getChatChannel(String(workspace.channel.id))
        .then(setFullChannel)
        .catch(() => {});
    }
  }, [projectTab, workspace?.channel, fullChannel]);

  type FilterState = {
    status: string;
    priority: string;
    label: string;
    assignee: string;
    startDate: string;
    dueDate: string;
    hideCompleted: boolean;
  };

  const defaultFilters: FilterState = {
    status: "all",
    priority: "all",
    label: "all",
    assignee: "all",
    startDate: "",
    dueDate: "",
    hideCompleted: false,
  };

  const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters);
  const [columnColors, setColumnColors] = useState<ColumnColorMap>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [backendLabels, setBackendLabels] = useState<TaskLabel[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (!workspaceId) return "board";
    try {
      const saved = localStorage.getItem(`workspace-view-mode:${workspaceId}`);
      return saved === "list" ? "list" : "board";
    } catch {
      return "board";
    }
  });

  const [editor, setEditor] = useState<TaskEditorState | null>(null);
  const [editorSnapshot, setEditorSnapshot] = useState<TaskEditorState | null>(null);
  const [isSavingEditor, setIsSavingEditor] = useState(false);
  const [isDeletingTaskId, setIsDeletingTaskId] = useState<string | null>(null);

  // Invite members state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [channelSuggestions, setChannelSuggestions] = useState<Array<WorkspaceUser & { channelName: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const isMobile = useIsMobile();
  const [showGitHubOwnerModal, setShowGitHubOwnerModal] = useState(false);

  // Share task state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareTaskTitle, setShareTaskTitle] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareChannelIds, setShareChannelIds] = useState<string[]>([]);
  const [shareChatChannelIds, setShareChatChannelIds] = useState<string[]>([]);
  const [userChannels, setUserChannels] = useState<Array<{ id: number | string; name: string }>>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const loadWorkspace = async (silent = false) => {
    if (!workspaceId) {
      setErrorMessage("Missing workspace id");
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await getWorkspaceById(workspaceId);
      setWorkspace(data);
      try {
        const labelsResponse = await getWorkspaceTaskLabels(workspaceId);
        setBackendLabels(labelsResponse.labels || []);
      } catch {
        setBackendLabels([]);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load workspace details",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    try {
      const raw = window.localStorage.getItem(
        `workspace-column-colors:${workspaceId}`,
      );
      if (!raw) return;
      const parsed = JSON.parse(raw) as ColumnColorMap;
      setColumnColors(parsed);
    } catch {
      // ignore broken saved colors
    }
  }, [workspaceId]);

  useInvalidation(["workspaces"], () => {
    void loadWorkspace(true);
  });

  const handleToggleGitHub = useCallback(async () => {
    if (!workspaceId || !workspace) return;
    const newVal = !workspace.githubEnabled;
    try {
      await toggleWorkspaceGitHub(workspaceId, newVal);
      await loadWorkspace(true);
      toast.success(newVal ? "GitHub integration enabled" : "GitHub integration disabled");
    } catch {
      toast.error("Failed to toggle GitHub integration");
    }
  }, [workspaceId, workspace]);

  const handleToggleCalendar = useCallback(async () => {
    if (!workspaceId || !workspace) return;
    const newVal = !workspace.calendarEnabled;
    try {
      await toggleWorkspaceCalendar(workspaceId, newVal);
      await loadWorkspace(true);
      toast.success(newVal ? "Google Calendar enabled" : "Google Calendar disabled");
    } catch {
      toast.error("Failed to toggle Google Calendar");
    }
  }, [workspaceId, workspace]);

  const handleToggleTrello = useCallback(async () => {
    if (!workspaceId || !workspace) return;
    const newVal = !workspace.trelloEnabled;
    try {
      await toggleWorkspaceTrello(workspaceId, newVal);
      await loadWorkspace(true);
      toast.success(newVal ? "Trello integration enabled" : "Trello integration disabled");
    } catch {
      toast.error("Failed to toggle Trello integration");
    }
  }, [workspaceId, workspace]);

  // Close member dropdown on outside click
  const closeMemberDropdown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-member-dropdown]")) {
      setShowMemberDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showMemberDropdown) {
      document.addEventListener("mousedown", closeMemberDropdown);
      return () => document.removeEventListener("mousedown", closeMemberDropdown);
    }
  }, [showMemberDropdown, closeMemberDropdown]);

  useEffect(() => {
    // On mobile the menu is a centered modal with its own backdrop, so skip the
    // popover outside-click handler there.
    if (!showWorkspaceMenu || isMobile) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-workspace-menu]")) {
        setShowWorkspaceMenu(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showWorkspaceMenu, isMobile]);

  const handleCreateChannel = async () => {
    if (!workspaceId || !workspace) return;
    const userId = Number(getCurrentUserId());
    if (!userId) return;
    setIsCreatingChannel(true);
    try {
      await createWorkspaceChannel(workspaceId, {
        name: workspace.name,
        createdById: userId,
      });
      await loadWorkspace(true);
    } catch {
      setErrorMessage("Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const postToWorkspaceChannel = (activity: string) => {
    const channelId = workspace?.channel?.id;
    const userId = getCurrentUserId();
    if (!channelId || !userId) return;
    sendChatMessage(String(channelId), userId, `@@activity@@${activity}`).catch(() => {});
  };

  const handleSaveDescription = async (desc: string) => {
    if (!workspaceId) return;
    try {
      await updateWorkspace(workspaceId, { description: desc.trim() });
      setWorkspace((prev) => prev ? { ...prev, description: desc.trim() } : prev);
    } catch {
      // ignore
    }
    setIsEditingDescription(false);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (workspaceId) {
      localStorage.setItem(`workspace-view-mode:${workspaceId}`, mode);
    }
  };

  const members = workspace?.members ?? [];
  const currentUserId = getCurrentUserId();

  const openInviteDialog = async () => {
    setIsInviteOpen(true);
    if (workspaceId && currentUserId) {
      try {
        const suggestions = await getChannelMembersForInvite(workspaceId, currentUserId);
        setChannelSuggestions(suggestions);
      } catch {
        setChannelSuggestions([]);
      }
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!workspaceId) return;
    setIsInviting(true);
    try {
      await addWorkspaceMember(workspaceId, userId);
      await loadWorkspace(true);
      setChannelSuggestions((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // already a member
    } finally {
      setIsInviting(false);
    }
  };

  const handleInviteByEmail = async () => {
    if (!workspaceId || !inviteEmail.trim() || !currentUserId) return;
    setIsInviting(true);
    try {
      const result = await inviteWorkspaceMember(workspaceId, inviteEmail.trim(), Number(currentUserId));
      await loadWorkspace(true);
      setInviteEmail("");
      setIsInviteOpen(false);
      if (result.autoAdded) {
        toast.success("User added to workspace");
      } else if ((result as any).emailSent === false) {
        toast.warning("Invite created but email could not be sent");
      } else {
        toast.success("Invite email sent successfully");
      }
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!workspaceId) return;
    try {
      await removeWorkspaceMember(workspaceId, userId);
      await loadWorkspace(true);
    } catch {
      // handle error
    }
  };

  const handleOpenShare = async (_taskId: string, title: string) => {
    setShareTaskTitle(title);
    setShareMessage("");
    setShareChannelIds([]);
    setShareChatChannelIds([]);
    setIsShareOpen(true);
    if (currentUserId) {
      try {
        const channels = await getChatChannels(currentUserId);
        setUserChannels(channels.map((ch) => ({ id: ch.id, name: ch.name })));
      } catch {
        setUserChannels([]);
      }
    }
  };

  const handleShareAsPost = async () => {
    if (!currentUserId) return;
    setIsSharing(true);
    const taskContent = JSON.stringify({
      _type: "task-card",
      title: shareTaskTitle,
      workspace: workspace?.name || "Unknown",
      message: shareMessage.trim(),
    });
    try {
      // Share to feed (public or channel feeds)
      if (shareChannelIds.length > 0 || shareChatChannelIds.length === 0) {
        const visibility = shareChannelIds.length > 0 ? "CHANNELS" as const : "PUBLIC" as const;
        await createSocialPost({
          userId: currentUserId,
          content: taskContent,
          visibility,
          channelIds: shareChannelIds.length > 0 ? shareChannelIds : undefined,
        });
      }
      // Share to channel chats
      for (const channelId of shareChatChannelIds) {
        await sendChatMessage(channelId, currentUserId, taskContent);
      }
      setIsShareOpen(false);
      setShareMessage("");
      setShareChannelIds([]);
      setShareChatChannelIds([]);
    } catch {
      // handle error
    } finally {
      setIsSharing(false);
    }
  };

  const columns = useMemo(() => {
    return [...(workspace?.columns ?? [])].sort((a, b) => {
      // COMPLETED columns always go last
      const aCompleted = a.type === "COMPLETED" ? 1 : 0;
      const bCompleted = b.type === "COMPLETED" ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;
      return a.position - b.position;
    });
  }, [workspace]);

  const effectiveColumnColors = useMemo(() => {
    const mapped: ColumnColorMap = {};
    columns.forEach((column, index) => {
      if (columnColors[String(column.id)]) {
        mapped[String(column.id)] = columnColors[String(column.id)];
      } else if (column.type === "COMPLETED") {
        mapped[String(column.id)] = "#06b6d4";
      } else {
        mapped[String(column.id)] =
          DEFAULT_COLUMN_COLORS[index % DEFAULT_COLUMN_COLORS.length];
      }
    });
    return mapped;
  }, [columns, columnColors]);

  const visibleColumns = useMemo(() => {
    const f = appliedFilters;
    return columns
      .filter((column) => {
        // Status filter: match by column id
        if (f.status !== "all" && String(column.id) !== f.status) return false;
        // Hide completed: hide COMPLETED-type columns entirely
        if (f.hideCompleted && column.type === "COMPLETED") return false;
        return true;
      })
      .map((column) => {
        const filteredTasks = (column.tasks ?? []).filter((task) => {
          const meta = parseTaskMeta(task.customFieldValues);
          const matchesSearch =
            !searchQuery.trim() ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase());

          const matchesPriority =
            f.priority === "all" || meta.priority === f.priority;

          const matchesLabel =
            f.label === "all" ||
            meta.labels.some((l) => l.name.toLowerCase() === f.label.toLowerCase());

          const matchesAssignee =
            f.assignee === "all" ||
            meta.assigneeIds.includes(f.assignee) ||
            String(task.assigneeId) === f.assignee;

          let matchesStartDate = true;
          if (f.startDate) {
            if (meta.startDate) {
              matchesStartDate = meta.startDate >= f.startDate;
            } else {
              matchesStartDate = false;
            }
          }

          let matchesDueDate = true;
          if (f.dueDate) {
            if (meta.dueDate) {
              matchesDueDate = meta.dueDate <= f.dueDate;
            } else {
              matchesDueDate = false;
            }
          }

          return matchesSearch && matchesPriority && matchesLabel && matchesAssignee && matchesStartDate && matchesDueDate;
        });

        return {
          ...column,
          tasks: filteredTasks,
        };
      });
  }, [columns, searchQuery, appliedFilters]);

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    return (
      columns
        .flatMap((column) => column.tasks ?? [])
        .find((task) => String(task.id) === activeTaskId) || null
    );
  }, [columns, activeTaskId]);

  const labelCatalog = useMemo(() => {
    const map = new Map<string, TaskLabel>();
    backendLabels.forEach((label) => {
      const key = label.name.trim().toLowerCase();
      if (!key) return;
      map.set(key, label);
    });
    columns.forEach((column) => {
      (column.tasks ?? []).forEach((task) => {
        const meta = parseTaskMeta(task.customFieldValues);
        meta.labels.forEach((label) => {
          const key = label.name.trim().toLowerCase();
          if (!key) return;
          if (!map.has(key)) {
            map.set(key, {
              name: label.name.trim(),
              color: label.color || "#94a3b8",
            });
          }
        });
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [columns, backendLabels]);

  const allLabels = labelCatalog;

  const buildEditorState = (
    task: NonNullable<
      NonNullable<Workspace["columns"]>[number]["tasks"]
    >[number],
    columnId: string,
    mode: "create" | "edit",
  ) => {
    const meta = parseTaskMeta(task.customFieldValues);
    return {
      mode,
      taskId: String(task.id),
      originalColumnId: columnId,
      columnId,
      title: task.title,
      description: task.description || "",
      labels: meta.labels,
      selectedExistingLabel: "",
      newLabelName: "",
      newLabelColor: "#94a3b8",
      _labelDropdownOpen: false,
      priority: meta.priority,
      startDate: meta.startDate,
      dueDate: meta.dueDate,
      repeat: meta.repeat,
      notes: meta.notes,
      checklist: meta.checklist,
      newChecklistItem: "",
      attachments: meta.attachments,
      newAttachment: "",
      assigneeIds: (() => {
        const ids: string[] = [];
        if (task.assigneeId) ids.push(String(task.assigneeId));
        for (const id of meta.assigneeIds) {
          if (!ids.includes(id)) ids.push(id);
        }
        return ids;
      })(),
      calendarEvent: meta.calendarEvent,
    } satisfies TaskEditorState;
  };

  const openEditor = (
    task: NonNullable<
      NonNullable<Workspace["columns"]>[number]["tasks"]
    >[number],
    columnId: string,
  ) => {
    const state = buildEditorState(task, columnId, "edit");
    setEditor(state);
    setEditorSnapshot({ ...state });
  };

  const openCreateEditor = (columnId?: string) => {
    const fallbackColumnId =
      columnId || (columns[0]?.id ? String(columns[0].id) : "");
    const state: TaskEditorState = {
      mode: "create",
      taskId: "",
      originalColumnId: fallbackColumnId,
      columnId: fallbackColumnId,
      title: "",
      description: "",
      labels: [],
      selectedExistingLabel: "",
      newLabelName: "",
      newLabelColor: "#94a3b8",
      _labelDropdownOpen: false,
      priority: "medium",
      startDate: "",
      dueDate: "",
      repeat: "none",
      notes: "",
      checklist: [],
      newChecklistItem: "",
      attachments: [],
      newAttachment: "",
      assigneeIds: [],
    };
    setEditor(state);
    setEditorSnapshot({ ...state });
  };

  const handleAddColumn = async () => {
    if (!workspaceId || !newColumnName.trim()) return;
    setIsAddingColumn(true);
    setErrorMessage(null);

    try {
      await addWorkspaceStatus(workspaceId, { name: newColumnName.trim() });
      setNewColumnName("");
      await loadWorkspace(true);
      emitInvalidation(["workspaces"], ["workspace.addStatus"]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to add bucket",
      );
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleColumnColorChange = (columnId: string, color: string) => {
    setColumnColors((prev) => {
      const next = { ...prev, [columnId]: color };
      if (workspaceId) {
        window.localStorage.setItem(
          `workspace-column-colors:${workspaceId}`,
          JSON.stringify(next),
        );
      }
      return next;
    });
  };

  const handleColumnRename = async (columnId: string, name: string) => {
    if (!workspaceId) return;
    // Optimistic update — no re-fetch, no flicker
    setWorkspace((prev) => {
      if (!prev?.columns) return prev;
      return {
        ...prev,
        columns: prev.columns.map((col) =>
          String(col.id) === columnId ? { ...col, name } : col,
        ),
      };
    });
    try {
      await updateWorkspaceColumn(workspaceId, columnId, { name });
    } catch {
      // Revert on error
      await loadWorkspace(true);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!workspaceId) return;
    try {
      await deleteWorkspaceColumn(workspaceId, columnId);
      await loadWorkspace(true);
      emitInvalidation(["workspaces"], ["workspace.deleteColumn"]);
    } catch {
      setErrorMessage("Failed to delete bucket");
    }
  };

  const updateWorkspaceTaskLocalMove = (taskId: string, toColumnId: string) => {
    setWorkspace((prev) => {
      if (!prev?.columns) return prev;
      const nextColumns = prev.columns.map((col) => ({
        ...col,
        tasks: [...(col.tasks ?? [])],
      }));

      let movingTask:
        | NonNullable<
            NonNullable<Workspace["columns"]>[number]["tasks"]
          >[number]
        | null = null;

      for (const col of nextColumns) {
        const idx = (col.tasks ?? []).findIndex(
          (task) => String(task.id) === taskId,
        );
        if (idx >= 0) {
          movingTask = col.tasks?.splice(idx, 1)[0] || null;
          break;
        }
      }

      if (!movingTask) return prev;

      const dest = nextColumns.find((col) => String(col.id) === toColumnId);
      if (!dest) return prev;
      dest.tasks = [movingTask, ...(dest.tasks ?? [])];

      return { ...prev, columns: nextColumns };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null);
    if (!workspaceId || !workspace) return;

    const activeId = String(event.active.id || "");
    const overId = String(event.over?.id || "");

    if (!activeId.startsWith("task-")) return;

    const taskId = activeId.replace("task-", "");
    const sourceColumnId = String(event.active.data.current?.columnId || "");

    if (!sourceColumnId) return;

    let destinationColumnId = "";

    if (overId.startsWith("column-")) {
      destinationColumnId = overId.replace("column-", "");
    }

    if (overId.startsWith("task-")) {
      const overTaskId = overId.replace("task-", "");
      const destinationColumn = columns.find((column) =>
        (column.tasks ?? []).some((task) => String(task.id) === overTaskId),
      );
      destinationColumnId = destinationColumn
        ? String(destinationColumn.id)
        : "";
    }

    if (!destinationColumnId || destinationColumnId === sourceColumnId) return;

    const destinationColumn = columns.find(
      (column) => String(column.id) === destinationColumnId,
    );
    if (!destinationColumn) return;

    const sourceColumn = columns.find((c) => String(c.id) === sourceColumnId);
    const sourceColumnName = sourceColumn?.name ?? "";

    updateWorkspaceTaskLocalMove(taskId, destinationColumnId);

    try {
      await moveWorkspaceTask(workspaceId, taskId, {
        status: destinationColumn.name,
      });

      // Log activity
      const userId = getCurrentUserId();
      if (userId && sourceColumnName !== destinationColumn.name) {
        const taskTitle = columns
          .flatMap((c) => c.tasks ?? [])
          .find((t) => String(t.id) === taskId)?.title || "Task";
        const moveMsg = `moved from ${sourceColumnName} to ${destinationColumn.name}`;
        await postTaskActivity(workspaceId, taskId, userId, moveMsg);
        postToWorkspaceChannel(`${taskTitle} ${moveMsg}`);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to move task",
      );
      await loadWorkspace(true);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id || "");
    if (!activeId.startsWith("task-")) return;
    setActiveTaskId(activeId.replace("task-", ""));
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskTarget(taskId);
  };

  const confirmDeleteTask = async () => {
    if (!workspaceId || !deleteTaskTarget) return;
    const taskTitle = columns.flatMap((c) => c.tasks ?? []).find((t) => String(t.id) === deleteTaskTarget)?.title || "Task";
    setIsDeletingTaskId(deleteTaskTarget);
    setDeleteTaskTarget(null);
    setErrorMessage(null);
    try {
      await deleteWorkspaceTask(workspaceId, deleteTaskTarget);
      postToWorkspaceChannel(`deleted task "${taskTitle}"`);
      await loadWorkspace(true);
      emitInvalidation(["workspaces"], ["workspace.deleteTask"]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete task",
      );
    } finally {
      setIsDeletingTaskId(null);
    }
  };

  const handleQuickAssign = async (taskId: string, assigneeId: number | null) => {
    if (!workspaceId) return;

    // Find the task to get current meta
    const task = columns
      .flatMap((c) => c.tasks ?? [])
      .find((t) => String(t.id) === taskId);
    if (!task) return;

    const meta = parseTaskMeta(task.customFieldValues);
    let newAssigneeIds: string[];

    if (assigneeId === null) {
      // Unassign all
      newAssigneeIds = [];
    } else {
      const idStr = String(assigneeId);
      if (meta.assigneeIds.includes(idStr)) {
        // Toggle off
        newAssigneeIds = meta.assigneeIds.filter((id) => id !== idStr);
      } else {
        // Toggle on
        newAssigneeIds = [...meta.assigneeIds, idStr];
      }
    }

    const updatedMeta = { ...meta, assigneeIds: newAssigneeIds };
    const primaryAssignee = newAssigneeIds.length > 0 ? Number(newAssigneeIds[0]) : undefined;

    try {
      await updateWorkspaceTask(workspaceId, taskId, {
        assigneeId: primaryAssignee,
        customFieldValues: mergeCustomFieldValues(task.customFieldValues, updatedMeta),
      });

      // Log activity
      const userId = getCurrentUserId();
      if (userId) {
        if (assigneeId === null) {
          await postTaskActivity(workspaceId, taskId, userId, "removed all assignees");
        } else {
          const member = members.find((m) => m.userId === assigneeId);
          const name = member
            ? `${member.user.firstName} ${member.user.lastName}`
            : `user #${assigneeId}`;
          const action = meta.assigneeIds.includes(String(assigneeId)) ? "unassigned" : "assigned to";
          await postTaskActivity(workspaceId, taskId, userId, `${action} ${name}`);
        }
      }

      await loadWorkspace(true);
      emitInvalidation(["workspaces"], ["workspace.updateTask"]);
    } catch {
      // silently fail
    }
  };

  const handleSaveTaskEditor = async () => {
    if (!workspaceId || !editor || !workspace) return;

    const nextMeta: TaskMeta = {
      labels: editor.labels,
      priority: editor.priority,
      startDate: editor.startDate,
      dueDate: editor.dueDate,
      repeat: editor.repeat,
      notes: editor.notes,
      checklist: editor.checklist,
      attachments: editor.attachments,
      assigneeIds: editor.assigneeIds,
    };

    const primaryAssigneeId = editor.assigneeIds[0] || "";

    setIsSavingEditor(true);
    setErrorMessage(null);

    try {
      if (editor.mode === "create") {
        await createWorkspaceTask(workspaceId, {
          columnId: editor.columnId,
          title: editor.title.trim(),
          description:
            editor.description.trim() || editor.notes.trim() || undefined,
          assigneeId: primaryAssigneeId ? Number(primaryAssigneeId) : undefined,
          customFieldValues: mergeCustomFieldValues({}, nextMeta),
        });
        const colName = columns.find((c) => String(c.id) === editor.columnId)?.name || "";
        postToWorkspaceChannel(`created task "${editor.title.trim()}" in ${colName}`);
      } else {
        const currentTask = columns
          .flatMap((column) =>
            (column.tasks ?? []).map((task) => ({
              task,
              columnId: String(column.id),
            })),
          )
          .find((item) => String(item.task.id) === editor.taskId)?.task;

        if (!currentTask) {
          setErrorMessage("Task no longer exists.");
          return;
        }

        await updateWorkspaceTask(workspaceId, editor.taskId, {
          title: editor.title.trim(),
          description:
            editor.description.trim() || editor.notes.trim() || undefined,
          assigneeId: primaryAssigneeId ? Number(primaryAssigneeId) : null,
          customFieldValues: mergeCustomFieldValues(
            currentTask.customFieldValues,
            nextMeta,
          ),
        });

        if (editor.columnId !== editor.originalColumnId) {
          const destination = columns.find(
            (column) => String(column.id) === editor.columnId,
          );
          if (destination) {
            await moveWorkspaceTask(workspaceId, editor.taskId, {
              status: destination.name,
            });
          }
        }

        // Post activity entries for field changes
        if (currentUserId && editor.taskId) {
          const oldTitle = currentTask.title ?? "";
          const oldDescription = currentTask.description ?? "";
          const oldAssignees = currentTask.assigneeId ? [String(currentTask.assigneeId)] : [];
          const oldColumn = columns.find((c) =>
            (c.tasks ?? []).some((t) => String(t.id) === editor.taskId),
          );
          const oldColumnName = oldColumn?.name ?? "";
          const newColumnName = columns.find((c) => String(c.id) === editor.columnId)?.name ?? "";

          const activities: string[] = [];
          const oldMeta = parseTaskMeta(currentTask.customFieldValues);

          // Title
          if (editor.title.trim() !== oldTitle) {
            activities.push(`updated the title to "${editor.title.trim()}"`);
          }

          // Description
          const newDesc = editor.description.trim() || editor.notes.trim() || "";
          if (newDesc !== oldDescription) {
            activities.push("updated the description");
          }

          // Assignees
          if (JSON.stringify(editor.assigneeIds) !== JSON.stringify(oldAssignees)) {
            if (editor.assigneeIds.length === 0) {
              activities.push("removed the assignee");
            } else {
              const names = editor.assigneeIds
                .map((id) => members.find((m) => String(m.userId) === id))
                .filter(Boolean)
                .map((m) => `${m!.user.firstName} ${m!.user.lastName}`)
                .join(", ");
              activities.push(`assigned to ${names}`);
            }
          }

          // Column move
          if (editor.columnId !== editor.originalColumnId && newColumnName !== oldColumnName) {
            activities.push(`moved from ${oldColumnName} to ${newColumnName}`);
            postToWorkspaceChannel(`${editor.title} moved from ${oldColumnName} to ${newColumnName}`);
          }

          // Priority
          if (editor.priority !== oldMeta.priority) {
            activities.push(`changed priority to ${editor.priority}`);
          }

          // Start date
          if (editor.startDate !== oldMeta.startDate) {
            if (editor.startDate) {
              activities.push(`set start date to ${new Date(editor.startDate).toLocaleDateString()}`);
            } else {
              activities.push("removed the start date");
            }
          }

          // Due date
          if (editor.dueDate !== oldMeta.dueDate) {
            if (editor.dueDate) {
              activities.push(`set due date to ${new Date(editor.dueDate).toLocaleDateString()}`);
            } else {
              activities.push("removed the due date");
            }
          }

          // Checklist items
          const oldChecked = oldMeta.checklist.filter((i) => i.done).length;
          const newChecked = editor.checklist.filter((i) => i.done).length;
          const oldTotal = oldMeta.checklist.length;
          const newTotal = editor.checklist.length;
          if (newTotal !== oldTotal) {
            const diff = newTotal - oldTotal;
            if (diff > 0) {
              activities.push(`added ${diff} checklist item${diff > 1 ? "s" : ""}`);
            } else {
              activities.push(`removed ${Math.abs(diff)} checklist item${Math.abs(diff) > 1 ? "s" : ""}`);
            }
          }
          if (newChecked !== oldChecked && newTotal === oldTotal) {
            const completed = newChecked - oldChecked;
            if (completed > 0) {
              activities.push(`completed ${completed} checklist item${completed > 1 ? "s" : ""}`);
            } else {
              activities.push(`unchecked ${Math.abs(completed)} checklist item${Math.abs(completed) > 1 ? "s" : ""}`);
            }
          }
          if (newChecked === newTotal && newTotal > 0 && oldChecked !== oldTotal) {
            activities.push("completed all checklist items");
          }

          // Attachments
          const oldAttachments = oldMeta.attachments.length;
          const newAttachments = editor.attachments.length;
          if (newAttachments > oldAttachments) {
            const added = newAttachments - oldAttachments;
            activities.push(`added ${added} attachment${added > 1 ? "s" : ""}`);
          } else if (newAttachments < oldAttachments) {
            const removed = oldAttachments - newAttachments;
            activities.push(`removed ${removed} attachment${removed > 1 ? "s" : ""}`);
          }

          for (const msg of activities) {
            await postTaskActivity(workspaceId, editor.taskId, currentUserId, msg);
          }

          // Post non-move activities to workspace channel
          const nonMoveActivities = activities.filter((a) => !a.startsWith("moved from"));
          if (nonMoveActivities.length > 0) {
            postToWorkspaceChannel(`updated task "${editor.title.trim()}" — ${nonMoveActivities.join(", ")}`);
          }
        }
      }

      await loadWorkspace(true);
      emitInvalidation(
        ["workspaces"],
        [
          editor.mode === "create"
            ? "workspace.createTask"
            : "workspace.updateTask",
          "workspace.moveTask",
        ],
      );

      if (editor.mode === "create") {
        // Close on create
        setEditor(null);
        setEditorSnapshot(null);
      } else {
        // Stay open on edit — update snapshot so isDirty becomes false (save button hides)
        const updatedState = { ...editor, originalColumnId: editor.columnId };
        setEditor(updatedState);
        setEditorSnapshot({ ...updatedState });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update task",
      );
    } finally {
      setIsSavingEditor(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading workspace...</span>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Target className="mb-3 h-12 w-12 text-muted-foreground opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">
          Workspace not found
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          This workspace may have been removed. Go back to create a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-2 flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] flex-col space-y-3 md:h-[calc(100vh-4rem)]">
      {/* Row 1: Back + Title + Description below (hidden on mobile in the channel tab to give the chat more height) */}
      <div
        className={`flex flex-col gap-3 md:flex-row md:items-start ${
          projectTab === "channel" ? "max-md:hidden" : ""
        }`}
        data-tour="workspace-header"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 shrink-0 mt-0.5"
          onClick={() => navigate({ to: "/workspace" })}
          title="Back to workspaces"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1
            onClick={() => setTitleExpanded((v) => !v)}
            title={workspace.name}
            className={`cursor-pointer text-2xl font-bold md:text-3xl ${
              titleExpanded ? "break-words" : "truncate"
            }`}
          >
            {workspace.name}
          </h1>
          {isEditingDescription ? (
            <div className="mt-1 flex items-start gap-2 max-w-lg">
              <div className="flex-1 space-y-1">
                <textarea
                  autoFocus
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  placeholder="Add a description..."
                  maxLength={200}
                  rows={1}
                  className={`w-full resize-none overflow-hidden rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    descriptionDraft.length > 200 ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (descriptionDraft.length <= 200) void handleSaveDescription(descriptionDraft);
                    }
                    if (e.key === "Escape") setIsEditingDescription(false);
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${descriptionDraft.length > 200 ? "text-red-500" : "text-muted-foreground"}`}>
                    {descriptionDraft.length}/200
                  </span>
                  {descriptionDraft.length > 200 && (
                    <span className="text-[11px] text-red-500">Maximum 200 characters only</span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => {
                  if (descriptionDraft.length <= 200) void handleSaveDescription(descriptionDraft);
                }}
                disabled={descriptionDraft.length > 200}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => setIsEditingDescription(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDescriptionDraft(workspace.description || "");
                setIsEditingDescription(true);
              }}
              className="mt-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              {workspace.description ? (
                workspace.description.length > 100 ? (
                  <>
                    <span>{workspace.description.slice(0, 100)}</span>
                    <br />
                    <span>{workspace.description.slice(100)}</span>
                  </>
                ) : (
                  workspace.description
                )
              ) : (
                "Add a description..."
              )}
            </button>
          )}
        </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 md:ml-auto">
          <div className="flex items-center gap-1 rounded-lg border p-0.5" data-tour="workspace-view-toggle">
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => handleViewModeChange("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => handleViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative w-full sm:w-64" data-tour="workspace-search">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks"
              className="h-9 pl-8"
            />
          </div>
          <div className="relative">
            <Button
              variant={showFilterCard ? "secondary" : "outline"}
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => {
                if (!showFilterCard) {
                  setDraftFilters({ ...appliedFilters });
                }
                setShowFilterCard((prev) => !prev);
              }}
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>

            {showFilterCard && (
              <div
                className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] max-w-[26rem] rounded-lg border bg-popover p-4 shadow-lg space-y-4"
                onPointerDownCapture={(e) => {
                  // Prevent clicks inside the filter card from bubbling to outside-click handlers
                  e.stopPropagation();
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Filters</p>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setShowFilterCard(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Row 1: Status | Priority */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={draftFilters.status}
                      onValueChange={(v) => setDraftFilters((p) => ({ ...p, status: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {columns.map((col) => (
                          <SelectItem key={col.id} value={String(col.id)}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Priority</Label>
                    <Select
                      value={draftFilters.priority}
                      onValueChange={(v) => setDraftFilters((p) => ({ ...p, priority: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 2: Label | Assignee */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Label</Label>
                    <Select
                      value={draftFilters.label}
                      onValueChange={(v) => setDraftFilters((p) => ({ ...p, label: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Labels</SelectItem>
                        {allLabels.map((label) => (
                          <SelectItem key={label.name} value={label.name}>
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: label.color }}
                              />
                              {label.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Assignee</Label>
                    <Select
                      value={draftFilters.assignee}
                      onValueChange={(v) => setDraftFilters((p) => ({ ...p, assignee: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.userId} value={String(m.userId)}>
                            {m.user.firstName} {m.user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 3: Start Date | Due Date */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={draftFilters.startDate}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, startDate: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={draftFilters.dueDate}
                      onChange={(e) => setDraftFilters((p) => ({ ...p, dueDate: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="hide-completed"
                      checked={draftFilters.hideCompleted}
                      onCheckedChange={(checked) =>
                        setDraftFilters((p) => ({ ...p, hideCompleted: checked === true }))
                      }
                    />
                    <Label htmlFor="hide-completed" className="text-xs cursor-pointer">
                      Hide completed tasks
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftFilters({ ...defaultFilters })}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                {JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters) && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      setAppliedFilters({ ...draftFilters });
                      setShowFilterCard(false);
                    }}
                  >
                    Apply Filters
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button className="gap-2" onClick={() => openCreateEditor()} data-tour="workspace-create-task">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
          <div className="relative" data-workspace-menu data-tour="workspace-kebab">
            <Button
              variant={showWorkspaceMenu ? "secondary" : "ghost"}
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setShowWorkspaceMenu((prev) => !prev)}
              title="Workspace settings"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showWorkspaceMenu && (
              <>
                {isMobile && (
                  <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={() => setShowWorkspaceMenu(false)}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={
                    isMobile
                      ? "fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-popover shadow-xl"
                      : "absolute right-0 top-11 z-50 w-72 rounded-md border bg-popover shadow-lg"
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                {isMobile && (
                  <div className="flex items-center justify-between border-b px-3 py-2.5">
                    <span className="text-sm font-semibold">Workspace</span>
                    <button
                      type="button"
                      onClick={() => setShowWorkspaceMenu(false)}
                      className="grid h-7 w-7 place-items-center rounded-md hover:bg-muted"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {/* Members */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Members ({members.length})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1"
                      onClick={() => { void openInviteDialog(); setShowWorkspaceMenu(false); }}
                    >
                      <UserPlus className="h-3 w-3" />
                      Invite
                    </Button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                    {members.map((m) => (
                      <div key={m.userId} className="flex items-center gap-2 rounded px-1.5 py-1.5 hover:bg-accent">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={m.user.avatarUrl || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{m.user.firstName} {m.user.lastName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{m.user.email}</div>
                        </div>
                        {m.role === "ADMIN" && (
                          <span className="text-[9px] text-muted-foreground font-medium shrink-0">Owner</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="p-2 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { handleToggleMuteWorkspace(); setShowWorkspaceMenu(false); }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    {isMuted ? <BellOff className="h-4 w-4 text-red-400" /> : <Bell className="h-4 w-4 text-amber-500" />}
                    <span>{isMuted ? "Unmute Notifications" : "Mute Notifications"}</span>
                  </button>
                  {(() => {
                    const isOwner = members.some((m) => String(m.userId) === currentUserId && m.role === "ADMIN");
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (isOwner) {
                              void handleToggleGitHub();
                              setShowWorkspaceMenu(false);
                            } else {
                              setShowWorkspaceMenu(false);
                              setShowGitHubOwnerModal(true);
                            }
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          <img src={githubIcon} alt="" className={`h-4 w-4 ${workspace.githubEnabled ? "dark:invert" : "opacity-40 dark:invert"}`} />
                          <span>GitHub Integration</span>
                          <span className={`ml-auto text-[10px] font-medium ${workspace.githubEnabled ? "text-green-600" : "text-muted-foreground"}`}>
                            {workspace.githubEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isOwner) {
                              void handleToggleCalendar();
                              setShowWorkspaceMenu(false);
                            } else {
                              setShowWorkspaceMenu(false);
                              setShowGitHubOwnerModal(true);
                            }
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          <img src={googleIcon} alt="" className={`h-4 w-4 ${workspace.calendarEnabled ? "" : "opacity-40"}`} />
                          <span>Google Calendar</span>
                          <span className={`ml-auto text-[10px] font-medium ${workspace.calendarEnabled ? "text-green-600" : "text-muted-foreground"}`}>
                            {workspace.calendarEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isOwner) {
                              void handleToggleTrello();
                              setShowWorkspaceMenu(false);
                            } else {
                              setShowWorkspaceMenu(false);
                              setShowGitHubOwnerModal(true);
                            }
                          }}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          <img src={trelloIcon} alt="" className={`h-4 w-4 ${workspace.trelloEnabled ? "dark:invert" : "opacity-40 dark:invert"}`} />
                          <span>Trello Integration</span>
                          <span className={`ml-auto text-[10px] font-medium ${workspace.trelloEnabled ? "text-green-600" : "text-muted-foreground"}`}>
                            {workspace.trelloEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </button>
                      </>
                    );
                  })()}
                </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Dashboard / Tasks / Gantt / Channel / Calendar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto" data-tour="workspace-tabs">
        <button
          type="button"
          onClick={() => setProjectTab("dashboard")}
          data-tour="workspace-tab-dashboard"
          className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            projectTab === "dashboard"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setProjectTab("tasks")}
          data-tour="workspace-tab-tasks"
          className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            projectTab === "tasks"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Tasks
        </button>
        <button
          type="button"
          onClick={() => setProjectTab("gantt")}
          data-tour="workspace-tab-gantt"
          className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            projectTab === "gantt"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GanttChartSquare className="h-3.5 w-3.5" />
          Gantt
        </button>
        <button
          type="button"
          onClick={() => {
            setProjectTab("channel");
            if (workspace.channel && !fullChannel) {
              getChatChannel(String(workspace.channel.id))
                .then(setFullChannel)
                .catch(() => {});
            }
          }}
          data-tour="workspace-tab-channel"
          className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            projectTab === "channel"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Channel
        </button>
        <button
          type="button"
          onClick={() => setProjectTab("calendar")}
          data-tour="workspace-tab-calendar"
          className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            projectTab === "calendar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Calendar
        </button>
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {projectTab === "dashboard" ? (
        <div className="min-h-0 flex-1">
          <DashboardView
            workspace={workspace}
            columns={columns}
            members={members}
            effectiveColumnColors={effectiveColumnColors}
            currentUserId={currentUserId || ""}
          />
        </div>
      ) : projectTab === "gantt" ? (
        <div className="min-h-0 flex-1">
          <GanttChart
            columns={columns}
            effectiveColumnColors={effectiveColumnColors}
            onViewTask={openEditor}
          />
        </div>
      ) : projectTab === "channel" ? (
        !workspace.channel ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">This workspace doesn't have a channel yet</p>
            {(String(workspace.ownerId) === currentUserId || members.some((m) => String(m.userId) === currentUserId && m.role === "ADMIN")) && (
              <Button
                variant="outline"
                onClick={() => void handleCreateChannel()}
                disabled={isCreatingChannel}
                className="gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                {isCreatingChannel ? "Creating..." : "Create Channel"}
              </Button>
            )}
          </div>
        ) : fullChannel ? (
          <div className="min-h-0 flex-1">
            <GroupChat
              fillParent
              channel={fullChannel}
              currentUserId={currentUserId || ""}
              currentUserName={(() => {
                const m = members.find((m) => String(m.userId) === currentUserId);
                return m ? `${m.user.firstName} ${m.user.lastName}` : "User";
              })()}
              currentUserAvatar=""
              currentUserInitials={(() => {
                const m = members.find((m) => String(m.userId) === currentUserId);
                return m ? `${m.user.firstName?.[0] || ""}${m.user.lastName?.[0] || ""}`.toUpperCase() : "U";
              })()}
              onBack={() => setProjectTab("tasks")}
              boardId={workspace ? Number(workspace.id) : undefined}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Loading channel...
          </div>
        )
      ) : projectTab === "calendar" ? (
        <div className="min-h-0 flex-1">
          <WorkspaceCalendarView
            columns={columns}
            effectiveColumnColors={effectiveColumnColors}
            workspaceId={workspace.id}
            calendarEnabled={workspace.calendarEnabled}
            currentUserId={currentUserId || ""}
            members={members}
            onViewTask={(taskId: string) => {
              for (const col of columns) {
                const task = (col.tasks ?? []).find((t) => String(t.id) === taskId);
                if (task) { openEditor(task, String(col.id)); return; }
              }
            }}
            onRefresh={() => void loadWorkspace(true)}
          />
        </div>
      ) : viewMode === "board" ? (
        <div className="min-h-0 flex-1 rounded-2xl p-1 md:p-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={() => setActiveTaskId(null)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full gap-4 overflow-x-auto p-1 pb-2">
              {visibleColumns.map((column) => (
                <SortableContext
                  key={column.id}
                  items={(column.tasks ?? []).map((task) => `task-${task.id}`)}
                  strategy={rectSortingStrategy}
                >
                  <WorkspaceColumn
                    column={column}
                    color={effectiveColumnColors[String(column.id)]}
                    onColorChange={handleColumnColorChange}
                    onRename={handleColumnRename}
                    onDelete={handleDeleteColumn}
                    onAddTask={(columnId) => {
                      openCreateEditor(columnId);
                    }}
                  >
                    {(column.tasks ?? []).length === 0 ? (
                      <p className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                        Drop a task here or click Add task.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(column.tasks ?? []).map((task) => (
                          <SortableTaskCard
                            key={task.id}
                            task={task}
                            columnId={String(column.id)}
                            columnColor={
                              effectiveColumnColors[String(column.id)]
                            }
                            onView={() => openEditor(task, String(column.id))}
                            onEdit={() => openEditor(task, String(column.id))}
                            onDelete={() =>
                              void handleDeleteTask(String(task.id))
                            }
                            members={members}
                            onAssign={(tid, aid) => void handleQuickAssign(tid, aid)}
                          />
                        ))}
                      </div>
                    )}
                  </WorkspaceColumn>
                </SortableContext>
              ))}

              <div className="h-full w-[85vw] max-w-[320px] shrink-0 rounded-xl border border-dashed border-border bg-card p-2.5 sm:w-[290px]">
                <div className="mb-2 px-1 text-sm font-semibold text-foreground">
                  Add a new bucket
                </div>
                <div className="space-y-2">
                  <Input
                    value={newColumnName}
                    onChange={(event) => setNewColumnName(event.target.value)}
                    placeholder="Bucket name"
                    className="border-border bg-card text-foreground placeholder:text-muted-foreground"
                  />
                  <Button
                    variant="outline"
                    className="w-full border-border bg-muted text-foreground hover:bg-accent"
                    onClick={() => void handleAddColumn()}
                    disabled={isAddingColumn || !newColumnName.trim()}
                  >
                    {isAddingColumn ? "Adding..." : "Add bucket"}
                  </Button>
                </div>
              </div>
            </div>
            <DragOverlay>
              {activeTask ? <TaskDragPreview task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-2xl">
          <ListView
            columns={visibleColumns}
            effectiveColumnColors={effectiveColumnColors}
            onViewTask={openEditor}
            onEditTask={openEditor}
            onDeleteTask={(taskId) => void handleDeleteTask(taskId)}
            onCreateTask={openCreateEditor}
            onMoveTask={(taskId, targetColumnName) => {
              if (!workspaceId) return;
              void moveWorkspaceTask(workspaceId, taskId, { status: targetColumnName })
                .then(() => loadWorkspace(true));
            }}
            allColumns={columns.map((c) => ({ id: String(c.id), name: c.name }))}
          />
        </div>
      )}

      <TaskEditorDialog
        editor={editor}
        setEditor={setEditor}
        columns={columns}
        columnColors={effectiveColumnColors}
        labelCatalog={labelCatalog}
        isSavingEditor={isSavingEditor}
        isDeletingTaskId={isDeletingTaskId}
        onSave={() => void handleSaveTaskEditor()}
        onDelete={(taskId) => {
          void handleDeleteTask(taskId);
          setEditor(null);
        }}
        onShare={handleOpenShare}
        workspaceId={workspaceId || undefined}
        currentUserId={currentUserId || undefined}
        members={members}
        editorSnapshot={editorSnapshot}
        githubEnabled={workspace?.githubEnabled || false}
        trelloEnabled={workspace?.trelloEnabled || false}
        trelloBoardId={workspace?.trelloBoardId ?? null}
      />

      {/* GitHub Owner-Only Modal */}
      <Dialog open={showGitHubOwnerModal} onOpenChange={setShowGitHubOwnerModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={githubIcon} alt="" className="h-5 w-5 dark:invert" />
              GitHub Integration
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const owner = members.find((m) => m.role === "ADMIN");
                const ownerName = owner ? `${owner.user.firstName} ${owner.user.lastName}`.trim() : "the workspace owner";
                return `Only the workspace owner can manage this setting. Please reach out to ${ownerName} to ${workspace?.githubEnabled ? "disable" : "enable"} GitHub integration for this workspace.`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowGitHubOwnerModal(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Members Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-md">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Invite people from your channels or by email
            </DialogDescription>
          </DialogHeader>

          {/* Current members */}
          {members.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Members ({members.length})</div>
              <div className="space-y-1">
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={m.user.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{m.user.firstName?.[0]}{m.user.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{m.user.firstName} {m.user.lastName}</div>
                        <div className="text-[11px] text-muted-foreground">{m.user.email}</div>
                      </div>
                    </div>
                    {m.role !== "ADMIN" && String(m.userId) !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => void handleRemoveMember(m.userId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {m.role === "ADMIN" && (
                      <span className="text-[10px] text-muted-foreground font-medium">Owner</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel suggestions */}
          {channelSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">From your channels</div>
              <div className="space-y-1">
                {channelSuggestions.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px]">{u.firstName?.[0]}{u.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{u.firstName} {u.lastName}</div>
                        <div className="text-[11px] text-muted-foreground">{u.channelName}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full shrink-0"
                      disabled={isInviting}
                      onClick={() => void handleAddMember(u.id)}
                      title="Add to workspace"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite by email */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Invite by email</div>
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleInviteByEmail();
                }}
              />
              <Button
                onClick={() => void handleInviteByEmail()}
                disabled={isInviting || !inviteEmail.trim()}
              >
                Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Task Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Task</DialogTitle>
            <DialogDescription>
              Share &ldquo;{shareTaskTitle}&rdquo; to your feed or a channel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Task card preview */}
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1.5 w-8 rounded-full bg-primary" />
              </div>
              <div className="text-sm font-medium text-foreground">{shareTaskTitle}</div>
              <div className="text-xs text-muted-foreground mt-0.5">From: {workspace?.name || "Unknown"}</div>
            </div>

            {/* Optional message */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Add a message (optional)</label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Say something about this task..."
                className="min-h-[70px] w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Channel selector */}
            {userChannels.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Share to channels</label>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-border p-2">
                  {userChannels.map((ch) => {
                    const id = String(ch.id);
                    const inFeed = shareChannelIds.includes(id);
                    const inChat = shareChatChannelIds.includes(id);
                    return (
                      <div key={ch.id} className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">#</span>
                          <span>{ch.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setShareChannelIds((prev) =>
                                inFeed ? prev.filter((c) => c !== id) : [...prev, id],
                              )
                            }
                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                              inFeed
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Feed
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setShareChatChannelIds((prev) =>
                                inChat ? prev.filter((c) => c !== id) : [...prev, id],
                              )
                            }
                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                              inChat
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {shareChannelIds.length === 0 && shareChatChannelIds.length === 0
                    ? "No channels selected — will share to public feed"
                    : [
                        shareChannelIds.length > 0 ? `${shareChannelIds.length} feed(s)` : "",
                        shareChatChannelIds.length > 0 ? `${shareChatChannelIds.length} chat(s)` : "",
                      ].filter(Boolean).join(", ")}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsShareOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleShareAsPost()}
                disabled={isSharing}
              >
                {isSharing ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteTaskTarget} onOpenChange={(open) => { if (!open) setDeleteTaskTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTaskTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={() => void confirmDeleteTask()}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
