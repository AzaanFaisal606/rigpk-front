"use client";

import { Cpu, MemoryStick, MonitorPlay } from "lucide-react";
import { useEffect, useState } from "react";
import type { TrendGroup, TrendCategory } from "@/lib/trends-api";
import TrendSparkline from "@/components/TrendSparkline";

const CAT_ICON: Record<TrendCategory, React.ElementType> = {
  gpu: MonitorPlay,
  cpu: Cpu,
  ram: MemoryStick,
};

function fmt(p: number): string {
  return "Rs " + p.toLocaleString("en-PK");
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center px-4 py-3"
      style={{
        gap: isMobile ? "10px" : "16px",
        borderBottom: "1px solid #111112",
        borderLeft: hovered ? "4px solid var(--purple)" : "4px solid transparent",
        background: hovered ? "var(--purple-pale)" : "var(--bg-card)",
        transition: "background 0.1s, border-left-color 0.1s",
      }}
    >
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{
          width: isMobile ? "40px" : "52px",
          height: isMobile ? "40px" : "52px",
          background: "var(--bg-section)",
          border: "1.5px solid #111112",
        }}
      >
        {group.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.thumbnail_url}
            alt={group.group_key}
            width={isMobile ? 40 : 52}
            height={isMobile ? 40 : 52}
            className="object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Icon size={isMobile ? 18 : 22} style={{ color: "var(--text-dim)" }} />
        )}
      </div>

      {/* Name + listings */}
      <div className="flex-1 min-w-0">
        <p
          className="font-bold truncate"
          style={{
            fontSize: isMobile ? "0.8rem" : "0.9rem",
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
      <div className="flex-shrink-0 text-right" style={{ width: isMobile ? "auto" : "110px" }}>
        <div
          className="mono"
          style={{ fontSize: "0.5rem", fontWeight: 800, color: "var(--text-dim)", letterSpacing: "1px" }}
        >
          AVG
        </div>
        <div
          className="mono"
          style={{
            fontSize: isMobile ? "0.82rem" : "0.95rem",
            fontWeight: 900,
            whiteSpace: "nowrap",
            color: "#111112",
          }}
        >
          {fmt(group.latest_price)}
        </div>
      </div>

      {/* Max–Min range */}
      {!isMobile && (
        <div className="flex-shrink-0 text-right" style={{ width: "120px" }}>
          <div
            className="mono"
            style={{ fontSize: "0.5rem", fontWeight: 800, color: "var(--text-dim)", letterSpacing: "1px" }}
          >
            RANGE
          </div>
          <div
            className="mono"
            style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}
          >
            {fmt(group.min_price)}
          </div>
          <div
            className="mono"
            style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}
          >
            {fmt(group.max_price)}
          </div>
        </div>
      )}

      {/* Chart */}
      {!isMobile && (
        <div className="flex-shrink-0">
          <TrendSparkline series={group.series} />
        </div>
      )}
    </div>
  );
}
