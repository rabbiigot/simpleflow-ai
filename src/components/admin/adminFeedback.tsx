import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3000";

type FeedbackCategory = "BUG" | "SUGGESTION" | "QUESTION" | "OTHER";
type FeedbackPriority = "LOW" | "MEDIUM" | "HIGH";
type FeedbackStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

type Ticket = {
  id: number;
  userId: number | null;
  userEmail: string;
  userName: string | null;
  category: FeedbackCategory;
  title: string;
  message: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  createdAt: string;
};

const STATUSES: FeedbackStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const CATEGORY_STYLE: Record<FeedbackCategory, string> = {
  BUG: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  SUGGESTION: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  QUESTION: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  OTHER: "bg-muted text-muted-foreground",
};

const PRIORITY_STYLE: Record<FeedbackPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const STATUS_STYLE: Record<FeedbackStatus, string> = {
  OPEN: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  CLOSED: "bg-muted text-muted-foreground",
};

export function AdminFeedback({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (item: Ticket, status: FeedbackStatus) => {
    try {
      const res = await fetch(`${API_BASE}/feedback/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status } : f)),
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        <span>
          {items.length} {items.length === 1 ? "ticket" : "tickets"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_STYLE[item.category]}`}>
                      {item.category}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_STYLE[item.priority]}`}>
                      {item.priority}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[item.status]}`}>
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {item.message}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {item.userName || "Unknown"} · {item.userEmail} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0">
                  <Select
                    value={item.status}
                    onValueChange={(v) => void updateStatus(item, v as FeedbackStatus)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
