"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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

// Bucketing: group raw spec values into labelled options
// Returns { label, values[] } where values are the raw strings that match
type Bucket = { label: string; values: string[] };

function bucketValues(key: string, rawValues: string[]): Bucket[] | null {
  const parse = (s: string) => parseFloat(s.replace(/[^\d.]/g, "")) || 0;

  if (key === "capacity") {
    // Group by TB/GB tiers
    const gb: string[] = [], sml: string[] = [], mid: string[] = [], big: string[] = [], huge: string[] = [];
    for (const v of rawValues) {
      const n = parse(v);
      const isTB = v.toUpperCase().includes("TB");
      const numGB = isTB ? n * 1000 : n;
      if (numGB <= 256) sml.push(v);
      else if (numGB <= 1000) gb.push(v);
      else if (numGB <= 4000) mid.push(v);
      else if (numGB <= 8000) big.push(v);
      else huge.push(v);
    }
    const out: Bucket[] = [];
    if (sml.length) out.push({ label: "≤256GB", values: sml });
    if (gb.length) out.push({ label: "512GB–1TB", values: gb });
    if (mid.length) out.push({ label: "2TB–4TB", values: mid });
    if (big.length) out.push({ label: "5TB–8TB", values: big });
    if (huge.length) out.push({ label: "10TB+", values: huge });
    return out.length > 1 ? out : null;
  }

  if (key === "speed") {
    // RAM speeds in MHz
    const ddr4slow: string[] = [], ddr4fast: string[] = [], ddr5base: string[] = [], ddr5fast: string[] = [];
    for (const v of rawValues) {
      const n = parse(v);
      if (n <= 2666) ddr4slow.push(v);
      else if (n <= 4000) ddr4fast.push(v);
      else if (n <= 5600) ddr5base.push(v);
      else ddr5fast.push(v);
    }
    const out: Bucket[] = [];
    if (ddr4slow.length) out.push({ label: "≤2666MHz", values: ddr4slow });
    if (ddr4fast.length) out.push({ label: "3000–4000MHz", values: ddr4fast });
    if (ddr5base.length) out.push({ label: "4800–5600MHz", values: ddr5base });
    if (ddr5fast.length) out.push({ label: "6000MHz+", values: ddr5fast });
    return out.length > 1 ? out : null;
  }

  if (key === "wattage") {
    const low: string[] = [], mid: string[] = [], high: string[] = [], ultra: string[] = [];
    for (const v of rawValues) {
      const n = parse(v);
      if (n <= 500) low.push(v);
      else if (n <= 750) mid.push(v);
      else if (n <= 1000) high.push(v);
      else ultra.push(v);
    }
    const out: Bucket[] = [];
    if (low.length) out.push({ label: "≤500W", values: low });
    if (mid.length) out.push({ label: "550–750W", values: mid });
    if (high.length) out.push({ label: "800–1000W", values: high });
    if (ultra.length) out.push({ label: "1050W+", values: ultra });
    return out.length > 1 ? out : null;
  }

  return null;
}

