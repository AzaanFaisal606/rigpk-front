import { useEffect, type RefObject } from "react";

/** Only phones and small tablets get the hand-scrollable loop. */
const QUERY = "(max-width: 899px) and (prefers-reduced-motion: no-preference)";
/** How long the loop stays still after the finger lets go (and any fling settles). */
const HOLD_MS = 1000;
/** How long the loop takes to ease back up to full speed. */
const RAMP_MS = 900;
/** Movement below this is a tap or a hold, not a drag, and the card link still opens. */
const DRAG_SLOP = 6;
/** Fling friction per 16ms frame. */
const FRICTION = 0.94;

/** Samples in the ease-in keyframe table (linear between them). */
const RAMP_STEPS = 30;

/**
 * How far the ease wrapper holds the row back while the loop speeds up,
 * as a fraction of the total (0 → 1). The row's speed follows smoothstep
 * (3u² − 2u³: from rest, joining full speed with no kink), so the position it
 * lags behind a full-speed loop is u − (u³ − u⁴/2), scaled to end at 1.
 */
const holdBack = (u: number) => 2 * (u - u ** 3 + u ** 4 / 2);

/**
 * Makes a CSS marquee loop (`.ambient-loop` inside `ref`) draggable by hand.
 *
 * The loop stays a compositor transform animation the whole time. A drag
 * doesn't scroll anything: it seeks the animation's own clock, so a finger
 * moving left moves the row left and the three-copy wrap still works. A
 * fling coasts and slows down the same way; then the loop sits still for a
 * second and eases back up to speed.
 *
 * The ease-in is two compositor animations, not a main-thread ramp. The loop
 * restarts at full speed in one step, and the `.loop-ease` wrapper around it
 * plays a one-off translate that starts by cancelling the loop's motion and
 * lets go along a smooth curve. Changing `playbackRate` every frame instead
 * re-sent the loop to the compositor each frame and stuttered. Before the
 * ease starts, the loop's clock is wound back by the distance the ease will
 * make up, and the wrapper starts that far ahead, so nothing moves and the
 * wrapper ends at zero. A touch mid-ease folds the wrapper's offset back
 * into the loop's clock.
 *
 * It stops and starts the loop only through `playbackRate`, never `pause()`
 * or `play()`. Calling those overrides `animation-play-state` for good, and
 * globals.css relies on that property to pause the loop off screen and
 * during the theme wipe (AmbientLoops.tsx).
 *
 * `touch-action: pan-y` on the wrapper (globals.css, same media query) keeps
 * vertical page scrolling native; a vertical swipe that starts on the row
 * cancels the pointer, which counts as a hold.
 */
export function useDragLoop(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    let detach: (() => void) | null = null;
    const sync = () => {
      detach?.();
      detach = mq.matches ? attach(el) : null;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      detach?.();
    };
  }, [ref, enabled]);
}

