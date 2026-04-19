"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { FilterOptions } from "@/lib/api";

const CATEGORIES = [
  "gpu", "cpu", "ram", "ssd", "hdd",
  "psu", "case", "motherboard", "cooling", "monitor",
];

const SOURCES = [
  { key: "czone.com.pk",     label: "CZone" },
  { key: "zahcomputers.pk",  label: "Zah Computers" },
  { key: "amdhouse.pk",      label: "AMD House" },
  { key: "rbtechngames.com", label: "RB Tech" },
  { key: "junaidtech.pk",    label: "Junaid Tech" },
];

const SPEC_LABELS: Record<string, string> = {
  brand:       "Brand",
  socket:      "Socket",
  vram:        "VRAM",
  ddr_type:    "DDR Type",
  speed:       "Speed",
  chipset:     "Chipset",
  wattage:     "Wattage",
  rating:      "80+ Rating",
  form_factor: "Form Factor",
  type:        "Cooler Type",
  aio_size:    "AIO Size",
  fan_size:    "Fan Size",
  interface:   "Interface",
  capacity:    "Capacity",
};

const selectStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "0.78rem",
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  letterSpacing: "0.02em",
  cursor: "pointer",
  outline: "none",
  minWidth: "130px",
  appearance: "auto" as React.CSSProperties["appearance"],
};

export default function FilterBar({
  total,
  filterOptions,
}: {
  total: number;
  filterOptions?: FilterOptions;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("offset");
      router.push(`/market?${next.toString()}`);
    },
    [params, router]
  );

  const category = params.get("category") ?? "";
  const source   = params.get("source")   ?? "";
  const sort     = params.get("sort")     ?? "price_asc";
  const minPrice = params.get("min_price") ?? "";
  const maxPrice = params.get("max_price") ?? "";

  return (
    <div
      className="sticky top-[52px] z-40 border-b"
      style={{
        background: "rgba(244,244,245,0.92)",
        borderColor: "var(--border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
        {/* Part count */}
        <span className="mono mr-1" style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>
          {total.toLocaleString()} parts
        </span>

        {/* Category */}
        <select
          value={category}
          onChange={e => push("category", e.target.value)}
          style={selectStyle}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.toUpperCase()}</option>
          ))}
        </select>

        {/* Source */}
        <select
          value={source}
          onChange={e => push("source", e.target.value)}
          style={selectStyle}
        >
          <option value="">All Retailers</option>
          {SOURCES.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        {/* Dynamic spec filters — only shown when a category is selected */}
        {filterOptions &&
          Object.entries(filterOptions).map(([key, values]) =>
            values && values.length > 0 ? (
              <select
                key={key}
                value={params.get(key) ?? ""}
                onChange={e => push(key, e.target.value)}
                style={selectStyle}
              >
                <option value="">
                  All {SPEC_LABELS[key] ?? key.replace(/_/g, " ")}
                </option>
                {values.map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : null
          )}

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Min PKR"
            value={minPrice}
            onChange={e => push("min_price", e.target.value)}
            style={{ ...selectStyle, minWidth: "90px", width: "90px" }}
          />
          <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>—</span>
          <input
            type="number"
            placeholder="Max PKR"
            value={maxPrice}
            onChange={e => push("max_price", e.target.value)}
            style={{ ...selectStyle, minWidth: "90px", width: "90px" }}
          />
        </div>

        {/* Sort — pushed to right */}
        <select
          value={sort}
          onChange={e => push("sort", e.target.value)}
          style={{ ...selectStyle, marginLeft: "auto" }}
        >
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>
    </div>
  );
}
