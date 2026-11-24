"use client";

import { Cpu, MemoryStick, MonitorPlay } from "lucide-react";
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

  // Sizing and hover live in CSS (.trend-*) rather than an isMobile hook or
  // hover state — the row must render identically on the server, and every
  // column stays mounted at all widths now that the row scrolls horizontally.
  return (
    <div className="trend-row">
      {/* Each row is its own scrollport, so rows scroll independently. */}
      <div className="trend-row-scroll">
        <div className="trend-row-track">
          {/* Thumbnail — pinned left so the row stays identifiable while
              the numbers and chart scroll past it. */}
          <div className="trend-row-pin">
            <div className="trend-thumb flex items-center justify-center overflow-hidden">
              {group.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={group.thumbnail_url}
                  alt={group.group_key}
                  className="object-contain trend-thumb-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Icon size={20} className="trend-thumb-icon" />
              )}
            </div>
          </div>

          {/* Name + listings */}
          <div className="trend-name">
            <p className="font-bold truncate trend-row-name">
              {displayName(group.group_key, category)}
            </p>
            <span className="mono trend-listings inline-block mt-1 px-1.5 py-px">
              {group.sample_count} LISTINGS
            </span>
          </div>

          {/* Real median. The chart line is an index and drifts from it. */}
          <div className="trend-avg text-right">
            <div className="trend-col-label mono">{group.median_price != null ? "MEDIAN" : "INDEX"}</div>
            <div className="mono trend-avg-value">
              {fmt(group.median_price ?? group.latest_price)}
            </div>
          </div>

          {/* Cheapest and priciest listing on the latest date */}
          <div className="trend-range text-right">
            <div className="trend-col-label mono">RANGE</div>
            <div className="mono trend-range-value">{fmt(group.low_price ?? group.min_price)}</div>
            <div className="mono trend-range-value">{fmt(group.high_price ?? group.max_price)}</div>
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