// Resolve a bucket label back to a raw value match for display
// Price range popover
function PriceRangeFilter({
  minPrice,
  maxPrice,
  onMin,
  onMax,
  onClear,
}: {
  minPrice: string;
  maxPrice: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = !!minPrice || !!maxPrice;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = isActive
    ? `${minPrice || "0"} – ${maxPrice || "∞"}`
    : "Price";

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "5px 10px",
          border: isActive ? "2px solid #7c3aed" : "2px solid #111112",
          background: isActive ? "#7c3aed" : "white",
          color: isActive ? "white" : "#111112",
          boxShadow: isActive ? "2px 2px 0 #7c3aed" : "2px 2px 0 #111112",
          transform: "skewX(-8deg)",
          fontFamily: monoFont,
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          cursor: "pointer",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>{label}</span>
        <span style={{ opacity: 0.6, fontSize: "8px" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: "white",
            border: "2px solid #111112",
            boxShadow: "4px 4px 0 #111112",
            zIndex: 100,
            padding: "12px 14px",
            minWidth: "200px",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <div className="section-label" style={{ marginBottom: "4px" }}>Min (PKR)</div>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={e => onMin(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1.5px solid #111112",
                background: "white",
                fontFamily: monoFont,
                fontSize: "11px",
                outline: "none",
                color: "var(--text)",
              }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <div className="section-label" style={{ marginBottom: "4px" }}>Max (PKR)</div>
            <input
              type="number"
              placeholder="Any"
              value={maxPrice}
              onChange={e => onMax(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1.5px solid #111112",
                background: "white",
                fontFamily: monoFont,
                fontSize: "11px",
                outline: "none",
                color: "var(--text)",
              }}
            />
          </div>
          {isActive && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              style={{
                width: "100%",
                padding: "5px 8px",
                background: "rgba(124,58,237,0.06)",
                border: "1.5px solid #7c3aed",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 700,
                color: "#7c3aed",
                cursor: "pointer",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Comic dropdown component
function ComicDropdown({
  label,
  active,
  options,
  onSelect,
  onClear,
}: {
  label: string;
  active: string;
  options: { value: string; label: string; separator?: boolean }[];
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = !!active && !active.startsWith("__sep__");
  const displayLabel = active
    ? options.find(o => !o.separator && o.value === active)?.label ?? active
    : label;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "5px 10px",
          border: isActive ? "2px solid #7c3aed" : "2px solid #111112",
          background: isActive ? "#7c3aed" : "white",
          color: isActive ? "white" : "#111112",
          boxShadow: isActive ? "2px 2px 0 #7c3aed" : "2px 2px 0 #111112",
          transform: "skewX(-8deg)",
          fontFamily: monoFont,
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          cursor: "pointer",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        <span>{displayLabel}</span>
        <span style={{ opacity: 0.6, fontSize: "8px" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: "white",
            border: "2px solid #111112",
            boxShadow: "4px 4px 0 #111112",
            zIndex: 100,
            minWidth: "140px",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          {isActive && (
            <button
              onClick={() => { onClear(); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                padding: "7px 12px",
                textAlign: "left",
                background: "rgba(124,58,237,0.06)",
                border: "none",
                borderBottom: "1px solid #111112",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 700,
                color: "#7c3aed",
                cursor: "pointer",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              ✕ Clear
            </button>
          )}
          {options.map(opt =>
            opt.separator ? (
              <div
                key={opt.value}
                style={{
                  padding: "4px 12px 2px",
                  fontFamily: monoFont,
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#7c3aed",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  background: "rgba(124,58,237,0.05)",
                  borderTop: "1px solid #e4e4e7",
                  borderBottom: "none",
                }}
              >
                {opt.label}
              </div>
            ) : (
              <button
                key={opt.value}
                onClick={() => { onSelect(opt.value); setOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "6px 12px 6px 18px",
                  textAlign: "left",
                  background: active === opt.value ? "#f0ebff" : "white",
                  border: "none",
                  borderBottom: "1px solid #e4e4e7",
                  fontFamily: monoFont,
                  fontSize: "10px",
                  fontWeight: active === opt.value ? 800 : 600,
                  color: active === opt.value ? "#7c3aed" : "#111112",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
              >
                {opt.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const category = params.get("category") ?? "";
  const source   = params.get("source")   ?? "";
  const sort     = params.get("sort")     ?? "price_asc";
  const minPrice = params.get("min_price") ?? "";
  const maxPrice = params.get("max_price") ?? "";
  const q        = params.get("q")        ?? "";

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setBarHidden(true);
      } else if (currentY < lastScrollY.current) {
        setBarHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        next.delete("min_price");
        next.delete("max_price");
      }
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("offset");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, router, pathname]
  );

  const specEntries = Object.entries(filterOptions).filter(
    ([, values]) => values && values.length > 0
  );
  // Build spec dropdown options — bucketed specs get group headers + representative values
  const specDropdowns = specEntries.map(([key, rawValues]) => {
    const vals = rawValues as string[];
    const buckets = bucketValues(key, vals);
    if (buckets) {
      // Flatten buckets: group header (disabled separator) + one representative per bucket
      // Representative = first value in each bucket (exact API match)
      const options: { value: string; label: string; separator?: boolean }[] = [];
      for (const b of buckets) {
        options.push({ value: `__sep__${b.label}`, label: b.label, separator: true });
        for (const v of b.values) {
          options.push({ value: v, label: v });
        }
      }
      return { key, label: SPEC_LABELS[key] ?? key, options };
    }
    return {
      key,
      label: SPEC_LABELS[key] ?? key,
      options: vals.map(v => ({ value: v, label: v })),
    };
  });

  // Category options
  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...CATEGORIES.map(c => ({ value: c, label: c.toUpperCase() })),
  ];

  // Source options
  const sourceOptions = [
    { value: "", label: "All Retailers" },
    ...SOURCES.map(s => ({ value: s.key, label: s.label })),
  ];

  // Sort options
  const sortOptions = [
    { value: "price_asc", label: "Price ↑" },
    { value: "price_desc", label: "Price ↓" },
  ];

  function clearPrice() {
    const next = new URLSearchParams(params.toString());
    next.delete("min_price");
    next.delete("max_price");
    next.delete("offset");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div
      className="sticky z-40"
      style={{
        top: "52px",
        background: "var(--bg)",
        borderBottom: "2px solid #111112",
        transform: barHidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.25s ease",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div
          className="filter-inner-scroll"
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
        <div className="flex items-center gap-2" style={{ minWidth: "max-content" }}>

          {/* Parts count */}
          <span
            className="mono hidden sm:block"
            style={{ color: "var(--text-dim)", fontSize: "0.65rem", whiteSpace: "nowrap", flexShrink: 0, marginRight: "4px" }}
          >
            {total.toLocaleString()} parts
          </span>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={q}
            onChange={e => push("q", e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: "1 1 140px",
              minWidth: "120px",
              maxWidth: "220px",
              padding: "6px 10px",
              border: searchFocused ? "2px solid #7c3aed" : "2px solid #111112",
              background: "white",
              outline: "none",
              boxShadow: searchFocused ? "2px 2px 0 #7c3aed" : "2px 2px 0 #111112",
              fontFamily: monoFont,
              fontSize: "11px",
              color: "var(--text)",
              transition: "border-color 0.1s, box-shadow 0.1s",
            }}
          />

          {/* Category */}
          <ComicDropdown
            label="Category"
            active={category}
            options={categoryOptions}
            onSelect={v => push("category", v)}
            onClear={() => push("category", "")}
          />

          {/* Spec dropdowns — only when category selected and options loaded */}
          {specDropdowns.map(({ key, label, options }) => (
            <ComicDropdown
              key={key}
              label={label}
              active={params.get(key) ?? ""}
              options={options}
              onSelect={v => push(key, v)}
              onClear={() => push(key, "")}
            />
          ))}

          {/* Price range */}
          <PriceRangeFilter
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMin={v => push("min_price", v)}
            onMax={v => push("max_price", v)}
            onClear={clearPrice}
          />

          {/* Retailer */}
          <ComicDropdown
            label="Retailer"
            active={source}
            options={sourceOptions.filter(o => o.value !== "")}
            onSelect={v => push("source", v)}
            onClear={() => push("source", "")}
          />

          {/* Sort — pushed to far right */}
          <div style={{ marginLeft: "auto" }}>
            <ComicDropdown
              label={sort === "price_asc" ? "Price ↑" : "Price ↓"}
              active={sort}
              options={sortOptions}
              onSelect={v => push("sort", v)}
              onClear={() => push("sort", "price_asc")}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
