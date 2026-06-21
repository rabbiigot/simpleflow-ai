import { useEffect, useState } from "react";

/**
 * Returns the height (in px) currently covered by the on-screen keyboard,
 * derived from the VisualViewport API. 0 when no keyboard is shown (and on
 * desktop / unsupported browsers). Lets a chat lift its input above the
 * keyboard without shrinking its own height.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const update = () => {
      // The portion of the layout viewport hidden below the visual viewport
      // (i.e. the keyboard) = innerHeight - visualViewport.height - offsetTop.
      const covered = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      // Ignore tiny deltas (browser chrome jitter) so we only react to a keyboard.
      setInset(covered > 120 ? Math.round(covered) : 0);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}

export default useKeyboardInset;
