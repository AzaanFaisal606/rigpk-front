"use client";

import { useRef, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { currentTheme, switchTheme, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

/**
 * Light/dark switch. Which icon shows is decided in CSS from
 * `html[data-theme]`, so the server HTML is right for a saved dark theme
 * before hydration; the state here only drives the label.
 */
export default function ThemeButton() {
  const theme = useSyncExternalStore<Theme>(subscribe, currentTheme, () => "light");
  const busy = useRef(false);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (busy.current) return;
    busy.current = true;
    const btn = e.currentTarget;
    // Arms the icon's spin-in (it plays whenever an icon goes from hidden to
    // shown). Armed inside the swap, never on load, and never while the old
    // icon is still on screen to be captured mid-spin.
    switchTheme(next, () => { btn.dataset.spun = ""; })
      .finally(() => { busy.current = false; });
  }

  return (
    <button
      type="button"
      className="theme-btn"
      onClick={onClick}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Moon className="theme-icon theme-icon--moon" size={15} strokeWidth={2.5} aria-hidden />
      <Sun className="theme-icon theme-icon--sun" size={15} strokeWidth={2.5} aria-hidden />
    </button>
  );
}
