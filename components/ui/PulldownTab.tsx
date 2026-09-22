"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { monoFont } from "@/lib/tokens";

interface Props {
  /** Text on the lip. */
  label: string;
  /** Accessible name for the menu; defaults to `label`. */
  title?: string;
  /** Menu contents. Always rendered (slid out of view and `inert` while
   *  closed) so any links inside stay in the server HTML for crawlers. */
  children: ReactNode;
  /** The drawer sits in a row laid out like the host bar's content row, so
   *  its left edge and lip line up under a specific control. */
  rowMaxWidth?: string;
  rowPadding?: string;
  lipWidth?: string;
}

/**
 * A drawer tucked behind the bottom edge of the nearest positioned ancestor
 * (a filter bar, a header strip). Closed, only its lip peeks out; clicking
 * the lip pulls the whole drawer down so it hangs from the host bar, lip
 * still attached along its bottom edge. The host must be positioned.
 *
 * Motion, hover and responsive width live in globals.css (`.pulldown-*`)
 * so `prefers-reduced-motion` and the mobile width can override them.
 */
export default function PulldownTab({
  label,
  title,
  children,
  rowMaxWidth = "80rem",
  rowPadding = "0 24px",
  lipWidth = "180px",
}: Props) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const lipRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        lipRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: 0 }}>
      <div style={{ maxWidth: rowMaxWidth, margin: "0 auto", padding: rowPadding }}>
        {/* Clip box starting at the host's bottom edge: whatever of the drawer
            is above it is hidden, so the drawer reads as sliding out from
            behind the bar. Extra right room keeps the shadow unclipped. */}
        <div
          className="pulldown-clip"
          style={{
            position: "relative",
            height: "100vh",
            paddingRight: "10px",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {/* The drawer's own box is just the menu body, so closed it is pulled
              up by exactly its height; the lip hangs off its bottom edge
              (absolutely, so it isn't part of that height) and is all that
              stays below the bar. Hover moves only the lip, never the menu. */}
          <div
            ref={drawerRef}
            className="pulldown-drawer"
            data-open={open ? "true" : "false"}
            style={{ position: "relative", pointerEvents: "auto" }}
          >
            <div
              id={panelId}
              role="region"
              aria-label={title ?? label}
              inert={!open}
              className="pulldown-body"
              style={{
                background: "var(--purple)",
                border: "2px solid #111112",
                borderTop: "none",
                padding: "18px",
                maxHeight: "calc(100vh - 220px)",
                overflowY: "auto",
              }}
            >
              {children}
            </div>

            <button
              ref={lipRef}
              type="button"
              className="pulldown-lip"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen(o => !o)}
              style={{
                position: "absolute",
                top: "calc(100% - 2px)", // overlap the body's bottom border so they merge
                left: 0,
                width: lipWidth,
                // Taller than what shows: the top slice stays tucked behind the
                // bar (or the body) and is what slides into view on hover.
                height: "32px",
                paddingTop: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                background: "var(--purple)",
                color: "white",
                border: "2px solid #111112",
                borderTop: "none",
                boxShadow: "3px 3px 0 #111112",
                fontFamily: monoFont,
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {label}
              <span aria-hidden className="pulldown-caret" style={{ display: "inline-block", fontSize: "8px" }}>
                ▼
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
