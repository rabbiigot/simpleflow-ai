import { subscribeInvalidation, type InvalidationDetail } from "@/lib/invalidation";
import { useEffect, useMemo } from "react";

function matches(tags: string[], incoming: string[]) {
  const set = new Set(incoming);
  return tags.some((tag) => set.has(tag));
}

export function useInvalidation(tags: string[], onInvalidate: (detail: InvalidationDetail) => void) {
  const stableTags = useMemo(() => tags.filter(Boolean), [tags]);

  useEffect(() => {
    return subscribeInvalidation((detail) => {
      if (matches(stableTags, detail.tags)) {
        onInvalidate(detail);
      }
    });
  }, [onInvalidate, stableTags]);
}

