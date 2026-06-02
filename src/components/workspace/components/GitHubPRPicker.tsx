import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTaskComment,
  getCurrentUserId,
  getGitHubStatus,
  listGitHubPRs,
  type GitHubEventItem,
  type GitHubStatus,
} from "@/lib/backend-api";
import githubIcon from "@/assets/github.svg";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Props = {
  workspaceId: string;
  taskId: string;
  onClose: () => void;
  onCommentAdded: (comment: any) => void;
};

export default function GitHubPRPicker({ workspaceId, taskId, onClose, onCommentAdded }: Props) {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [prs, setPRs] = useState<GitHubEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = getCurrentUserId();

  const loadPRs = async (searchVal: string, pageVal: number) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result = await listGitHubPRs(userId, searchVal || undefined, pageVal, 10);
      setPRs(result.items);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch {
      setPRs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    getGitHubStatus(userId)
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
    void loadPRs("", 1);
  }, [userId]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void loadPRs(val, 1);
    }, 400);
  };

  const handleSelect = async (pr: GitHubEventItem) => {
    if (!userId) return;
    setSubmitting(pr.id);
    try {
      const sha = pr.sha ? pr.sha.slice(0, 7) : "";
      const lines = [
        `@@activity@@🔀 **PR #${pr.prNumber} ${pr.action || "opened"}**`,
        `**Summary:** ${pr.title}${sha ? ` \`${sha}\`` : ""}`,
        pr.body ? `**Description:** ${pr.body.slice(0, 300)}` : "",
        `on \`${pr.repo?.repoFullName || ""}\``,
        pr.url ? `[View on GitHub](${pr.url})` : "",
      ].filter(Boolean);
      const content = lines.join("\n");

      const comment = await createTaskComment(workspaceId, taskId, {
        userId,
        content,
      });
      onCommentAdded(comment);
      toast.success(`PR #${pr.prNumber} added to task`);
      onClose();
    } catch {
      toast.error("Failed to add PR to task");
    } finally {
      setSubmitting(null);
    }
  };

  if (!status?.connected) {
    return (
      <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border bg-card shadow-lg p-3 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">GitHub PRs</span>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center py-3">
          GitHub not connected. Go to Profile Settings → Integrations to connect.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border bg-card shadow-lg z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-medium flex items-center gap-1.5">
          <img src={githubIcon} alt="" className="h-3.5 w-3.5 dark:invert" />
          Link GitHub PR
        </span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search PRs by title, hash, or description..."
            className="h-7 text-xs pl-7"
          />
        </div>
      </div>

      {/* PR List */}
      <div className="max-h-52 overflow-y-auto px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : prs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No PRs found</p>
        ) : (
          prs.map((pr) => (
            <button
              key={pr.id}
              type="button"
              disabled={submitting === pr.id}
              onClick={() => void handleSelect(pr)}
              className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              <img src={githubIcon} alt="" className="h-3.5 w-3.5 mt-0.5 shrink-0 dark:invert" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {pr.sha && (
                    <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">
                      {pr.sha.slice(0, 7)}
                    </code>
                  )}
                  <span className="text-xs font-medium truncate">
                    #{pr.prNumber} {pr.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{pr.repo?.repoFullName}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">{pr.action}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(pr.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
              {submitting === pr.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />}
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2"
            disabled={page <= 1}
            onClick={() => void loadPRs(search, page - 1)}
          >
            <ChevronLeft className="h-3 w-3 mr-0.5" />
            Prev
          </Button>
          <span className="text-[10px] text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2"
            disabled={page >= totalPages}
            onClick={() => void loadPRs(search, page + 1)}
          >
            Next
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
