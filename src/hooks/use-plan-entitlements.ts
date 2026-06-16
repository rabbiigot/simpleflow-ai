import { useEffect, useState } from "react";
import { getMyEntitlements, type PlanEntitlements } from "@/lib/backend-api";

// Module-level cache so the entitlements are fetched once across the app.
let cached: PlanEntitlements | null = null;
let inflight: Promise<PlanEntitlements | null> | null = null;

export function refreshPlanEntitlements() {
  cached = null;
  inflight = null;
}

export function usePlanEntitlements() {
  const [entitlements, setEntitlements] = useState<PlanEntitlements | null>(
    cached,
  );

  useEffect(() => {
    if (cached) {
      setEntitlements(cached);
      return;
    }
    if (!inflight) {
      inflight = getMyEntitlements()
        .then((e) => {
          cached = e;
          return e;
        })
        .catch(() => null)
        .finally(() => {
          inflight = null;
        });
    }
    let active = true;
    inflight.then((e) => {
      if (active && e) setEntitlements(e);
    });
    return () => {
      active = false;
    };
  }, []);

  return entitlements;
}
