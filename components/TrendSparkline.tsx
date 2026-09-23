"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { TrendPoint } from "@/lib/trends-api";

const W = 300;
const H = 60;
const PAD_X = 6;
const PAD_Y = 8;
// Sticky navbar is 52px tall at z-50 — if the "above" placement would land
// the tooltip's top edge inside that band, flip it below the point instead
// so it never renders under (or barely over) the navbar.
const NAVBAR_CLEARANCE = 100;

function fmt(n: number): string {
  return "Rs " + n.toLocaleString("en-PK");
}

function shortDate(iso: string): string {
  // "2026-06-17" -> "17 Jun"
  const [, m, d] = iso.split("-");
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(d)} ${months[Number(m)]}`;
}

export default function TrendSparkline({ series }: { series: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // The wrap div is exactly W x H with no padding, so its rect doubles as
  // the svg's rect — recompute on scroll (row scrolls horizontally, and the
  // page can scroll too) so the fixed-position tooltip doesn't drift off
  // its point. `capture: true` on window also catches scroll events fired
  // on the nested .trend-row-scroll container, since scroll doesn't bubble.
  useEffect(() => {
    // setState is deferred to a microtask rather than called directly here —
    // calling it synchronously in an effect body triggers cascading renders
    // (react-hooks/set-state-in-effect); a microtask still resolves before
    // the next paint, so there's no visible delay.
    if (hover == null) {
      queueMicrotask(() => setAnchorRect(null));
      return;
    }
    const update = () => {
      if (wrapRef.current) setAnchorRect(wrapRef.current.getBoundingClientRect());
    };
    queueMicrotask(update);
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", update, { capture: true });
  }, [hover]);

  // Tap-to-toggle for touch: close on a second tap, Escape, or a tap
  // elsewhere. Mouse hover keeps working unchanged.
  useEffect(() => {
    if (hover == null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setHover(null);
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setHover(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [hover]);

  function handleTap(i: number) {
    setHover(cur => (cur === i ? null : i));
  }

  // Enter/leave are gated on pointerType === "mouse" deliberately. A real
  // touch browser synthesizes a mouse-enter before the click, so with plain
  // onMouseEnter a tap would set hover=i and then have handleTap immediately
  // toggle it back off — the tooltip would never appear on a phone, which is
  // the entire point of this change. Playwright's touch emulation does not
  // synthesize those events, so it would not have caught this.

  if (series.length === 0) {
    return (
      <div
        className="mono flex items-center justify-center"
        style={{
          width: W, height: H, fontSize: "0.6rem", fontWeight: 700,
          color: "var(--text-dim)", border: "1.5px solid #111112",
          background: "var(--bg-section)",
        }}
      >
        NO DATA
      </div>
    );
  }

  // No band. A group's spread (kit types, brands, used stock) is ~10x its
  // week-to-week movement, so any band fitted to a readable axis filled the
  // whole chart (22 of 39 whitelisted charts). The line answers "which way
  // did the price go"; the RANGE column carries the spread.
  const centerLo = Math.min(...series.map((p) => p.center_price));
  const centerHi = Math.max(...series.map((p) => p.center_price));
  // Padding is the larger of 60% of the movement (so a moving line never
  // touches the frame) and 1.5% of the price level (so a genuinely flat
  // series sits centered instead of being scaled up into meaningless noise).
  const pad = Math.max((centerHi - centerLo) * 0.6, centerHi * 0.015, 1);
  const lo = centerLo - pad;
  const hi = centerHi + pad;
  const span = hi - lo || 1;

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  // Spaced by date, not by point: scrapes are irregular (a 37-day gap once),
  // and equal spacing made a slow drift look as steep as a one-week drop.
  const t = series.map((p) => Date.parse(p.scrape_date));
  const tSpan = t[t.length - 1] - t[0];
  const x = (i: number) =>
    PAD_X + (series.length === 1 || !tSpan ? innerW / 2 : ((t[i] - t[0]) / tSpan) * innerW);
  // A gap this long is missing scrapes, not a trend: drawn dashed.
  const GAP_MS = 21 * 86_400_000;
  const isGap = (i: number) => t[i + 1] - t[i] > GAP_MS;
  const y = (v: number) =>
    Math.max(0, Math.min(H, PAD_Y + innerH - ((v - lo) / span) * innerH));

  const centerSegments = series.slice(1).map((p, i) => ({
    x1: x(i), y1: y(series[i].center_price), x2: x(i + 1), y2: y(p.center_price), gap: isGap(i),
  }));

  const active = hover != null ? series[hover] : null;
  // Flip tooltip below the point when the point sits in the upper half of
  // the chart, or when the chart itself is close enough to the top of the
  // viewport that an "above" tooltip would land under (or barely over) the
  // sticky navbar.
  const below =
    active != null &&
    (y(active.center_price) < H / 2 || (anchorRect != null && anchorRect.top < NAVBAR_CLEARANCE));

  return (
    <div ref={wrapRef} style={{ position: "relative", width: W, height: H }}>
      <svg
        width={W}
        height={H}
        style={{ display: "block", border: "1.5px solid #111112", background: "var(--bg-section)" }}
      >
        {/* center line, dashed across missing scrapes */}
        {centerSegments.map((sg, i) => (
          <line
            key={i}
            x1={sg.x1} y1={sg.y1} x2={sg.x2} y2={sg.y2}
            stroke="var(--purple)"
            strokeWidth={2}
            strokeDasharray={sg.gap ? "3 3" : undefined}
            strokeLinecap="square"
          />
        ))}
        {/* points + hover hit areas */}
        {series.map((p, i) => (
          <g key={i}>
            <rect
              x={i === 0 ? 0 : (x(i - 1) + x(i)) / 2}
              y={0}
              width={(i === series.length - 1 ? W : (x(i) + x(i + 1)) / 2) - (i === 0 ? 0 : (x(i - 1) + x(i)) / 2)}
              height={H}
              fill="transparent"
              onPointerEnter={e => { if (e.pointerType === "mouse") setHover(i); }}
              onPointerLeave={e => { if (e.pointerType === "mouse") setHover(null); }}
              onClick={() => handleTap(i)}
              style={{ cursor: "crosshair" }}
            />
            <rect
              x={x(i) - 2.5}
              y={y(p.center_price) - 2.5}
              width={5}
              height={5}
              fill={hover === i ? "#111112" : "var(--purple)"}
              stroke="#111112"
              strokeWidth={hover === i ? 1 : 0}
              pointerEvents="none"
            />
          </g>
        ))}
      </svg>

      {active && anchorRect && createPortal(
        <div
          className="mono"
          style={{
            position: "fixed",
            left: Math.min(
              Math.max(anchorRect.left + x(hover!) - 60, 8),
              window.innerWidth - 128
            ),
            ...(below
              ? { top: anchorRect.bottom + 2, transform: "none" }
              : { top: anchorRect.top - 2, transform: "translateY(-100%)" }),
            width: 120,
            background: "#111112",
            color: "white",
            border: "1.5px solid #111112",
            boxShadow: "2px 2px 0 var(--purple)",
            padding: "4px 6px",
            fontSize: "0.58rem",
            lineHeight: 1.5,
            zIndex: 60,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 800, letterSpacing: "0.5px", color: "var(--purple-pale, #f9e1ed)" }}>
            {shortDate(active.scrape_date)}
          </div>
          <div style={{ fontWeight: 800 }}>{fmt(active.median_price ?? active.center_price)}</div>
          {active.median_price != null && (
            <div style={{ opacity: 0.7 }}>index {fmt(active.center_price)}</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
