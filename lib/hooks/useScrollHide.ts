"use client";

import { useState, useEffect, useRef } from "react";

/** Distance (px) the user must travel in one direction before the bar flips. */
const HIDE_DISTANCE = 24;
const SHOW_DISTANCE = 48;

/** Shared transition for bars driven by this hook — eases out, no snap. */
export const SCROLL_HIDE_TRANSITION =
  "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Returns true when the user scrolls down past `threshold` px.
 * Returns false when they scroll back up.
 *
 * Direction changes are debounced by distance: the bar only hides after a
 * sustained downward scroll of HIDE_DISTANCE px and only returns after an
 * upward scroll of SHOW_DISTANCE px. Without this, the tiny back-and-forth
 * deltas of a touch scroll (and momentum settling) toggle the bar every frame.
 *
 * Pass `pinned` while an input inside the bar has focus: on mobile the soft
 * keyboard scrolls the page, which otherwise reads as a downward scroll and
 * translates the bar — and the focused search field with it — off screen
 * mid-typing.
 */
export function useScrollHide(threshold = 80, pinned = false): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  // Signed distance travelled since the last direction reversal.
  const travel = useRef(0);
  const ticking = useRef(false);
  const pinnedRef = useRef(pinned);
  useEffect(() => { pinnedRef.current = pinned; }, [pinned]);

  useEffect(() => {
    lastY.current = window.scrollY;

    function update() {
      ticking.current = false;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      // Clamp away iOS rubber-band overscroll so the bounce at either end
      // isn't read as a reversal.
      const y = Math.min(Math.max(window.scrollY, 0), Math.max(maxY, 0));
      const dy = y - lastY.current;
      lastY.current = y;
      if (pinnedRef.current || dy === 0) return;

      // Reset accumulated travel whenever direction flips.
      if ((dy > 0) !== (travel.current > 0)) travel.current = 0;
      travel.current += dy;

      if (y <= threshold) {
        setHidden(false);
      } else if (travel.current >= HIDE_DISTANCE) {
        setHidden(true);
      } else if (travel.current <= -SHOW_DISTANCE) {
        setHidden(false);
      }
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
