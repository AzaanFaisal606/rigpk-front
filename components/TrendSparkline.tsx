"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/trends-api";

const W = 300;
const H = 60;
const PAD_X = 6;
const PAD_Y = 8;

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

  // Y-scale spans the full min/max band across all points (honest range).
  const lo = Math.min(...series.map((p) => p.min_price));
  const hi = Math.max(...series.map((p) => p.max_price));
  const span = hi - lo || 1;

  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const x = (i: number) =>
    PAD_X + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => PAD_Y + innerH - ((v - lo) / span) * innerH;

  const centerPts = series.map((p, i) => `${x(i)},${y(p.center_price)}`).join(" ");
  // Band: one convex trapezoid per adjacent pair (top=max, bottom=min). Drawing
  // per-segment avoids the self-intersecting single-polygon that leaves gaps
  // when a segment's min/max swing crosses its neighbour's (nonzero fill-rule
  // cancels the overlap). Each trapezoid is convex, so it always fills.
  const bandSegments = series.slice(1).map((p, i) => {
    const a = series[i];
    const x0 = x(i), x1 = x(i + 1);
    return `${x0},${y(a.max_price)} ${x1},${y(p.max_price)} ` +
           `${x1},${y(p.min_price)} ${x0},${y(a.min_price)}`;
  });
  // Single-point fallback: a vertical band slab at the centre.
  const singleBand =
    series.length === 1
      ? `${x(0) - 8},${y(series[0].max_price)} ${x(0) + 8},${y(series[0].max_price)} ` +
        `${x(0) + 8},${y(series[0].min_price)} ${x(0) - 8},${y(series[0].min_price)}`
      : null;

  const active = hover != null ? series[hover] : null;
  // Flip tooltip below the point when the point sits in the upper half,
  // so it never escapes the panel's top edge (panels clip overflow).
  const below = active != null && y(active.center_price) < H / 2;

  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg
        width={W}
        height={H}
        style={{ display: "block", border: "1.5px solid #111112", background: "var(--bg-section)" }}
      >
        {/* min/max band — per-segment trapezoids (gap-free) */}
        {singleBand ? (
          <polygon points={singleBand} fill="var(--purple)" fillOpacity={0.14} stroke="none" />
        ) : (
          bandSegments.map((pts, i) => (
            <polygon key={i} points={pts} fill="var(--purple)" fillOpacity={0.14} stroke="none" />
          ))
        )}
        {/* center line */}
        <polyline
          points={centerPts}
          fill="none"
          stroke="var(--purple)"
          strokeWidth={2}
          strokeLinejoin="miter"
        />
        {/* points + hover hit areas */}
        {series.map((p, i) => (
          <g key={i}>
            <rect
              x={x(i) - innerW / (2 * series.length) - 2}
              y={0}
              width={innerW / series.length + 4}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
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

      {active && (
        <div
          className="mono"
          style={{
            position: "absolute",
            left: Math.min(Math.max(x(hover!) - 60, 0), W - 120),
            ...(below
              ? { top: H + 2, transform: "none" }
              : { top: -2, transform: "translateY(-100%)" }),
            width: 120,
            background: "#111112",
            color: "white",
            border: "1.5px solid #111112",
            boxShadow: "2px 2px 0 var(--purple)",
            padding: "4px 6px",
            fontSize: "0.58rem",
            lineHeight: 1.5,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 800, letterSpacing: "0.5px", color: "var(--purple-pale, #f9e1ed)" }}>
            {shortDate(active.scrape_date)}
          </div>
          <div style={{ fontWeight: 800 }}>{fmt(active.center_price)}</div>
        </div>
      )}
    </div>
  );
}
