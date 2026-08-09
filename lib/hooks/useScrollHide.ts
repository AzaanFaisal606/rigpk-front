"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Returns true when the user scrolls down past `threshold` px.
 * Returns false when they scroll back up.
 *
 * Pass `pinned` while an input inside the bar has focus: on mobile the soft
 * keyboard scrolls the page, which otherwise reads as a downward scroll and
 * translates the bar — and the focused search field with it — off screen
 * mid-typing.
 */
export function useScrollHide(threshold = 80, pinned = false): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);
  const pinnedRef = useRef(pinned);
  useEffect(() => { pinnedRef.current = pinned; }, [pinned]);

  useEffect(() => {
    function update() {
      ticking.current = false;
      if (pinnedRef.current) return;
      const y = window.scrollY;
      if (y > lastY.current && y > threshold) {
        setHidden(true);
      } else if (y < lastY.current) {
        setHidden(false);
      }
      lastY.current = y;
    }
    function handler() {
      // Coalesce to one state update per frame — the raw scroll event fires
      // far more often than the bar can usefully re-render.
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    }
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  // Derived, not stored: while pinned the bar is always shown, and unpinning
  // restores whatever the scroll position already implied.
  return pinned ? false : hidden;
}
