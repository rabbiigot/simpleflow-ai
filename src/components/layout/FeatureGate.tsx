import { Button } from "@/components/ui/button";
import { usePlanEntitlements } from "@/hooks/use-plan-entitlements";
import { type PlanEntitlements } from "@/lib/backend-api";
import { useAuthStore } from "@/store/auth-store";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Gates a page/feature by the user's subscription tier. Admins always pass.
 * While entitlements load, shows a spinner; if not allowed, shows an upgrade screen.
 */
export default function FeatureGate({
  allowed,
  title,
  description,
  children,
}: {
  allowed: (e: PlanEntitlements) => boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const entitlements = usePlanEntitlements();
  const isAdmin = useAuthStore((s) => s.user?.role === "ADMIN");
  const navigate = useNavigate();

  if (isAdmin) return <>{children}</>;

  if (!entitlements) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allowed(entitlements)) return <>{children}</>;

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>
        <Button
          onClick={() =>
            navigate({
              to: "/profile/settings",
              search: { tab: "organization" },
            })
          }
        >
          Upgrade plan
        </Button>
      </div>
    </div>
  );
}
