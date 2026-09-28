export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "rigpk-theme";

// Runs inline in <head> before first paint so a saved dark theme never
// flashes light. Light is the default; dark only ever comes from the button.
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}})()`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // private mode / blocked storage: the switch still works for this visit
  }
}

/* ── The "scene change" wipe ─────────────────────────────────────────────

   The old page is a frozen snapshot pushed off one side (and dimmed, as if
   leaving the light); the new page is revealed behind a skewed maroon band.

   Every moving part is a transform or an opacity on a view-transition
   pseudo-element, so the whole wipe runs on the compositor in Blink, WebKit
   and Gecko alike. That rules out clip-path: WebKit and Gecko animate it on
   the main thread, so a clip-path seam falls behind a compositor-driven band
   (the old wipe's "rectangles" on iOS and its lagging dark edge).

   The seam is a window instead. The old snapshot's group is skewed like the
   band, clips its overflow, and slides with the band; the image pair inside
   it carries the exact inverse transform, so the page holds still while the
   window's edge sweeps across it. Both sit on one sampled keyframe table, so
   they cancel on every frame.

   Geometry is worked in a left-bound frame (into dark) and mirrored for the
   way back. s is the seam's x at the top of the screen; the skew leans it
   back by y·tan 12° further down. The band sits just ahead of the seam, and
   its speed lines and smear trail behind it over the new page. */

const SKEW = 12;
const TAN = Math.tan((SKEW * Math.PI) / 180);
const SAMPLES = 64;
/** The edge stripe overhangs the seam by this much, onto the new page. */
const EDGE = 3;
/** Clearance past the screen edge at the start and end, against capture rounding. */
const MARGIN = 8;
/** How far the old page drifts away while it is pushed out, as a share of the viewport. */
const PARALLAX = 0.3;
/** Old page brightness at the end; applied as opacity over a black backing. */
const DIM = 0.55;
/** Speed lines stretch with speed: this long at rest, this much longer at full speed. */
const LINES_REST = 0.55;
const LINES_STRETCH = 0.75;

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/**
 * Seam speed over the wipe (t in 0–1, unitless). It launches already moving,
 * because the band starts off-screen and any wind-up there is only latency
 * after the click; it cruises across the screen so no single frame has to
 * cover a huge jump; then it brakes while the band and its trail clear the
 * far edge. Peak is about 1.4× the average speed (the old cubic-bezier was
 * 3.1×, which is what made the band strobe at 60 Hz).
 */
function speed(t: number): number {
  const launch = 0.55 + 0.45 * smoothstep(t / 0.18);
  const brake = t < 0.6 ? 1 : Math.pow(1 - (t - 0.6) / 0.4, 1.6);
  return launch * brake;
}

/** Progress (0–1 distance) and normalised speed at each sample time. */
function profile(): { t: number; e: number; v: number }[] {
  const fine = 1200;
  const cum = [0];
  let peak = 0;
  for (let i = 1; i <= fine; i++) {
    const a = speed((i - 1) / fine);
    const b = speed(i / fine);
    cum.push(cum[i - 1] + (a + b) / 2);
    peak = Math.max(peak, b);
  }
  const total = cum[fine];
  return Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const t = i / SAMPLES;
    return { t, e: cum[Math.round(t * fine)] / total, v: speed(t) / peak };
  });
}

let cachedProfile: ReturnType<typeof profile> | null = null;

function buildRig(): HTMLDivElement {
  const rig = document.createElement("div");
  rig.className = "theme-wipe";
  rig.setAttribute("aria-hidden", "true");
  rig.innerHTML =
    '<div class="tw-part tw-smear"><div class="tw-flip"></div></div>' +
    '<div class="tw-part tw-lines"><div class="tw-flip"></div></div>' +
    '<div class="tw-part tw-band"><div class="tw-flip">' +
    '<i class="tw-lead"></i><i class="tw-accent"></i><i class="tw-slab"></i><i class="tw-edge"></i>' +
    "</div></div>";
  return rig;
}

/** Starts every wipe animation on the transition's pseudo-elements. Returns false if it could not. */
function animateWipe(rig: HTMLDivElement, leftward: boolean): boolean {
  const root = document.documentElement;
  const band = rig.querySelector<HTMLElement>(".tw-band");
  const lines = rig.querySelector<HTMLElement>(".tw-lines");
  const smear = rig.querySelector<HTMLElement>(".tw-smear");
  if (!band || !lines || !smear) return false;

  const W = window.innerWidth;
  const H = band.offsetHeight;
  const B = band.offsetWidth - EDGE;
  const T = lines.offsetWidth;
  const S = smear.offsetWidth;

  // Seam at the top of the screen: starts with the whole band (its lower
  // end leans furthest out) just past the right edge; ends with the trailing
  // lines, at their resting length, just past the left edge.
  const s0 = W + B + H * TAN + MARGIN;
  const s1 = -(EDGE + LINES_REST * T + MARGIN);
  const D = s0 - s1;
  // The old page may only start drifting once the band's top has entered,
  // or its trailing edge would open a gap in front of the band.
  const e0 = (H * TAN + MARGIN) / D;
  // Longer sweeps get more time, so the speed stays in a band that reads
  // cleanly at 60 Hz: ~0.7 s on a phone, ~1 s on a wide desktop.
  const duration = Math.round(Math.min(1050, Math.max(700, 360 + 0.32 * D)));

  const m = leftward ? 1 : -1;
  // The rig rests at left: -300vw; parts are placed relative to that.
  const place = (u: number, w: number) => (leftward ? u : W - u - w) + 3 * W;
  const px = (n: number) => `${n.toFixed(2)}px`;

  const frames = (cachedProfile ??= profile());
  const group: Keyframe[] = [];
  const pair: Keyframe[] = [];
  const old: Keyframe[] = [];
  const bandK: Keyframe[] = [];
  const linesK: Keyframe[] = [];
  const smearK: Keyframe[] = [];

  for (const { t, e, v } of frames) {
    const s = s0 - D * e;
    const x = Math.max(0, (e - e0) / (1 - e0));
    const drift = PARALLAX * W * Math.pow(x, 1.4);
    group.push({ offset: t, transform: `translateX(${px(m * (s - W))}) skewX(${-m * SKEW}deg)` });
    pair.push({ offset: t, transform: `skewX(${m * SKEW}deg) translateX(${px(m * (W - s - drift))})` });
    old.push({ offset: t, opacity: 1 - (1 - DIM) * e });
    bandK.push({ offset: t, transform: `translateX(${px(place(s - B, B + EDGE))}) skewX(${-m * SKEW}deg)` });
    const lineScale = LINES_REST + LINES_STRETCH * v;
    linesK.push({
      offset: t,
      transform: `translateX(${px(place(s + EDGE, T))}) skewX(${-m * SKEW}deg) scaleX(${lineScale.toFixed(4)})`,
    });
    const smearScale = Math.max(0.001, Math.pow(v, 1.3));
    smearK.push({
      offset: t,
      transform: `translateX(${px(place(s + EDGE - 1, S))}) skewX(${-m * SKEW}deg) scaleX(${smearScale.toFixed(4)})`,
    });
  }

  const timing = { duration, easing: "linear", fill: "both" } as const;
  const run = (keyframes: Keyframe[], pseudoElement: string) =>
    root.animate(keyframes, { ...timing, pseudoElement });

  run(group, "::view-transition-group(root)");
  run(pair, "::view-transition-image-pair(root)");
  run(old, "::view-transition-old(root)");
  run(smearK, "::view-transition-new(tw-smear)");
  run(linesK, "::view-transition-new(tw-lines)");
  run(bandK, "::view-transition-new(tw-band)");
  return true;
}

/**
 * Switch theme with the "scene change" wipe. Browsers without View
 * Transitions switch instantly; reduced-motion users get a short cross-fade.
 */
export function switchTheme(next: Theme, onSwap?: () => void): Promise<void> {
  const root = document.documentElement;

  if (typeof document.startViewTransition !== "function") {
    apply(next);
    onSwap?.();
    return Promise.resolve();
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Into dark the scene exits left; back to light it exits right, so the
  // two themes read as neighbouring scenes rather than the same cut twice.
  const leftward = next === "dark";
  root.dataset.wipe = reduced ? "fade" : leftward ? "left" : "right";
  const rig = reduced ? null : buildRig();

  const transition = document.startViewTransition(() => {
    // Hover/background transitions would otherwise play out inside the
    // live "new" snapshot and smear the reveal. With a wipe this class also
    // renames the new root (see globals.css) so old and new get groups of
    // their own and the old one can be windowed.
    root.classList.add("theme-switching");
    apply(next);
    onSwap?.();
    if (rig) document.body.appendChild(rig);
  });

  // Safety net: never leave the rig or the flags behind, even if the
  // transition is skipped (tab hidden, another transition started).
  const cleanup = () => {
    rig?.remove();
    root.classList.remove("theme-switching");
    delete root.dataset.wipe;
  };
  const timer = window.setTimeout(cleanup, 2000);

  if (rig) {
    transition.ready
      .then(() => {
        if (!animateWipe(rig, leftward)) transition.skipTransition();
      })
      .catch(() => transition.skipTransition());
  }

  return transition.finished
    .catch(() => {})
    .then(() => {
      window.clearTimeout(timer);
      cleanup();
    });
}
