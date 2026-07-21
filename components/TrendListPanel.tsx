"use client";

import { useMemo } from "react";
import type { TrendGroup, TrendCategory } from "@/lib/trends-api";
import { TREND_WHITELIST } from "@/lib/constants";
import TrendRow from "@/components/TrendRow";
import { monoFont } from "@/lib/tokens";

const TITLES: Record<TrendCategory, string> = {
  gpu: "Graphics Cards",
  cpu: "Processors",
  ram: "Memory",
};

export default function TrendListPanel({
  category,
  groups,
}: {
  category: TrendCategory;
  groups: TrendGroup[];
}) {
  // Filter to curated whitelist, keep whitelist order.
  const rows = useMemo(() => {
    const wl = TREND_WHITELIST[category];
    const order = new Map(wl.map((k, i) => [k, i]));
    const byKey = new Map(groups.map((g) => [g.group_key, g]));
    return wl
      .map((k) => byKey.get(k))
      .filter((g): g is TrendGroup => g != null)
      .sort((a, b) => order.get(a.group_key)! - order.get(b.group_key)!);
  }, [category, groups]);

  return (
    <div
      style={{
        border: "2px solid #111112",
        boxShadow: "8px 8px 0 #111112",
        background: "var(--bg-card)",
        overflow: "hidden",
      }}
    >
      {/* Black header bar */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          background: "#111112",
          color: "white",
          height: "40px",
          fontFamily: monoFont,
          fontSize: "0.7rem",
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
        }}
      >
        <span>{TITLES[category]}</span>
        <span style={{ opacity: 0.6, fontSize: "0.6rem" }}>{rows.length} TRACKED</span>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          maxHeight: "440px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {rows.length === 0 ? (
          <div
            className="mono px-4 py-8 text-center"
            style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 700 }}
          >
            No trend data available
          </div>
        ) : (
          rows.map((g) => (
            <TrendRow key={g.group_key} group={g} category={category} />
          ))
        )}
      </div>
    </div>
  );
}
