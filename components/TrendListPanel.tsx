"use client";

import { useMemo } from "react";
import type { TrendGroup, TrendCategory, TrendGroupsResult } from "@/lib/trends-api";
import { TREND_WHITELIST } from "@/lib/constants";
import TrendRow from "@/components/TrendRow";

const TITLES: Record<TrendCategory, string> = {
  gpu: "Graphics Cards",
  cpu: "Processors",
  ram: "Memory",
};

export default function TrendListPanel({
  category,
  result,
}: {
  category: TrendCategory;
  result: TrendGroupsResult;
}) {
  const groups = result.ok ? result.data : [];

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
    <div className="trend-panel">
      {/* Black header bar */}
      <div className="trend-panel-bar flex items-center justify-between px-4">
        <span>{TITLES[category]}</span>
        <span className="trend-panel-count">{rows.length} TRACKED</span>
      </div>

      {/* Scrollable list */}
      <div className="trend-list">
        {!result.ok ? (
          <div className="mono px-4 py-8 text-center trend-panel-msg trend-panel-msg--error">
            {"// TRENDS TEMPORARILY UNAVAILABLE"}
          </div>
        ) : rows.length === 0 ? (
          <div className="mono px-4 py-8 text-center trend-panel-msg trend-panel-msg--empty">
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
