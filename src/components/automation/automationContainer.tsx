import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAutomation,
  deleteAutomation,
  getCurrentUserId,
  getAutomationLogs,
  listAutomations,
  listWorkspaces,
  testAutomation,
  toggleAutomationStatus,
  updateAutomation,
  type AutomationActionType,
  type AutomationData,
  type AutomationLogEntry,
  type AutomationTriggerType,
  type Workspace,
} from "@/lib/backend-api";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Clock,
  Edit2,
  Filter,
  Loader2,
  MoreHorizontal,
  Play,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AutomationHistory from "./AutomationHistory";
import { NODE_ICONS, NODE_LABELS } from "./workflow-builder/constants";
import { WorkflowBuilder } from "./workflow-builder";

// ---------------------------------------------------------------------------
// Main Container
// ---------------------------------------------------------------------------

export default function AutomationContainer() {
  const [automations, setAutomations] = useState<AutomationData[]>([]);
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("automations");
  const [editingAutomation, setEditingAutomation] = useState<AutomationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AutomationData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationData | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [filterWorkspaceId, setFilterWorkspaceId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // ---- Data fetching ----

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const userId = getCurrentUserId();
      const result = await listAutomations(
        userId ? { userId } : undefined,
      );
      setAutomations(result.items ?? []);
    } catch (err) {
      console.error("Failed to load automations", err);
      toast.error("No automations found. Create one to get started!");
      setAutomations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const allLogs: AutomationLogEntry[] = [];
      for (const auto of automations) {
        try {
          const autoLogs = await getAutomationLogs(auto.id);
          const enriched = autoLogs.map((l) => ({
            ...l,
            automationId: auto.id,
            automationName: auto.name,
          }));
          allLogs.push(...enriched);
        } catch {
          // Skip individual failures
        }
      }
      // Sort by most recent first
      allLogs.sort(
        (a, b) =>
          new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime(),
      );
      setLogs(allLogs);
    } catch {
      toast.error("No execution history available yet.");
    } finally {
      setLogsLoading(false);
    }
  }, [automations]);

  useEffect(() => {
    fetchAutomations();
    listWorkspaces()
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]));
  }, [fetchAutomations]);

  useEffect(() => {
    if (activeTab === "history" && automations.length > 0) {
      fetchAllLogs();
    }
  }, [activeTab, automations.length, fetchAllLogs]);

  // ---- Toggle status ----

  async function handleToggle(automation: AutomationData) {
    const newStatus = automation.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await toggleAutomationStatus(automation.id, newStatus as "ACTIVE" | "INACTIVE");
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === automation.id ? { ...a, status: newStatus as AutomationData["status"] } : a,
        ),
      );
      toast.success(
        `Automation ${newStatus === "ACTIVE" ? "enabled" : "disabled"}`,
      );
    } catch {
      toast.error("Failed to toggle automation status");
    }
  }

  // ---- Delete ----

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAutomation(deleteTarget.id);
      setAutomations((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      toast.success("Automation deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete automation");
    } finally {
      setDeleting(false);
    }
  }

  // ---- Test fire ----

  async function handleTest(automation: AutomationData) {
    try {
      const result = await testAutomation(automation.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to test automation");
    }
  }

  // ---- Save (create or update) ----

  async function handleSave(data: {
    name: string;
    description: string;
    trigger?: { type: AutomationTriggerType; config?: Record<string, unknown> };
    actions: Array<{
      type: AutomationActionType;
      config?: Record<string, unknown>;
      sortOrder: number;
    }>;
  }) {
    setSaving(true);
    try {
      if (editingAutomation) {
        await updateAutomation(editingAutomation.id, {
          name: data.name,
          description: data.description,
          trigger: data.trigger,
          actions: data.actions,
        });
        toast.success("Automation updated");
      } else {
        const userId = getCurrentUserId();
        await createAutomation({
          name: data.name,
          description: data.description,
          userId,
          trigger: data.trigger,
          actions: data.actions,
        });
        toast.success("Automation created");
      }
      setEditingAutomation(null);
      setActiveTab("automations");
      fetchAutomations();
    } catch {
      toast.error(
        editingAutomation
          ? "Failed to update automation"
          : "Failed to create automation",
      );
    } finally {
      setSaving(false);
    }
  }

  // ---- Edit ----

  function handleEdit(automation: AutomationData) {
    setEditingAutomation(automation);
    setActiveTab("create");
  }

  function handleCreateNew() {
    setEditingAutomation(null);
    setActiveTab("create");
  }

  // ---- Stats ----

  const activeCount = automations.filter((a) => a.status === "ACTIVE").length;
  const inactiveCount = automations.filter((a) => a.status === "INACTIVE").length;
  const totalRuns = automations.reduce((sum, a) => sum + (a.runCount ?? 0), 0);

  // Filter automations by workspace — checks if any action's config references the workspace
  const filteredAutomations = filterWorkspaceId === "all"
    ? automations
    : automations.filter((a) =>
        a.actions.some((action) => {
          const cfg = action.config as Record<string, unknown> | null;
          return (
            String(cfg?.workspaceId ?? "") === filterWorkspaceId ||
            String(cfg?.boardId ?? "") === filterWorkspaceId
          );
        }) ||
        (a.trigger?.config as Record<string, unknown> | null)?.boardId === filterWorkspaceId ||
        (a.trigger?.config as Record<string, unknown> | null)?.workspaceId === filterWorkspaceId,
      );

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label mb-1">Automation</p>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">My Workflows</h1>
        <p className="text-muted-foreground text-pretty">
          Build automated workflows that trigger actions when events happen in
          your workspace.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {automations.length}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Total Automations
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Play className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {activeCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10">
              <CirclePause className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {inactiveCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{totalRuns}</p>
              <p className="text-[10px] text-muted-foreground">Total Runs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList data-tour="automation-tabs">
          <TabsTrigger value="automations">My Automations</TabsTrigger>
          <TabsTrigger value="create">
            {editingAutomation ? "Edit" : "Create"}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ---- Tab 1: My Automations ---- */}
        <TabsContent value="automations" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold">Your Automations</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {workspaces.length > 0 && (
                <Select value={filterWorkspaceId} onValueChange={(v) => { setFilterWorkspaceId(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs">
                    <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Filter workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workspaces</SelectItem>
                    {workspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button className="gap-2 w-full sm:w-auto" onClick={handleCreateNew}>
                <Plus className="h-4 w-4" />
                Create Automation
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading automations...</span>
            </div>
          ) : filteredAutomations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {filterWorkspaceId !== "all"
                    ? "No automations found for this workspace."
                    : "No automations yet. Create one to get started!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Runs</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead className="text-center">Enabled</TableHead>
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAutomations
                      .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                      .map((automation) => {
                        const isActive = automation.status === "ACTIVE";
                        const isError = automation.status === "ERROR";
                        const triggerType = automation.trigger?.type;
                        const TriggerIcon = triggerType ? NODE_ICONS[triggerType] : Zap;
                        const triggerLabel = triggerType ? NODE_LABELS[triggerType] : "No trigger";
                        return (
                          <TableRow
                            key={automation.id}
                            className="cursor-pointer"
                            onClick={() => setSelectedAutomation(automation)}
                          >
                            <TableCell>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[220px]">{automation.name}</p>
                                {automation.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[220px]">{automation.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isError ? "destructive" : isActive ? "active" : "editing"}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {automation.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                                  <TriggerIcon className="h-3 w-3 text-primary" />
                                </div>
                                <span className="text-xs text-muted-foreground">{triggerLabel}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {automation.actions.length} action{automation.actions.length !== 1 ? "s" : ""}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Play className="h-2.5 w-2.5" />
                                {automation.runCount ?? 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {automation.lastRunAt ? formatRelativeTime(automation.lastRunAt) : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => handleToggle(automation)}
                                className="scale-90"
                              />
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(automation)}>
                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(automation)}>
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredAutomations.length > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredAutomations.length)} of{" "}
                    {filteredAutomations.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from(
                      { length: Math.ceil(filteredAutomations.length / PAGE_SIZE) },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={currentPage >= Math.ceil(filteredAutomations.length / PAGE_SIZE)}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Preview Dialog */}
          <AutomationPreview
            automation={selectedAutomation}
            onEdit={() => { handleEdit(selectedAutomation!); setSelectedAutomation(null); }}
            onTest={() => { if (selectedAutomation) handleTest(selectedAutomation); }}
            onClose={() => setSelectedAutomation(null)}
          />
        </TabsContent>

        {/* ---- Tab 2: Create / Edit ---- */}
        <TabsContent value="create" className="min-h-[600px]">
          <WorkflowBuilder
            key={editingAutomation?.id ?? "new"}
            initial={editingAutomation}
            onSave={handleSave}
            saving={saving}
          />
        </TabsContent>

        {/* ---- Tab 3: History ---- */}
        <TabsContent value="history" className="space-y-4">
          <h2 className="text-xl font-semibold">Execution History</h2>
          <AutomationHistory logs={logs} loading={logsLoading} />
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Automation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Automation Preview
// ---------------------------------------------------------------------------

function AutomationPreview({
  automation,
  onEdit,
  onTest,
  onClose,
}: {
  automation: AutomationData | null;
  onEdit: () => void;
  onTest: () => void;
  onClose: () => void;
}) {
  if (!automation) return null;

  const isActive = automation.status === "ACTIVE";
  const isError = automation.status === "ERROR";
  const triggerType = automation.trigger?.type;
  const TriggerIcon = triggerType ? NODE_ICONS[triggerType] : Zap;
  const triggerLabel = triggerType ? NODE_LABELS[triggerType] : "No trigger";
  const triggerConfig = automation.trigger?.config;

  return (
    <Dialog open={!!automation} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {automation.name}
            <Badge
              variant={isError ? "destructive" : isActive ? "active" : "editing"}
              className="text-[10px] px-1.5 py-0"
            >
              {automation.status}
            </Badge>
          </DialogTitle>
          {automation.description && (
            <DialogDescription>{automation.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Workflow flow */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-md border bg-blue-500/5 border-blue-500/20 px-2 py-1">
              <TriggerIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="text-xs font-medium">{triggerLabel}</span>
            </div>

            {automation.actions.length > 0 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            )}

            {[...automation.actions]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((action, idx) => {
                const ActionIcon = NODE_ICONS[action.type] ?? Zap;
                const actionLabel = NODE_LABELS[action.type] ?? action.type;
                return (
                  <div key={action.id} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-md border bg-green-500/5 border-green-500/20 px-2 py-1">
                      <ActionIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-xs font-medium">{actionLabel}</span>
                    </div>
                    {idx < automation.actions.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}
          </div>

          {/* Config details */}
          <div className="space-y-3">
            {triggerConfig && Object.keys(triggerConfig).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Trigger Configuration
                </p>
                <div className="rounded-md border bg-muted/30 p-2.5 space-y-1">
                  {Object.entries(triggerConfig).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      <span className="font-medium text-muted-foreground min-w-[90px]">{formatConfigKey(key)}</span>
                      <span className="text-foreground break-all">{String(val ?? "—")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {automation.actions
              .filter((a) => a.config && Object.keys(a.config).length > 0)
              .map((action) => {
                const actionLabel = NODE_LABELS[action.type] ?? action.type;
                return (
                  <div key={action.id} className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {actionLabel} Configuration
                    </p>
                    <div className="rounded-md border bg-muted/30 p-2.5 space-y-1">
                      {Object.entries(action.config!).map(([key, val]) => (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <span className="font-medium text-muted-foreground min-w-[90px]">{formatConfigKey(key)}</span>
                          <span className="text-foreground break-all">{String(val ?? "—")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {automation.runCount ?? 0} runs
            </span>
            {automation.lastRunAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(automation.lastRunAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(automation.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onTest}>
            <Play className="h-3.5 w-3.5" />
            Test Run
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5" />
            Edit Automation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatConfigKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
