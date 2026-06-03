import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CircularProgress } from "@/components/ui/circular-progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useInvalidation } from "@/hooks/use-invalidation";
import {
  addWorkspaceMember,
  createWorkspace,
  createWorkspaceBundle,
  deleteWorkspace,
  getChannelMembersForInvite,
  getCurrentUserId,
  getNotificationPreferences,
  getWorkspacesPaged,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  setNotificationPreference,
  updateWorkspace,
  type WorkspaceMember,
  type WorkspaceUser,
} from "@/lib/backend-api";
import { useAiPanelState } from "@/components/layout/rootLayout";
import { emitInvalidation } from "@/lib/invalidation";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  CalendarCheck,
  ChevronDown,
  GitBranch,
  Circle,
  CircleCheck,
  Bell,
  BellOff,
  Edit,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Target,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  progress: number;
  status: "active" | "completed" | "archived" | "cancelled" | "paused";
  dailyTasks: Array<{ title: string; done: boolean }>;
  members: WorkspaceMember[];
  channel?: { id: number; name: string } | null;
}

const WorkspaceContainer = () => {
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === "ADMIN";
  const aiPanelState = useAiPanelState();
  const titleMaxChars = aiPanelState === "expanded" ? 20 : 25;
  type WsFilterState = {
    statusFilters: string[];
    categoryFilters: string[];
    hideCompleted: boolean;
    showArchived: boolean;
  };
  const defaultWsFilters: WsFilterState = {
    statusFilters: [],
    categoryFilters: [],
    hideCompleted: false,
    showArchived: false,
  };
  const [appliedFilters, setAppliedFilters] = useState<WsFilterState>(defaultWsFilters);
  const [draftFilters, setDraftFilters] = useState<WsFilterState>(defaultWsFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterCard, setShowFilterCard] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "",
    channelName: "",
    dailyTasks: [""],
    otherCategory: "",
    githubEnabled: false,
    calendarEnabled: false,
  });
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Invite / member management
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [channelSuggestions, setChannelSuggestions] = useState<Array<WorkspaceUser & { channelName: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [memberDropdownGoalId, setMemberDropdownGoalId] = useState<string | null>(null);

  // Notification mute preferences
  const [mutedWorkspaces, setMutedWorkspaces] = useState<Set<number>>(new Set());

  useEffect(() => {
    getNotificationPreferences()
      .then((prefs) => {
        const muted = new Set<number>();
        for (const p of prefs) {
          if (p.muted) muted.add(p.boardId);
        }
        setMutedWorkspaces(muted);
      })
      .catch(() => {});
  }, []);

  const handleToggleMute = useCallback(async (boardId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const numId = Number(boardId);
    const isMuted = mutedWorkspaces.has(numId);
    await setNotificationPreference(numId, !isMuted).catch(() => {});
    setMutedWorkspaces((prev) => {
      const next = new Set(prev);
      if (isMuted) next.delete(numId);
      else next.add(numId);
      return next;
    });
    toast.success(isMuted ? "Notifications enabled" : "Notifications muted");
  }, [mutedWorkspaces]);


  const computeWorkspaceStatus = (workspace: {
    status?: string;
    columns?: Array<{ type?: string; name: string; tasks?: Array<unknown> }>;
  }): Goal["status"] => {
    if (workspace.status) {
      const s = workspace.status.toLowerCase();
      if (s === "active" || s === "completed" || s === "archived" || s === "cancelled" || s === "paused") {
        return s;
      }
    }
    return "active";
  };

  const computeWorkspaceProgress = (workspace: {
    columns?: Array<{ type?: string; name: string; tasks?: Array<unknown> }>;
  }) => {
    const columns = workspace.columns ?? [];
    const totalTasks = columns.reduce(
      (sum, column) => sum + (column.tasks?.length ?? 0),
      0,
    );
    if (totalTasks === 0) return 0;

    const completedTasks = columns.reduce((sum, column) => {
      const isCompleted =
        column.type === "COMPLETED" ||
        column.name.toLowerCase().includes("done") ||
        column.name.toLowerCase().includes("complete");
      return sum + (isCompleted ? (column.tasks?.length ?? 0) : 0);
    }, 0);

    return Math.round((completedTasks / totalTasks) * 100);
  };

  const loadWorkspaces = async () => {
    setIsLoadingWorkspaces(true);
    try {
      const userId = isAdmin ? undefined : getCurrentUserId() || undefined;
      const exclude: string[] = [];
      if (!appliedFilters.showArchived) exclude.push("archived");
      if (appliedFilters.hideCompleted) exclude.push("completed");

      const result = await getWorkspacesPaged({
        userId,
        page,
        pageSize,
        excludeStatus: exclude.length > 0 ? exclude as any : undefined,
      });

      const workspaces = result.items;
      setGoals(
        workspaces.map((workspace) => ({
          id: workspace.id,
          title:
            workspace.name?.trim() || `Workspace ${workspace.id.slice(0, 6)}`,
          description:
            workspace.description?.trim() || "No description provided.",
          category: workspace.category?.trim() || "Personal",
          createdAt:
            workspace.createdAt?.slice(0, 10) ||
            new Date().toISOString().split("T")[0],
          progress: computeWorkspaceProgress(workspace),
          status: computeWorkspaceStatus(workspace),
          dailyTasks:
            workspace.columns?.flatMap((column) => {
              const isDoneColumn =
                column.type === "COMPLETED" ||
                column.name.toLowerCase().includes("done");

              return (column.tasks ?? []).map((task) => ({
                title: task.title,
                done: isDoneColumn,
              }));
            }) ?? [],
          members: (workspace.members as WorkspaceMember[] | undefined) ?? [],
          channel: workspace.channel ?? null,
        })),
      );
      setTotalPages(result.totalPages);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load workspaces from backend",
      );
    } finally {
      setIsLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    void loadWorkspaces();
  }, [page, pageSize, appliedFilters]);

  useInvalidation(["workspaces"], () => {
    void loadWorkspaces();
  });

  // Close member dropdown on outside click
  const closeMemberDropdown = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-member-dropdown]")) {
      setMemberDropdownGoalId(null);
    }
  }, []);

  useEffect(() => {
    if (memberDropdownGoalId) {
      document.addEventListener("mousedown", closeMemberDropdown);
      return () => document.removeEventListener("mousedown", closeMemberDropdown);
    }
  }, [memberDropdownGoalId, closeMemberDropdown]);

  const addDailyTask = () => {
    setNewGoal((prev) => ({
      ...prev,
      dailyTasks: [...prev.dailyTasks, ""],
    }));
  };

  const updateDailyTask = (index: number, value: string) => {
    setNewGoal((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map((task, i) =>
        i === index ? value : task,
      ),
    }));
  };

  const removeDailyTask = (index: number) => {
    setNewGoal((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.filter((_, i) => i !== index),
    }));
  };

  const createGoal = async () => {
    if (!newGoal.title.trim()) {
      setErrorMessage("Goal title is required");
      return;
    }

    const validTasks = newGoal.dailyTasks
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const createdById = Number(getCurrentUserId()) || undefined;
      const category =
        newGoal.category === "Others"
          ? newGoal.otherCategory.trim() || "Others"
          : newGoal.category || undefined;
      const channelName = newGoal.channelName.trim() || undefined;
      if (validTasks.length > 0) {
        await createWorkspaceBundle({
          name: newGoal.title.trim(),
          description: newGoal.description.trim() || undefined,
          category,
          channelName,
          createdById,
          githubEnabled: newGoal.githubEnabled,
          calendarEnabled: newGoal.calendarEnabled,
          tasks: validTasks.map((title) => ({ title })),
        });
      } else {
        await createWorkspace({
          name: newGoal.title.trim(),
          description: newGoal.description.trim() || undefined,
          category,
          channelName,
          createdById,
          githubEnabled: newGoal.githubEnabled,
          calendarEnabled: newGoal.calendarEnabled,
        });
      }
      await loadWorkspaces();
      emitInvalidation(["workspaces"], ["workspace.create"]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to create workspace in backend",
      );
      return;
    }

    setNewGoal({
      title: "",
      description: "",
      category: "",
      channelName: "",
      dailyTasks: [""],
      otherCategory: "",
      githubEnabled: false,
      calendarEnabled: false,
    });
    setIsCreateDialogOpen(false);
  };

  const handleStatusChange = async (goalId: string, status: Goal["status"]) => {
    try {
      await updateWorkspace(goalId, { status });
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, status } : g)),
      );
    } catch {
      // ignore
    }
  };

  const handleCategoryChange = async (goalId: string, category: string) => {
    try {
      await updateWorkspace(goalId, { category });
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, category } : g)),
      );
    } catch {
      // ignore
    }
  };

  const handleEditWorkspace = (goal: Goal) => {
    setEditingGoal(goal);
    setEditForm({ title: goal.title, description: goal.description });
    setIsEditDialogOpen(true);
  };

  const saveEditWorkspace = async () => {
    if (!editingGoal || !editForm.title.trim()) {
      setErrorMessage("Workspace name is required");
      return;
    }
    try {
      await updateWorkspace(editingGoal.id, {
        name: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
      });
      await loadWorkspaces();
      emitInvalidation(["workspaces"], ["workspace.update"]);
      setIsEditDialogOpen(false);
      setEditingGoal(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update workspace",
      );
    }
  };

  const handleDeleteWorkspace = (goalId: string) => {
    setDeletingGoalId(goalId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteWorkspace = async () => {
    if (!deletingGoalId) return;
    try {
      await deleteWorkspace(deletingGoalId);
      await loadWorkspaces();
      emitInvalidation(["workspaces"], ["workspace.delete"]);
      setIsDeleteDialogOpen(false);
      setDeletingGoalId(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete workspace",
      );
    }
  };

  const currentUserId = getCurrentUserId();

  const openInviteDialog = async (workspaceId: string) => {
    setInviteWorkspaceId(workspaceId);
    setIsInviteOpen(true);
    setInviteEmail("");
    if (currentUserId) {
      try {
        const suggestions = await getChannelMembersForInvite(workspaceId, currentUserId);
        setChannelSuggestions(suggestions);
      } catch {
        setChannelSuggestions([]);
      }
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!inviteWorkspaceId) return;
    setIsInviting(true);
    try {
      await addWorkspaceMember(inviteWorkspaceId, userId);
      await loadWorkspaces();
      setChannelSuggestions((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      // already a member
    } finally {
      setIsInviting(false);
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteWorkspaceId || !inviteEmail.trim() || !currentUserId) return;
    setIsInviting(true);
    try {
      const result = await inviteWorkspaceMember(inviteWorkspaceId, inviteEmail.trim(), Number(currentUserId));
      await loadWorkspaces();
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
    if (!inviteWorkspaceId) return;
    try {
      await removeWorkspaceMember(inviteWorkspaceId, userId);
      await loadWorkspaces();
    } catch {
      // handle error
    }
  };

  const inviteGoalMembers = goals.find((g) => g.id === inviteWorkspaceId)?.members ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-emerald-300 bg-emerald-100 text-emerald-800";
      case "completed":
        return "border-blue-300 bg-blue-100 text-blue-800";
      case "archived":
        return "border-gray-300 bg-gray-100 text-gray-600";
      case "cancelled":
        return "border-red-300 bg-red-100 text-red-800";
      case "paused":
        return "border-amber-300 bg-amber-100 text-amber-800";
      default:
        return "border-border bg-secondary text-secondary-foreground";
    }
  };

  const availableCategories = React.useMemo(() => {
    const defaults = ["Career", "Health", "Finance", "Personal", "Education"];
    const cats = new Set<string>(defaults);
    goals.forEach((g) => { if (g.category) cats.add(g.category); });
    return Array.from(cats).sort();
  }, [goals]);

  const filteredGoals = React.useMemo(() => {
    const f = appliedFilters;
    return goals.filter((goal) => {
      if (f.hideCompleted && goal.status === "completed") return false;
      if (!f.showArchived && goal.status === "archived") return false;
      if (f.statusFilters.length > 0 && !f.statusFilters.includes(goal.status)) return false;
      if (f.categoryFilters.length > 0 && !f.categoryFilters.includes(goal.category)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !goal.title.toLowerCase().includes(q) &&
          !goal.description.toLowerCase().includes(q) &&
          !goal.category.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [goals, appliedFilters, searchQuery]);

  const getCategoryColor = (_category?: string) => {
    return "border-blue-300 bg-blue-100 text-blue-800";
  };

  return (
    <div className="page-shell">
      {/* Header + Toolbar */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="section-label">Workspace</p>
          <h1 className="text-3xl font-bold text-balance">Your Space</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Set goals and stay on track every day
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces"
            className="h-9 pl-8"
          />
        </div>
        <div className="relative">
          <Button
            variant={showFilterCard ? "secondary" : "outline"}
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => {
              if (!showFilterCard) setDraftFilters({ ...appliedFilters });
              setShowFilterCard((prev) => !prev);
            }}
            title="Filters"
          >
            <Filter className="h-4 w-4" />
          </Button>

          {showFilterCard && (
            <div
              className="absolute right-0 top-11 z-50 w-72 rounded-lg border bg-popover p-4 shadow-lg space-y-4"
              onPointerDownCapture={(e) => e.stopPropagation()}
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

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <div className="space-y-1.5 pl-0.5">
                  {["active", "completed", "cancelled", "paused"].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <Checkbox
                        id={`status-${s}`}
                        checked={draftFilters.statusFilters.includes(s)}
                        onCheckedChange={(checked) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            statusFilters: checked
                              ? [...prev.statusFilters, s]
                              : prev.statusFilters.filter((v) => v !== s),
                          }))
                        }
                      />
                      <Label htmlFor={`status-${s}`} className="text-xs capitalize cursor-pointer">
                        {s}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <div className="space-y-1.5 pl-0.5">
                  {availableCategories.map((cat) => (
                    <div key={cat} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${cat}`}
                        checked={draftFilters.categoryFilters.includes(cat)}
                        onCheckedChange={(checked) =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            categoryFilters: checked
                              ? [...prev.categoryFilters, cat]
                              : prev.categoryFilters.filter((v) => v !== cat),
                          }))
                        }
                      />
                      <Label htmlFor={`cat-${cat}`} className="text-xs cursor-pointer">
                        {cat}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hide-completed-ws"
                    checked={draftFilters.hideCompleted}
                    onCheckedChange={(c) =>
                      setDraftFilters((prev) => ({ ...prev, hideCompleted: c === true }))
                    }
                  />
                  <Label htmlFor="hide-completed-ws" className="text-xs cursor-pointer">
                    Hide completed
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-archived-ws"
                    checked={draftFilters.showArchived}
                    onCheckedChange={(c) =>
                      setDraftFilters((prev) => ({ ...prev, showArchived: c === true }))
                    }
                  />
                  <Label htmlFor="show-archived-ws" className="text-xs cursor-pointer">
                    Show archived
                  </Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDraftFilters({ ...defaultWsFilters })}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
                {JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setAppliedFilters({ ...draftFilters });
                      setPage(1);
                      setShowFilterCard(false);
                    }}
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer gap-2">
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Set up a new workspace to organize tasks and collaborate with your team
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Workspace Name</Label>
                <Input
                  id="title"
                  placeholder="e.g., Product Team Workspace"
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your goal and what success looks like..."
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value) =>
                    setNewGoal((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Career">Career</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newGoal.category === "Others" && (
                <div className="space-y-2">
                  <Label htmlFor="otherCategory">
                    Please specify category
                  </Label>
                  <Input
                    placeholder="e.g. Marketing"
                    id="otherCategory"
                    value={newGoal.otherCategory}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        otherCategory: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="channelName">
                  Channel <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="channelName"
                  placeholder="e.g. workspace-discussion"
                  value={newGoal.channelName}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      channelName: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Creates a chat channel linked to this workspace
                </p>
              </div>

              <div className="space-y-3">
                <Label>Integrations</Label>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">GitHub</p>
                      <p className="text-xs text-muted-foreground">Track commits, PRs, and issues</p>
                    </div>
                  </div>
                  <Switch
                    checked={newGoal.githubEnabled}
                    onCheckedChange={(checked) =>
                      setNewGoal((prev) => ({ ...prev, githubEnabled: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Google Calendar</p>
                      <p className="text-xs text-muted-foreground">Sync calendar events and deadlines</p>
                    </div>
                  </div>
                  <Switch
                    checked={newGoal.calendarEnabled}
                    onCheckedChange={(checked) =>
                      setNewGoal((prev) => ({ ...prev, calendarEnabled: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Daily Tasks</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDailyTask}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </div>

                <div className="space-y-2">
                  {newGoal.dailyTasks.map((task, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Daily task ${index + 1}`}
                        value={task}
                        onChange={(e) => updateDailyTask(index, e.target.value)}
                      />
                      {newGoal.dailyTasks.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDailyTask(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => void createGoal()}
                  className="flex-1 cursor-pointer"
                >
                  Create Workspace
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      <hr className="mb-4 border-border" />
      {errorMessage && (
        <Card className="mb-2 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-700">
            Unable to load workspaces. Create your first workspace to get
            started.
          </CardContent>
        </Card>
      )}
      {isLoadingWorkspaces && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading workspaces...</span>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredGoals.map((goal) => (
          <Link
            to="/workspace/project/$projectId"
            params={{ projectId: goal.id }}
          >
            <Card
              onClick={() => {}}
              key={goal.id}
              className="flex flex-col h-full m-0 p-0 rounded-lg
            border border-transparent
            bg-origin-border
            bg-clip-padding
            hover:bg-linear-to-r
            hover:from-blue-500
            hover:to-purple-500 hover:transform hover:cursor-pointer hover:scale-105 hover:shadow-lg transition-all"
            >
              <div className="m-px relative rounded-md py-6 flex flex-col flex-1 bg-background-secondary">
                <div className="absolute top-3 right-3">
                  <CircularProgress
                    value={goal.progress}
                    size={48}
                    strokeWidth={5}
                    labelClassName="text-[8px] font-semibold"
                  />
                </div>
                <div className="absolute bottom-3 right-3 flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 w-7 p-0 hover:bg-accent ${mutedWorkspaces.has(Number(goal.id)) ? "text-red-400" : "text-amber-500"}`}
                    onClick={(e) => handleToggleMute(goal.id, e)}
                    title={mutedWorkspaces.has(Number(goal.id)) ? "Unmute notifications" : "Mute notifications"}
                  >
                    {mutedWorkspaces.has(Number(goal.id)) ? (
                      <BellOff className="h-3.5 w-3.5" />
                    ) : (
                      <Bell className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-accent"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditWorkspace(goal);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-accent"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteWorkspace(goal.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CardHeader className="px-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {goal.title.length > titleMaxChars
                          ? `${goal.title.slice(0, titleMaxChars)}...`
                          : goal.title}
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              <Badge
                                variant="outline"
                                className={`${getCategoryColor(goal.category)} cursor-pointer hover:opacity-80 inline-flex items-center gap-1`}
                              >
                                {goal.category}
                                <ChevronDown className="h-3 w-3" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-36"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            {availableCategories.map((cat) => (
                              <DropdownMenuItem
                                key={cat}
                                onClick={() => handleCategoryChange(goal.id, cat)}
                                className="text-xs"
                              >
                                {cat}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                              <Badge className={`${getStatusColor(goal.status)} cursor-pointer hover:opacity-80 inline-flex items-center gap-1`}>
                                {goal.status}
                                <ChevronDown className="h-3 w-3" />
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-36"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            {(["active", "completed", "archived", "cancelled", "paused"] as const).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatusChange(goal.id, s)}
                                className="text-xs capitalize"
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-2.5 px-4 py-2">
                  <CardDescription className="text-xs" title={goal.description}>
                    {goal.description.length > 80
                      ? `${goal.description.slice(0, 80)}...`
                      : goal.description}
                  </CardDescription>
                  <hr />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarCheck className="h-3 w-3" />
                    <span>
                      {new Date(goal.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {goal.channel && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span className="truncate">#{goal.channel.name}</span>
                    </div>
                  )}

                  {/* Members + Invite */}
                  <div className="flex items-center gap-2">
                    <div
                      className="relative flex items-center"
                      data-member-dropdown
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMemberDropdownGoalId(
                          memberDropdownGoalId === goal.id ? null : goal.id,
                        );
                      }}
                    >
                      <div className="flex items-center -space-x-1.5 cursor-pointer">
                        {goal.members.slice(0, 3).map((m) => (
                          <Avatar
                            key={m.userId}
                            className="h-5 w-5 border-2 border-card ring-0"
                          >
                            <AvatarImage src={m.user.avatarUrl || undefined} />
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {m.user.firstName?.[0]}
                              {m.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {goal.members.length > 3 && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-muted text-[7px] font-medium">
                            +{goal.members.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Member dropdown */}
                      {memberDropdownGoalId === goal.id && (
                        <div
                          className="absolute left-0 top-9 z-50 w-56 rounded-md border bg-popover p-2 shadow-md"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 px-1">
                            Members ({goal.members.length})
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {goal.members.map((m) => (
                              <div
                                key={m.userId}
                                className="flex items-center gap-2 rounded px-1.5 py-1.5 hover:bg-accent"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={m.user.avatarUrl || undefined} />
                                  <AvatarFallback className="text-[9px]">
                                    {m.user.firstName?.[0]}
                                    {m.user.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium truncate">
                                    {m.user.firstName} {m.user.lastName}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {m.user.email}
                                  </div>
                                </div>
                                {m.role === "ADMIN" && (
                                  <span className="text-[9px] text-muted-foreground font-medium shrink-0">
                                    Owner
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 rounded-full border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void openInviteDialog(goal.id);
                      }}
                      title="Invite member"
                    >
                      <UserPlus className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="space-y-1 pl-1">
                      {goal.dailyTasks.slice(0, 2).map((task, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1.5 text-[11px]"
                        >
                          {task.done ? (
                            <CircleCheck className="h-3 w-3 shrink-0 text-primary" />
                          ) : (
                            <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                          )}
                          <span className={`truncate ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                      {goal.dailyTasks.length > 2 && (
                        <div className="text-[10px] text-muted-foreground/70 pl-4">
                          +{goal.dailyTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {goals.length > 0 && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No workspaces yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workspace to start organizing tasks
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workspace
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update the workspace name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Workspace Name</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => void saveEditWorkspace()}
                className="flex-1"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workspace? This action cannot
              be undone. All tasks and columns will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => void confirmDeleteWorkspace()}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Members Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={(open) => { setIsInviteOpen(open); if (!open) setInviteWorkspaceId(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Invite people from your channels or by email
            </DialogDescription>
          </DialogHeader>

          {/* Current members */}
          {inviteGoalMembers.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Members ({inviteGoalMembers.length})</div>
              <div className="space-y-1">
                {inviteGoalMembers.map((m) => (
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
                      className="h-7"
                      disabled={isInviting}
                      onClick={() => void handleAddMember(u.id)}
                    >
                      Add
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
    </div>
  );
};

export default WorkspaceContainer;
