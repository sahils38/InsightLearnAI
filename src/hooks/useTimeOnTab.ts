import { useEffect, useRef } from "react";

/**
 * Accumulates active wall-clock seconds while `active` is true AND the document
 * is visible AND the window is focused. Calls `onTick` with the running total
 * roughly once per second.
 *
 * Use to measure how long a user actively spent on a tab/section.
 */
export function useTimeOnTab(
  active: boolean,
  onTick: (totalSeconds: number) => void,
) {
  const totalRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const visibleRef = useRef(!document.hidden);
  const focusedRef = useRef(document.hasFocus());
  const onTickRef = useRef(onTick);

  // Keep callback ref fresh without retriggering the effect.
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    const isAccumulating = () => active && visibleRef.current && focusedRef.current;

    const tick = () => {
      const now = Date.now();
      if (isAccumulating()) {
        if (lastTickRef.current != null) {
          totalRef.current += (now - lastTickRef.current) / 1000;
        }
      }
      lastTickRef.current = now;
      onTickRef.current(totalRef.current);
    };

    const handleVisibility = () => {
      visibleRef.current = !document.hidden;
      // reset tick anchor so the gap doesn't count
      lastTickRef.current = Date.now();
    };
    const handleFocus = () => {
      focusedRef.current = true;
      lastTickRef.current = Date.now();
    };
    const handleBlur = () => {
      focusedRef.current = false;
      lastTickRef.current = Date.now();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    lastTickRef.current = active ? Date.now() : null;
    const interval = window.setInterval(tick, 1000);

    return () => {
      // accumulate any final partial second on unmount
      const now = Date.now();
      if (isAccumulating() && lastTickRef.current != null) {
        totalRef.current += (now - lastTickRef.current) / 1000;
        onTickRef.current(totalRef.current);
      }
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [active]);
}
