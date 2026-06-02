import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createWorkspaceTask,
  createTaskComment,
  getCalendarEvents,
  getCurrentUserId,
  syncGoogleCalendar,
  updateWorkspaceTask,
  type CalendarEventItem,
} from "@/lib/backend-api";
import googleIcon from "@/assets/google.png";
import { Textarea } from "@/components/ui/textArea";
import { Calendar, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, ExternalLink, Expand, ListPlus, Loader2, MapPin, Plus, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { parseTaskMeta } from "../utils/task-meta";

type Props = {
  columns: Array<{
    id: string;
    name: string;
    position: number;
    type?: string;
    tasks?: Array<{
      id: string;
      title: string;
      description?: string | null;
      createdAt?: string;
      customFieldValues?: Record<string, unknown> | null;
    }>;
  }>;
  effectiveColumnColors: Record<string, string>;
  workspaceId: string;
  calendarEnabled?: boolean;
  currentUserId: string;
  members?: Array<{ userId: number; user: { firstName: string; lastName: string } }>;
  onViewTask: (taskId: string) => void;
  onRefresh?: () => void;
};

type CalendarEntry = {
  type: "task" | "event";
  id: string;
  title: string;
  color: string;
  columnName?: string;
  time?: string;
  location?: string;
  meetLink?: string;
  description?: string;
};

export function WorkspaceCalendarView({ columns, effectiveColumnColors, workspaceId, calendarEnabled, currentUserId, members = [], onViewTask, onRefresh }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<CalendarEntry[]>([]);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [convertedEventTitles, setConvertedEventTitles] = useState<Set<string>>(new Set());

  // For actions
  const [actionMode, setActionMode] = useState<"idle" | "create" | "link">("idle");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [createColumnId, setCreateColumnId] = useState<string>("");
  const [createAssigneeId, setCreateAssigneeId] = useState<string>("");
  const [createDueDate, setCreateDueDate] = useState<string>("");
  const [createDescription, setCreateDescription] = useState<string>("");
  const [createTitle, setCreateTitle] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const loadCalendarEvents = () => {
    if (!calendarEnabled || !currentUserId) return;
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0).toISOString();
    getCalendarEvents(currentUserId, from, to)
      .then(setCalendarEvents)
      .catch(() => setCalendarEvents([]));
  };

  useEffect(() => {
    loadCalendarEvents();
  }, [calendarEnabled, currentUserId, year, month]);

  const handleSync = async () => {
    if (!currentUserId) return;
    setIsSyncing(true);
    try {
      const result = await syncGoogleCalendar(currentUserId);
      toast.success(`Synced ${result.synced} events`);
      loadCalendarEvents();
    } catch {
      toast.error("Failed to sync calendar");
    } finally {
      setIsSyncing(false);
    }
  };

  const tasksByDay = useMemo(() => {
    const map = new Map<number, CalendarEntry[]>();
    for (const col of columns) {
      const color = effectiveColumnColors[String(col.id)] || "#94a3b8";
      for (const task of col.tasks ?? []) {
        const meta = parseTaskMeta(task.customFieldValues);
        if (meta.dueDate) {
          const d = new Date(meta.dueDate);
          if (d.getFullYear() === year && d.getMonth() === month) {
            const day = d.getDate();
            const entries = map.get(day) || [];
            entries.push({ type: "task", id: task.id, title: task.title, color, columnName: col.name, description: task.description || undefined });
            map.set(day, entries);
          }
        }
      }
    }
    return map;
  }, [columns, effectiveColumnColors, year, month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEntry[]>();
    for (const ev of calendarEvents) {
      const d = new Date(ev.startTime);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        const entries = map.get(day) || [];
        const time = ev.isAllDay ? "All day" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        entries.push({
          type: "event",
          id: String(ev.id),
          title: ev.title,
          color: "#3b82f6",
          time,
          location: ev.location || undefined,
          meetLink: ev.meetLink || undefined,
          description: ev.description || undefined,
        });
        map.set(day, entries);
      }
    }
    return map;
  }, [calendarEvents, year, month]);

  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const handleEntryClick = (entry: CalendarEntry) => {
    setSelectedEntries((prev) => {
      const exists = prev.find((e) => e.type === entry.type && e.id === entry.id);
      if (exists) return prev.filter((e) => !(e.type === entry.type && e.id === entry.id));
      const next = [...prev, entry];
      if (next.length > 3) next.shift();
      return next;
    });
    setActionMode("idle");
    setActiveActionId(entry.type + "-" + entry.id);
  };

  const handleAddTask = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const newEntry: CalendarEntry = {
      type: "event",
      id: `new-${dateStr}`,
      title: "",
      color: "#94a3b8",
    };
    setSelectedEntries((prev) => {
      const next = [...prev.filter((e) => e.id !== newEntry.id), newEntry];
      if (next.length > 3) next.shift();
      return next;
    });
    setActiveActionId("event-" + newEntry.id);
    setActionMode("create");
    setCreateTitle("");
    setCreateDescription("");
    setCreateDueDate(dateStr);
    setCreateColumnId("");
    setCreateAssigneeId("");
  };

  const removeEntry = (entry: CalendarEntry) => {
    setSelectedEntries((prev) => prev.filter((e) => !(e.type === entry.type && e.id === entry.id)));
    if (activeActionId === entry.type + "-" + entry.id) {
      setActiveActionId(null);
      setActionMode("idle");
    }
  };

  // Tasks from the current workspace only
  const workspaceTasks = useMemo(() =>
    columns.flatMap((col) =>
      (col.tasks ?? []).map((t) => ({ id: t.id, title: t.title, columnName: col.name })),
    ),
  [columns]);

  // Track which events have matching tasks (already converted)
  const taskTitles = useMemo(() => new Set(workspaceTasks.map((t) => t.title)), [workspaceTasks]);
  const isConverted = (title: string) => convertedEventTitles.has(title) || taskTitles.has(title);

  const getActiveEntry = () => selectedEntries.find((e) => e.type + "-" + e.id === activeActionId) || null;

  const handleCreateTask = async () => {
    const entry = getActiveEntry();
    const isNewTask = String(entry?.id || "").startsWith("new-");
    const title = isNewTask ? createTitle : entry?.title;
    if (!title?.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const calMeta = isNewTask ? {} : { calendarEvent: { title: title, time: entry?.time || "" } };
      await createWorkspaceTask(workspaceId, {
        title: title.trim(),
        description: createDescription || undefined,
        columnId: createColumnId || undefined,
        assigneeId: createAssigneeId ? Number(createAssigneeId) : (currentUserId ? Number(currentUserId) : undefined),
        customFieldValues: {
          __meta: {
            dueDate: createDueDate || "",
            ...calMeta,
          },
        },
      });
      toast.success("Task created from calendar event");
      if (!isNewTask && entry) setConvertedEventTitles((prev) => new Set(prev).add(entry.title));
      if (entry) removeEntry(entry);
      setCreateColumnId("");
      setCreateAssigneeId("");
      setCreateDueDate("");
      setCreateDescription("");
      setCreateTitle("");
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkToTask = async () => {
    const entry = getActiveEntry();
    if (!selectedTaskId || !entry) return;
    setIsSubmitting(true);
    try {
      const userId = getCurrentUserId();
      const comment = `@@calendar@@${entry.title}||${entry.time || ""}||${entry.location || ""}||${entry.meetLink || ""}`;
      await createTaskComment(workspaceId, selectedTaskId, { userId: userId || "", content: comment });
      // Also store calendarEvent in task custom fields for kanban card indicator
      const task = columns.flatMap((c) => c.tasks ?? []).find((t) => t.id === selectedTaskId);
      if (task) {
        const existing = (task.customFieldValues as Record<string, any>) || {};
        const meta = existing.__meta || {};
        await updateWorkspaceTask(workspaceId, selectedTaskId, {
          customFieldValues: { ...existing, __meta: { ...meta, calendarEvent: { title: entry.title, time: entry.time || "" } } },
        });
      }
      toast.success("Event linked to task");
      setConvertedEventTitles((prev) => new Set(prev).add(entry.title));
      removeEntry(entry);
      onRefresh?.();
    } catch {
      toast.error("Failed to link event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-0 flex-1 flex gap-4 py-2">
      {/* Calendar grid */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-sm font-semibold">{monthName}</h3>
          <div className="flex items-center gap-2">
            {calendarEnabled && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void handleSync()} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <img src={googleIcon} alt="" className="h-3.5 w-3.5" />
                )}
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-md border border-border overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-muted px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {days.map((day, i) => {
            const taskEntries = day ? tasksByDay.get(day) || [] : [];
            const eventEntries = day ? eventsByDay.get(day) || [] : [];
            const allEntries = [...eventEntries, ...taskEntries];
            return (
              <div
                key={i}
                className={`group/cell bg-background min-h-[90px] p-1.5 ${
                  day ? "" : "bg-muted/30"
                } ${isToday(day || 0) ? "ring-2 ring-primary/30 ring-inset" : ""}`}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                        {day}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAddTask(day); }}
                        className="opacity-0 group-hover/cell:opacity-100 transition-opacity h-4 w-4 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Add task"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {allEntries.slice(0, 3).map((entry) => (
                        <button
                          key={`${entry.type}-${entry.id}`}
                          type="button"
                          onClick={() => handleEntryClick(entry)}
                          className="w-full text-left text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                          style={{
                            backgroundColor: entry.type === "task" ? `${entry.color}20` : "#3b82f620",
                            color: entry.color,
                            borderLeft: `2px solid ${entry.color}`,
                          }}
                          title={entry.type === "event" && entry.time ? `${entry.time} — ${entry.title}` : entry.title}
                        >
                          {entry.type === "event" && isConverted(entry.title) && (
                            <span className="mr-0.5 text-emerald-600">✓</span>
                          )}
                          {entry.type === "event" && entry.time && (
                            <span className="font-medium mr-0.5">{entry.time}</span>
                          )}
                          {entry.title}
                        </button>
                      ))}
                      {allEntries.length > 3 && (
                        <p className="text-[9px] text-muted-foreground px-1">+{allEntries.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-blue-500" />
            Calendar Event
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-slate-400" />
            Task Deadline
          </div>
        </div>
      </div>

      {/* Side panel — up to 3 cards */}
      {selectedEntries.length > 0 && (
        <div className="w-80 shrink-0 space-y-3 self-start sticky top-4">
          {selectedEntries.map((entry) => {
            const entryKey = entry.type + "-" + entry.id;
            const isActive = activeActionId === entryKey;
            return (
              <Card key={entryKey} className={`rounded-md shadow-sm ${isActive ? "ring-1 ring-primary/30" : ""}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 min-w-0">
                      {String(entry.id).startsWith("new-") ? (
                        <Plus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      ) : entry.type === "event" ? (
                        <Calendar className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-sm mt-0.5 shrink-0" style={{ backgroundColor: entry.color }} />
                      )}
                      {String(entry.id).startsWith("new-") ? (
                        <input
                          type="text"
                          value={createTitle}
                          onChange={(e) => setCreateTitle(e.target.value)}
                          placeholder="Task title..."
                          className="text-xs font-semibold text-foreground bg-transparent border-b border-border focus:border-primary outline-none w-full pb-0.5"
                          autoFocus
                        />
                      ) : (
                        <h4 className="text-xs font-semibold text-foreground line-clamp-2">{entry.title}</h4>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {entry.type === "task" && !String(entry.id).startsWith("new-") && (
                        <button type="button" onClick={() => { onViewTask(entry.id); removeEntry(entry); }} className="rounded-md p-1 hover:bg-muted cursor-pointer" title="Expand">
                          <Expand className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                      <button type="button" onClick={() => removeEntry(entry)} className="rounded-md p-1 hover:bg-muted cursor-pointer">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* New task — show create form directly */}
                  {String(entry.id).startsWith("new-") && (
                    <div className="space-y-2 pt-1">
                      <Textarea
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                        placeholder="Description..."
                        className="min-h-[48px] text-xs resize-none"
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: effectiveColumnColors[createColumnId] || "#94a3b8" }} />
                            <span className="flex-1 text-left truncate">{columns.find((c) => c.id === createColumnId)?.name || "Select status..."}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[160px]">
                          {columns.map((col) => (
                            <button key={col.id} type="button" onClick={() => setCreateColumnId(col.id)} className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-xs transition-colors ${createColumnId === col.id ? "bg-muted font-medium" : "hover:bg-muted"}`}>
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: effectiveColumnColors[col.id] || "#94a3b8" }} />
                              {col.name}
                              {createColumnId === col.id && <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />}
                            </button>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                            {createAssigneeId ? (
                              <>
                                <Avatar className="h-4 w-4"><AvatarFallback className="text-[7px] bg-primary/10 text-primary">{(() => { const m = members.find((m) => String(m.userId) === createAssigneeId); return m ? `${m.user.firstName?.[0]}${m.user.lastName?.[0]}` : "?"; })()}</AvatarFallback></Avatar>
                                <span className="flex-1 text-left truncate">{(() => { const m = members.find((m) => String(m.userId) === createAssigneeId); return m ? `${m.user.firstName} ${m.user.lastName}` : ""; })()}</span>
                              </>
                            ) : (
                              <><UserPlus className="h-3.5 w-3.5 text-muted-foreground" /><span className="flex-1 text-left text-muted-foreground">Assign to...</span></>
                            )}
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[160px]">
                          {members.map((m) => {
                            const active = String(m.userId) === createAssigneeId;
                            return (
                              <button key={m.userId} type="button" onClick={() => setCreateAssigneeId(active ? "" : String(m.userId))} className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-xs transition-colors ${active ? "bg-muted font-medium" : "hover:bg-muted"}`}>
                                <Avatar className="h-4 w-4"><AvatarFallback className="text-[7px] bg-primary/10 text-primary">{m.user.firstName?.[0]}{m.user.lastName?.[0]}</AvatarFallback></Avatar>
                                <span className="flex-1">{m.user.firstName} {m.user.lastName}</span>
                                {active && <CheckCircle2 className="h-3 w-3 text-primary" />}
                              </button>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className={`flex-1 text-left ${createDueDate ? "" : "text-muted-foreground"}`}>
                              {createDueDate ? new Date(createDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Due date..."}
                            </span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-auto p-0">
                          <CalendarWidget mode="single" selected={createDueDate ? new Date(createDueDate) : undefined} onSelect={(date) => { if (!date) { setCreateDueDate(""); return; } setCreateDueDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`); }} captionLayout="dropdown" />
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-6 text-[10px]" disabled={!createTitle.trim() || isSubmitting} onClick={() => void handleCreateTask()}>{isSubmitting ? "Creating..." : "Create Task"}</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => removeEntry(entry)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Task details */}
                  {entry.type === "task" && !String(entry.id).startsWith("new-") && (
                    <>
                      {entry.columnName && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: entry.color }}>
                          {entry.columnName}
                        </span>
                      )}
                      {entry.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{entry.description}</p>}
                    </>
                  )}

                  {/* Event details */}
                  {entry.type === "event" && (
                    <>
                      {entry.time && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {entry.time}
                        </div>
                      )}
                      {entry.location && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {entry.location}
                        </div>
                      )}
                      {entry.meetLink && (
                        <a href={entry.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                          <ExternalLink className="h-3 w-3" /> Join Meeting
                        </a>
                      )}

                      {/* Actions — only show for the active card */}
                      {isActive && isConverted(entry.title) && actionMode === "idle" && (
                        <div className="flex items-center gap-1 pt-1 border-t text-[10px] text-emerald-600">
                          <Check className="h-3 w-3" /> Already a task
                        </div>
                      )}
                      {isActive && !isConverted(entry.title) && actionMode === "idle" && (
                        <div className="flex gap-1.5 pt-1 border-t">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 flex-1" onClick={() => { setActiveActionId(entryKey); setActionMode("create"); setCreateDescription([entry.time, entry.location, entry.meetLink].filter(Boolean).join(" | ")); }}>
                            <Plus className="h-3 w-3" /> Create Task
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 flex-1" onClick={() => { setActiveActionId(entryKey); setActionMode("link"); }}>
                            <ListPlus className="h-3 w-3" /> Link to Task
                          </Button>
                        </div>
                      )}

                      {isActive && !String(entry.id).startsWith("new-") && actionMode === "create" && (
                        <div className="space-y-2 pt-2 border-t">
                          <Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Description..." className="min-h-[48px] text-xs resize-none" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: effectiveColumnColors[createColumnId] || "#94a3b8" }} />
                                <span className="flex-1 text-left truncate">{columns.find((c) => c.id === createColumnId)?.name || "Select status..."}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[160px]">
                              {columns.map((col) => (
                                <button key={col.id} type="button" onClick={() => setCreateColumnId(col.id)} className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-xs transition-colors ${createColumnId === col.id ? "bg-muted font-medium" : "hover:bg-muted"}`}>
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: effectiveColumnColors[col.id] || "#94a3b8" }} />
                                  {col.name}
                                  {createColumnId === col.id && <CheckCircle2 className="h-3 w-3 text-primary ml-auto" />}
                                </button>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                                {createAssigneeId ? (
                                  <>
                                    <Avatar className="h-4 w-4"><AvatarFallback className="text-[7px] bg-primary/10 text-primary">{(() => { const m = members.find((m) => String(m.userId) === createAssigneeId); return m ? `${m.user.firstName?.[0]}${m.user.lastName?.[0]}` : "?"; })()}</AvatarFallback></Avatar>
                                    <span className="flex-1 text-left truncate">{(() => { const m = members.find((m) => String(m.userId) === createAssigneeId); return m ? `${m.user.firstName} ${m.user.lastName}` : ""; })()}</span>
                                  </>
                                ) : (
                                  <><UserPlus className="h-3.5 w-3.5 text-muted-foreground" /><span className="flex-1 text-left text-muted-foreground">Assign to...</span></>
                                )}
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[160px]">
                              {members.map((m) => {
                                const active = String(m.userId) === createAssigneeId;
                                return (
                                  <button key={m.userId} type="button" onClick={() => setCreateAssigneeId(active ? "" : String(m.userId))} className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-xs transition-colors ${active ? "bg-muted font-medium" : "hover:bg-muted"}`}>
                                    <Avatar className="h-4 w-4"><AvatarFallback className="text-[7px] bg-primary/10 text-primary">{m.user.firstName?.[0]}{m.user.lastName?.[0]}</AvatarFallback></Avatar>
                                    <span className="flex-1">{m.user.firstName} {m.user.lastName}</span>
                                    {active && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                  </button>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className={`flex-1 text-left ${createDueDate ? "" : "text-muted-foreground"}`}>
                                  {createDueDate ? new Date(createDueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Due date..."}
                                </span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-auto p-0">
                              <CalendarWidget mode="single" selected={createDueDate ? new Date(createDueDate) : undefined} onSelect={(date) => { if (!date) { setCreateDueDate(""); return; } setCreateDueDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`); }} captionLayout="dropdown" />
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <div className="flex gap-1.5">
                            <Button size="sm" className="h-6 text-[10px]" disabled={isSubmitting} onClick={() => void handleCreateTask()}>{isSubmitting ? "Creating..." : "Create"}</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setActionMode("idle")}>Cancel</Button>
                          </div>
                        </div>
                      )}

                      {isActive && actionMode === "link" && (
                        <div className="space-y-1.5 pt-1 border-t">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase">Link to task:</p>
                          {workspaceTasks.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">No tasks in this workspace</p>
                          ) : (
                            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                              <SelectTrigger className="h-7 text-[10px]">
                                <SelectValue placeholder="Select a task..." />
                              </SelectTrigger>
                              <SelectContent>
                                {workspaceTasks.map((t) => (
                                  <SelectItem key={t.id} value={t.id} className="text-xs">
                                    {t.columnName} — {t.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <div className="flex gap-1.5">
                            <Button size="sm" className="h-6 text-[10px]" disabled={!selectedTaskId || isSubmitting} onClick={() => void handleLinkToTask()}>{isSubmitting ? "Linking..." : "Link"}</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setActionMode("idle")}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
