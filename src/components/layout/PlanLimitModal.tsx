import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Global modal shown when the API rejects an action with PLAN_LIMIT_EXCEEDED.
 * Triggered by the "simpleflow:plan-limit" event dispatched from apiRequest.
 */
export default function PlanLimitModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message?: string };
      setMessage(
        detail?.message ||
          "You've reached your plan limit. Upgrade to do more.",
      );
      setOpen(true);
    };
    window.addEventListener("simpleflow:plan-limit", handler);
    return () => window.removeEventListener("simpleflow:plan-limit", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle>Plan limit reached</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Dismiss
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              navigate({
                to: "/profile/settings",
                search: { tab: "organization" },
              });
            }}
          >
            Upgrade plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
