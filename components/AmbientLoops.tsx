"use client";

import { useEffect, useRef } from "react";

/**
 * A wrapper for decorative looping animations (the hero lines). The loops
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
 * wipe, CSS pauses the loops (globals.css) and this steps them from the
 * main thread instead, one seek per frame, then hands them back on the
 * same clock. Nothing is repainted: it's still only transforms.
 */
export default function AmbientLoops({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
    if (!el || typeof MutationObserver === "undefined") return;
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
        frame = requestAnimationFrame(step);
      } else if (!wiping && held) {
        cancelAnimationFrame(frame);
        seek();
        held = null;
      }
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-wipe"] });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={className} aria-hidden>
      {children}
    </div>
  );
}
