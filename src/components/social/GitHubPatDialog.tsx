import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteGitHubPat,
  getGitHubPatStatus,
  saveGitHubPat,
  type GitHubPatStatus,
} from "@/lib/backend-api";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  Loader2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GitHubPatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function GitHubPatDialog({
  open,
  onOpenChange,
  userId,
}: GitHubPatDialogProps) {
  const [patValue, setPatValue] = useState("");
  const [showPat, setShowPat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [patStatus, setPatStatus] = useState<GitHubPatStatus | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setIsLoading(true);
    setPatValue("");
    setShowPat(false);
    getGitHubPatStatus(userId)
      .then(setPatStatus)
      .catch(() => setPatStatus(null))
      .finally(() => setIsLoading(false));
  }, [open, userId]);

  const handleSave = async () => {
    if (!patValue.trim()) {
      toast.error("Please enter a Personal Access Token");
      return;
    }
    setIsSaving(true);
    try {
      await saveGitHubPat(userId, patValue.trim());
      toast.success("GitHub PAT saved securely");
      const status = await getGitHubPatStatus(userId);
      setPatStatus(status);
      setPatValue("");
      setShowPat(false);
    } catch {
      toast.error("Failed to save PAT");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGitHubPat(userId);
      setPatStatus({ hasPat: false });
      toast.success("GitHub PAT removed");
    } catch {
      toast.error("Failed to remove PAT");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            GitHub Personal Access Token
          </DialogTitle>
          <DialogDescription>
            A PAT is required to access repositories under GitHub Organizations.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Instructions */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                How to create a PAT for organization repos:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>
                  Go to{" "}
                  <a
                    href="https://github.com/settings/tokens?type=beta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    GitHub Token Settings
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Click <strong>"Generate new token"</strong> (Fine-grained)</li>
                <li>
                  Under <strong>Resource owner</strong>, select your{" "}
                  <strong>organization</strong>
                </li>
                <li>
                  Set <strong>Repository access</strong> to "All repositories" or select
                  specific ones
                </li>
                <li>
                  Under <strong>Permissions</strong>, grant:
                  <ul className="ml-4 mt-1 space-y-0.5 list-disc text-xs">
                    <li><strong>Contents</strong> — Read-only</li>
                    <li><strong>Metadata</strong> — Read-only</li>
                    <li><strong>Pull requests</strong> — Read-only</li>
                  </ul>
                </li>
                <li>Click <strong>"Generate token"</strong> and copy it</li>
              </ol>

              <div className="flex items-start gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 p-2.5 mt-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  If your org uses SSO, you must also{" "}
                  <strong>authorize the token for SSO</strong> after creation. Click
                  "Configure SSO" next to the token on the tokens page.
                </p>
              </div>
            </div>

            {/* Current PAT status */}
            {patStatus?.hasPat && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Current token</p>
                  <code className="text-sm font-mono text-foreground">
                    {patStatus.maskedPat}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* PAT input */}
            <div className="space-y-2">
              <Label htmlFor="github-pat">
                {patStatus?.hasPat ? "Replace token" : "Enter your token"}
              </Label>
              <div className="relative">
                <Input
                  id="github-pat"
                  type={showPat ? "text" : "password"}
                  value={patValue}
                  onChange={(e) => setPatValue(e.target.value)}
                  placeholder="github_pat_xxxxxxxxx..."
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPat(!showPat)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPat ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your token is encrypted (AES-256-GCM) before storage. It is never
                exposed in plain text.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !patValue.trim() || isLoading}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Save Token
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
