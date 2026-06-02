export const INVALIDATION_EVENT = "simpleflow:invalidate";

export type InvalidationDetail = {
  tags: string[];
  tools?: string[];
  at: number;
};

export function emitInvalidation(tags: string[], tools?: string[]) {
  if (typeof window === "undefined") return;
  if (!tags.length) return;

  const detail: InvalidationDetail = {
    tags: Array.from(new Set(tags)),
    tools,
    at: Date.now(),
  };

  window.dispatchEvent(new CustomEvent<InvalidationDetail>(INVALIDATION_EVENT, { detail }));

  // Back-compat: some parts of the app still listen to specific events.
  if (detail.tags.includes("timeRecords")) {
    window.dispatchEvent(new Event("simpleflow:time-records:changed"));
  }
  if (detail.tags.includes("workspaces")) {
    window.dispatchEvent(new Event("simpleflow:workspaces:changed"));
  }
  if (detail.tags.includes("social")) {
    window.dispatchEvent(new Event("simpleflow:social:changed"));
  }
}

export function subscribeInvalidation(
  handler: (detail: InvalidationDetail) => void,
) {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const custom = event as CustomEvent<InvalidationDetail>;
    if (!custom.detail?.tags?.length) return;
    handler(custom.detail);
  };

  window.addEventListener(INVALIDATION_EVENT, listener as EventListener);
  return () => window.removeEventListener(INVALIDATION_EVENT, listener as EventListener);
}
