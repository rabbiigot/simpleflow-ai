import { useEffect, useState } from "react";

// Tailwind's `md` breakpoint is 768px. Anything below is treated as mobile.
export const MOBILE_BREAKPOINT = 768;

/**
 * Returns `true` when the viewport is narrower than the `md` breakpoint.
 * SSR-safe (defaults to `false` until mounted) and updates on resize.
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT): boolean {
  const query = `(max-width: ${breakpoint - 1}px)`;

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Sync immediately in case it changed before the listener attached.
    setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return isMobile;
}

export default useIsMobile;
