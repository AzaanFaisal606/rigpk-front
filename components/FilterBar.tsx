"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FilterOptions } from "@/lib/api";
import { getFilterOptions } from "@/lib/api";
import { ComicDropdown } from "@/components/ui/ComicDropdown";
import type { DropdownOption } from "@/components/ui/ComicDropdown";
import { PriceRangeFilter } from "@/components/ui/PriceRangeFilter";
import { monoFont } from "@/lib/tokens";
import { CATEGORIES, SOURCES, SPEC_LABELS } from "@/lib/constants";
import { useScrollHide } from "@/lib/hooks/useScrollHide";

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

export default function FilterBar({ total, activeCategory }: { total: number; activeCategory?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const category = activeCategory ?? params.get("category") ?? "";
  const source   = params.get("source")   ?? "";
  const sort     = params.get("sort")     ?? "price_asc";
  const minPrice = params.get("min_price") ?? "";
  const maxPrice = params.get("max_price") ?? "";
  const q        = params.get("q")        ?? "";

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const barHidden = useScrollHide();

  useEffect(() => {
    if (!category) {
      setFilterOptions({});
      return;
    }
    getFilterOptions(category).then(setFilterOptions);
  }, [category]);

  // Sync searchInput when URL param changes externally (e.g. clear)
  useEffect(() => { setSearchInput(q); }, [q]);

  // Debounce search: wait 350ms after user stops typing before pushing to URL
  useEffect(() => {
    const t = setTimeout(() => { push("q", searchInput); }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const push = useCallback(
    (key: string, value: string) => {
      if (key === "category") {
        if (value) {
          router.push(`/market/${value}`);
        } else {
          router.push("/market");
        }
        return;
      }
      const next = new URLSearchParams(params.toString());
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
      const options: DropdownOption[] = [];
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
            overflowY: "visible",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            paddingBottom: "300px",
            marginBottom: "-300px",
            pointerEvents: "none",
          }}
        >
        <div className="flex items-center gap-2" style={{ minWidth: "max-content", pointerEvents: "auto" }}>

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
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
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