function attach(el: HTMLElement): () => void {
  let anim: Animation | null = null;
  let frame = 0;
  let timer = 0;
  let pointerId: number | null = null;
  let startX = 0;
  let startTime = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0; // px per ms, positive = finger moving right
  let moved = false;
  let suppressClick = false;

  const loop = () => {
    const found = el.querySelector(".ambient-loop")?.getAnimations()[0] ?? null;
    return found && found.effect ? found : null;
  };
  const duration = (a: Animation) => Number(a.effect!.getComputedTiming().duration) || 1;
  // The keyframes slide the track left by one of its three copies per iteration.
  const pxPerMs = (a: Animation) => {
    const track = el.querySelector<HTMLElement>(".ambient-loop");
    return (track ? track.offsetWidth / 3 : 1) / duration(a);
  };
  // Keep the clock inside one iteration so seeking backwards never runs
  // into the animation's start.
  const seek = (a: Animation, t: number) => {
    const d = duration(a);
    a.currentTime = ((t % d) + d) % d;
  };

  const easeEl = () => el.querySelector<HTMLElement>(".loop-ease");
  let easeAnim: Animation | null = null;

  const stopMotion = () => {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
  };

  // Move the wrapper's offset (mid-ease or left over) into the loop's clock.
  // Only call with the loop stopped: both change in one task, so the row
  // doesn't move on screen.
  const foldEase = (a: Animation) => {
    const wrap = easeEl();
    if (!wrap) return;
    const offset = new DOMMatrix(getComputedStyle(wrap).transform).m41;
    easeAnim?.cancel();
    easeAnim = null;
    wrap.style.transform = "";
    if (offset) seek(a, Number(a.currentTime ?? 0) - offset / pxPerMs(a));
  };

  const rampUp = () => {
    if (!anim) return;
    const wrap = easeEl();
    if (!wrap) {
      anim.playbackRate = 1;
      return;
    }
    // What a full-speed loop covers during the ramp beyond an eased start.
    const shift = (pxPerMs(anim) * RAMP_MS) / 2;
    const keyframes = Array.from({ length: RAMP_STEPS + 1 }, (_, i) => ({
      transform: `translateX(${(shift * (holdBack(i / RAMP_STEPS) - 1)).toFixed(2)}px)`,
    }));
    // Wind the loop back by `shift` while the wrapper starts `shift` ahead:
    // same picture, and the ease finishes at no offset. All in one task.
    seek(anim, Number(anim.currentTime ?? 0) - shift / pxPerMs(anim));
    const from = Number(anim.currentTime ?? 0);
    anim.playbackRate = 1;
    const ease = wrap.animate(keyframes, { duration: RAMP_MS, easing: "linear" });
    easeAnim = ease;
    // A new animation waits a frame to start while the loop's rate change is
    // live at once, so for one frame the row jumped at full speed. Pin both
    // to the same timeline time. Skipped if CSS has the loop paused (off
    // screen): setting a start time would unpause it.
    const now = document.timeline.currentTime;
    if (now !== null && anim.playState === "running") {
      anim.startTime = Number(now) - from;
      ease.startTime = Number(now);
    }
    ease.onfinish = () => {
      if (easeAnim === ease) easeAnim = null;
    };
  };

  const holdThenResume = () => {
    clearTimeout(timer);
    timer = window.setTimeout(rampUp, HOLD_MS);
  };

  const coast = () => {
    if (!anim) return holdThenResume();
    const a = anim;
    const rate = pxPerMs(a);
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = now - prev;
      prev = now;
      seek(a, Number(a.currentTime ?? 0) - (velocity * dt) / rate);
      velocity *= FRICTION ** (dt / 16);
      if (Math.abs(velocity) > 0.02) frame = requestAnimationFrame(tick);
      else holdThenResume();
    };
    frame = requestAnimationFrame(tick);
  };

  const onDown = (e: PointerEvent) => {
    if (pointerId !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    suppressClick = false;
    anim = loop();
    if (!anim) return;
    stopMotion();
    anim.playbackRate = 0;
    foldEase(anim);
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    lastT = e.timeStamp;
    startTime = Number(anim.currentTime ?? 0);
    velocity = 0;
    moved = false;
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId || !anim) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > DRAG_SLOP) moved = true;
    if (!moved) return;
    seek(anim, startTime - dx / pxPerMs(anim));
    const dt = e.timeStamp - lastT;
    if (dt > 0) velocity = 0.8 * ((e.clientX - lastX) / dt) + 0.2 * velocity;
    lastX = e.clientX;
    lastT = e.timeStamp;
  };

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    suppressClick = moved;
    // A finger that stopped before lifting shouldn't fling.
    if (e.timeStamp - lastT > 80) velocity = 0;
    if (moved && e.type === "pointerup" && Math.abs(velocity) > 0.05) coast();
    else holdThenResume();
  };

  // A drag ends over a card link; don't let it open the store.
  const onClick = (e: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    e.preventDefault();
    e.stopPropagation();
  };

  el.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  el.addEventListener("click", onClick, true);

  return () => {
    stopMotion();
    el.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    el.removeEventListener("click", onClick, true);
    if (anim) {
      anim.playbackRate = 0;
      foldEase(anim);
      anim.playbackRate = 1;
    }
  };
}
