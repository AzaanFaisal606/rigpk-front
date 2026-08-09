"use client";

import { Cpu, MemoryStick, MonitorPlay } from "lucide-react";
import { useState } from "react";
import type { TrendGroup, TrendCategory } from "@/lib/trends-api";
import TrendSparkline from "@/components/TrendSparkline";

const CAT_ICON: Record<TrendCategory, React.ElementType> = {
  gpu: MonitorPlay,
  cpu: Cpu,
  ram: MemoryStick,
};

function fmt(p: number): string {
  return "Rs " + p.toLocaleString("en-PK");
}

// "DDR5-6000-32GB" -> "DDR5 6000 · 32GB" for nicer display
function displayName(key: string, category: TrendCategory): string {
  if (category !== "ram") return key;
  const [ddr, speed, cap] = key.split("-");
  return `${ddr} ${speed} · ${cap}`;
}

export default function TrendRow({
  group,
  category,
}: {
  group: TrendGroup;
  category: TrendCategory;
}) {
  const Icon = CAT_ICON[category];
  const [hovered, setHovered] = useState(false);

  // Sizing lives in CSS media queries (.trend-*) rather than an isMobile
  // hook — the row must render identically on the server, and every column
  // stays mounted at all widths now that the row scrolls horizontally.
  const bg = hovered ? "var(--purple-pale)" : "var(--bg-card)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: "1px solid #111112",
        borderLeft: hovered ? "4px solid var(--purple)" : "4px solid transparent",
        background: bg,
        transition: "background 0.1s, border-left-color 0.1s",
      }}
    >
      {/* Each row is its own scrollport, so rows scroll independently. */}
      <div className="trend-row-scroll">
        <div className="trend-row-track">
          {/* Thumbnail — pinned left so the row stays identifiable while
              the numbers and chart scroll past it. */}
          <div className="trend-row-pin" style={{ background: bg }}>
            <div className="trend-thumb flex items-center justify-center overflow-hidden">
              {group.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={group.thumbnail_url}
                  alt={group.group_key}
                  className="object-contain"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icon size={20} style={{ color: "var(--text-dim)" }} />
              )}
            </div>
          </div>

          {/* Name + listings */}
          <div className="trend-name">
            <p
              className="font-bold truncate"
              style={{
                color: hovered ? "var(--purple)" : "var(--text)",
                transition: "color 0.1s",
              }}
            >
              {displayName(group.group_key, category)}
            </p>
            <span
              className="mono inline-block mt-1 px-1.5 py-px"
              style={{
                fontSize: "0.55rem",
                fontWeight: 800,
                color: "var(--text-muted)",
                border: "1px solid color-mix(in srgb, #111112 30%, transparent)",
                whiteSpace: "nowrap",
              }}
            >
              {group.sample_count} LISTINGS
            </span>
          </div>

          {/* Center (average) */}
          <div className="trend-avg text-right">
            <div className="trend-col-label mono">AVG</div>
            <div
              className="mono trend-avg-value"
              style={{ fontWeight: 900, whiteSpace: "nowrap", color: "#111112" }}
            >
              {fmt(group.latest_price)}
            </div>
          </div>

          {/* Max–Min range */}
          <div className="trend-range text-right">
            <div className="trend-col-label mono">RANGE</div>
            <div className="mono trend-range-value">{fmt(group.min_price)}</div>
            <div className="mono trend-range-value">{fmt(group.max_price)}</div>
          </div>

          {/* Chart */}
          <div className="flex-shrink-0">
            <TrendSparkline series={group.series} />
          </div>
        </div>
      </div>
    </div>
  );
}
