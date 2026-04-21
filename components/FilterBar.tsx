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
  ddr_type:    "DDR",
  speed:       "Speed",
  chipset:     "Chipset",
  wattage:     "Wattage",
  rating:      "80+",
  form_factor: "Form",
  type:        "Type",
  aio_size:    "AIO",
  fan_size:    "Fan",
  interface:   "Interface",
  capacity:    "Capacity",
};

const monoFont = '"JetBrains Mono", "Fira Code", monospace';

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        border: active ? "1.5px solid #7c3aed" : "1.5px solid var(--border)",
        background: active ? "#f0ebff" : "white",
        boxShadow: active ? "2px 2px 0 #7c3aed" : "none",
        transform: "skewX(-8deg)",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.5px",
        color: active ? "#7c3aed" : "var(--text-muted)",
        cursor: "pointer",
        fontFamily: monoFont,
        whiteSpace: "nowrap" as const,
        textTransform: "uppercase" as const,
        flexShrink: 0,
        transition: "background 0.1s, border-color 0.1s, box-shadow 0.1s",
      }}
    >
      {children}
    </button>
  );
}

export default function FilterBar({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();

  const category = params.get("category") ?? "";
  const source   = params.get("source")   ?? "";
  const sort     = params.get("sort")     ?? "price_asc";
  const minPrice = params.get("min_price") ?? "";
  const maxPrice = params.get("max_price") ?? "";
  const q        = params.get("q")        ?? "";

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [searchFocused, setSearchFocused] = useState(false);

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

  const styledSelect: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1.5px solid var(--border)",
    color: "var(--text)",
    padding: "5px 8px",
    fontSize: "0.72rem",
    fontFamily: monoFont,
    letterSpacing: "0.02em",
    cursor: "pointer",
    outline: "none",
    appearance: "auto" as React.CSSProperties["appearance"],
  };

  return (
    <div
      className="sticky z-40"
      style={{
        top: "52px",
        background: "var(--bg)",
        borderBottom: "2px solid #111112",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 space-y-2.5">

        {/* Row 1: count · search · source · sort */}
        <div className="flex items-center gap-3">
          <span
            className="mono hidden sm:block"
            style={{ color: "var(--text-dim)", fontSize: "0.68rem", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {total.toLocaleString()} parts
          </span>

          <input
            type="text"
            placeholder="Search parts..."
            value={q}
            onChange={e => push("q", e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1,
              padding: "7px 12px",
              border: searchFocused ? "2px solid #7c3aed" : "2px solid #111112",
              background: "white",
              outline: "none",
              boxShadow: searchFocused ? "2px 2px 0 #7c3aed" : "2px 2px 0 #111112",
              fontFamily: monoFont,
              fontSize: "12px",
              color: "var(--text)",
              transition: "border-color 0.1s, box-shadow 0.1s",
            }}
          />

          <select
            value={source}
            onChange={e => push("source", e.target.value)}
            style={{ ...styledSelect, flexShrink: 0 }}
          >
            <option value="">All Retailers</option>
            {SOURCES.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={e => push("sort", e.target.value)}
            style={{ ...styledSelect, flexShrink: 0 }}
          >
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>

        {/* Row 2: category chips */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", paddingBottom: "2px" }}
        >
          <Chip active={category === ""} onClick={() => push("category", "")}>
            All
          </Chip>
          {CATEGORIES.map(c => (
            <Chip
              key={c}
              active={category === c}
              onClick={() => push("category", category === c ? "" : c)}
            >
              {c}
            </Chip>
          ))}
        </div>

        {/* Row 3: spec chips + price range (when category selected and options loaded) */}
        {hasSpecs && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {specEntries.map(([key, values]) => (
              <div key={key} className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="mono"
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {SPEC_LABELS[key] ?? key}:
                </span>
                {(values as string[]).map((v: string) => {
                  const active = params.get(key) === v;
                  return (
                    <Chip
                      key={v}
                      active={active}
                      onClick={() => push(key, active ? "" : v)}
                    >
                      {v}
                    </Chip>
                  );
                })}
              </div>
            ))}

            {/* Price range */}
            <div className="flex items-center gap-1.5 ml-auto">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={e => push("min_price", e.target.value)}
                style={{
                  width: "90px",
                  padding: "5px 8px",
                  border: "1.5px solid #111112",
                  background: "white",
                  fontFamily: monoFont,
                  fontSize: "11px",
                  outline: "none",
                  color: "var(--text)",
                }}
              />
              <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={e => push("max_price", e.target.value)}
                style={{
                  width: "90px",
                  padding: "5px 8px",
                  border: "1.5px solid #111112",
                  background: "white",
                  fontFamily: monoFont,
                  fontSize: "11px",
                  outline: "none",
                  color: "var(--text)",
                }}
              />
              <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>PKR</span>
            </div>
          </div>
        )}

        {/* Price range for no-spec categories */}
        {!hasSpecs && category && (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={e => push("min_price", e.target.value)}
              style={{
                width: "100px",
                padding: "5px 8px",
                border: "1.5px solid #111112",
                background: "white",
                fontFamily: monoFont,
                fontSize: "11px",
                outline: "none",
                color: "var(--text)",
              }}
            />
            <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>–</span>
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={e => push("max_price", e.target.value)}
              style={{
                width: "100px",
                padding: "5px 8px",
                border: "1.5px solid #111112",
                background: "white",
                fontFamily: monoFont,
                fontSize: "11px",
                outline: "none",
                color: "var(--text)",
              }}
            />
            <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>PKR</span>
          </div>
        )}
      </div>
    </div>
  );
}
