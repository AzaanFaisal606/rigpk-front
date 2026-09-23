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

// Must match the `.theme-wipe` animation length in globals.css.
const WIPE_MS = 1100;

/**
 * Switch theme with the "scene change" wipe: the old page is pushed off one
 * side while the new one slides in behind a skewed maroon band. Built on the
 * View Transitions API, so it animates two GPU snapshots of the page and the
 * live DOM underneath never moves. Browsers without it, and reduced-motion
 * users, get an instant switch.
 */
export function switchTheme(next: Theme, onSwap?: () => void): Promise<void> {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || typeof document.startViewTransition !== "function") {
    apply(next);
    onSwap?.();
    return Promise.resolve();
  }

  // Into dark the scene exits left; back to light it exits right, so the
  // two themes read as neighbouring scenes rather than the same cut twice.
  root.dataset.wipe = next === "dark" ? "left" : "right";

  // The band is a real element with its own view-transition-name, so it is
  // captured as a layer that paints above both page snapshots. Its resting
  // position is off-screen, so the frame after the transition can't flash it.
  const band = document.createElement("div");
  band.className = "theme-wipe";
  band.setAttribute("aria-hidden", "true");
  band.innerHTML =
    '<div class="tw-flip"><div class="tw-skew">' +
    '<i class="tw-lead"></i><i class="tw-accent"></i><i class="tw-slab"></i>' +
    '<i class="tw-edge"></i><i class="tw-lines"></i>' +
    "</div></div>";

  const transition = document.startViewTransition(() => {
    // Hover/background transitions would otherwise play out inside the
    // live "new" snapshot and smear the reveal.
    root.classList.add("theme-switching");
    apply(next);
    onSwap?.();
    document.body.appendChild(band);
  });

  // Safety net: never leave the band or the flags behind, even if the
  // transition is skipped (tab hidden, another transition started).
  const cleanup = () => {
    band.remove();
    root.classList.remove("theme-switching");
    delete root.dataset.wipe;
  };
  const timer = window.setTimeout(cleanup, WIPE_MS + 400);

  return transition.finished
    .catch(() => {})
    .then(() => {
      window.clearTimeout(timer);
      cleanup();
    });
}
