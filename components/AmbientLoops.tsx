"use client";

import { useEffect, useRef } from "react";
import { useDragLoop } from "@/lib/hooks/useDragLoop";

/**
 * A wrapper for looping animations (the hero lines, the retailer marquee).
 * The loops
 * are plain CSS transform animations the compositor runs; this keeps them
 * cheap and keeps them flowing through the theme wipe.
 *
 * Off screen: the wrapper marks itself `data-offscreen`, so CSS can pause
 * the loops instead of ticking them for nothing (and draining a phone's
 * battery).
 *
 * During the theme wipe (`data-wipe` on <html>, see lib/theme.ts): WebKit
 * stops advancing compositor animations inside a View Transition's live
 * "new" snapshot, and picks them up again after the transition from where
 * they stopped, so the lines froze for the whole wipe and then seemed to
 * restart. Main-thread changes do show up in that snapshot. So for the
 * wipe, this marks the wrapper `data-hold` (CSS pauses the loops,
 * globals.css), steps them from the main thread instead, one seek per
 * frame, then hands them back on the same clock. Nothing is repainted:
 * it's still only transforms.
 *
 * WebKit only. Blink and Gecko keep compositor animations running inside
 * the snapshot, and there the hold is pure cost: ~100 strips restyled on
 * the main thread every frame of the wipe, then all handed back to the
 * compositor at once as the wipe ends (measured on Android Chrome,
 * docs/motion.md).
 */
function holdsLoopsInWipe(): boolean {
  // Every iOS browser is WebKit and none says "Chrome/" (iOS Chrome says
  // "CriOS/"). Desktop Safari and Epiphany are WebKit too. Blink browsers
  // (Chrome, Edge, Samsung Internet, Android WebView) all carry "Chrome/".
  const ua = navigator.userAgent;
  return /AppleWebKit\//.test(ua) && !/(Chrome|Chromium)\//.test(ua);
}

export default function AmbientLoops({
  className,
  children,
  decorative = true,
  draggable = false,
}: {
  className?: string;
  children: React.ReactNode;
  /** Hide from assistive tech. Off when the loop carries real links. */
  decorative?: boolean;
  /** On phones, let the loop be dragged by hand (lib/hooks/useDragLoop.ts). */
  draggable?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDragLoop(ref, draggable);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      el.toggleAttribute("data-offscreen", !entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof MutationObserver === "undefined" || !holdsLoopsInWipe()) return;
    const root = document.documentElement;
    const clock = () => Number(document.timeline.currentTime ?? performance.now());

    let held: { anim: Animation; from: number }[] | null = null;
    let start = 0;
    let frame = 0;
    const seek = () => {
      const dt = clock() - start;
      for (const { anim, from } of held ?? []) anim.currentTime = from + dt;
    };
    const step = () => {
      seek();
      frame = requestAnimationFrame(step);
    };

    // Runs as a microtask after data-wipe changes: on the way in that's
    // before the old page is captured, so both sides start from one frame.
    const mo = new MutationObserver(() => {
      const wiping = root.hasAttribute("data-wipe");
      if (wiping && !held) {
        if (el.hasAttribute("data-offscreen")) return;
        start = clock();
        held = el
          .getAnimations({ subtree: true })
          .map((anim) => ({ anim, from: Number(anim.currentTime ?? 0) }));
        el.setAttribute("data-hold", "");
        frame = requestAnimationFrame(step);
      } else if (!wiping && held) {
        cancelAnimationFrame(frame);
        seek();
        held = null;
        el.removeAttribute("data-hold");
      }
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-wipe"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={className} aria-hidden={decorative || undefined}>
      {children}
    </div>
  );
}
