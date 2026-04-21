"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FilterOptions } from "@/lib/api";
import { getFilterOptions } from "@/lib/api";

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

const SPEC_KEYS = [
  "brand","socket","vram","ddr_type","speed","chipset",
  "wattage","rating","form_factor","type","aio_size",
  "fan_size","interface","capacity",
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

const sel: React.CSSProperties = {
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

const priceInput: React.CSSProperties = {
  ...sel,
  minWidth: "100px",
  width: "100px",
};

export default function FilterBar({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();

  const category = params.get("category") ?? "";
  const source   = params.get("source")   ?? "";
  const sort     = params.get("sort")     ?? "price_asc";
  const minPrice = params.get("min_price") ?? "";
  const maxPrice = params.get("max_price") ?? "";

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});

  useEffect(() => {
    if (!category) {
      setFilterOptions({});
      return;
    }
    getFilterOptions(category).then(setFilterOptions);
  }, [category]);

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (key === "category") {
        SPEC_KEYS.forEach(k => next.delete(k));
      }
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

  const specEntries = Object.entries(filterOptions).filter(
    ([, values]) => values && values.length > 0
  );
  const hasSpecs = specEntries.length > 0;

  const priceRange = (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        placeholder="Min"
        value={minPrice}
        onChange={e => push("min_price", e.target.value)}
        style={priceInput}
      />
      <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>–</span>
      <input
        type="number"
        placeholder="Max"
        value={maxPrice}
        onChange={e => push("max_price", e.target.value)}
        style={priceInput}
      />
      <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>PKR</span>
    </div>
  );

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
      <div className="max-w-6xl mx-auto px-6 py-3 space-y-2">
        {/* Row 1: count · category · source · [price when no specs] · sort */}
        <div className="flex items-center gap-3">
          <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
            {total.toLocaleString()} parts
          </span>

          <select value={category} onChange={e => push("category", e.target.value)} style={sel}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>

          <select value={source} onChange={e => push("source", e.target.value)} style={sel}>
            <option value="">All Retailers</option>
            {SOURCES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {!hasSpecs && priceRange}

          <select
            value={sort}
            onChange={e => push("sort", e.target.value)}
            style={{ ...sel, marginLeft: "auto" }}
          >
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>

        {/* Row 2: spec dropdowns + price range (only when category has specs) */}
        {hasSpecs && (
          <div className="flex flex-wrap items-center gap-2">
            {specEntries.map(([key, values]) => (
              <select
                key={key}
                value={params.get(key) ?? ""}
                onChange={e => push(key, e.target.value)}
                style={{ ...sel, minWidth: "120px" }}
              >
                <option value="">{SPEC_LABELS[key] ?? key.replace(/_/g, " ")}</option>
                {(values as string[]).map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ))}
            {priceRange}
          </div>
        )}
      </div>
    </div>
  );
}
