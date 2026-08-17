"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { FilterOptions } from "@/lib/api";
import { getFilterOptions } from "@/lib/api";
import { ComicDropdown } from "@/components/ui/ComicDropdown";
import type { DropdownOption } from "@/components/ui/ComicDropdown";
import { PriceRangeFilter } from "@/components/ui/PriceRangeFilter";
import { monoFont } from "@/lib/tokens";
import { CATEGORIES, DEFAULT_SORT, SOURCES, SPEC_KEYS, SPEC_LABELS } from "@/lib/constants";
import { useScrollHide } from "@/lib/hooks/useScrollHide";
import { publishSearch, subscribeIndexReady } from "@/lib/search-bus";

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

export default function FilterBar({
  total, activeCategory, clientIndexActive = false,
}: { total: number; activeCategory?: string; clientIndexActive?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const category = activeCategory ?? params.get("category") ?? "";
  const source   = params.get("source")   ?? "";
  const sort     = params.get("sort")     ?? DEFAULT_SORT;
  const minPrice = params.get("min_price") ?? "";
  const maxPrice = params.get("max_price") ?? "";
  const q        = params.get("q")        ?? "";

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  // isPending stays true for the whole RSC round trip, so the bar can show the
  // query is still resolving instead of silently holding stale results.
  const [isPending, startTransition] = useTransition();
  const barHidden = useScrollHide(80, searchFocused);

  // Mirrors MarketSearchResults' index-load state off the shared bus. Until
  // this is true, the client index either hasn't loaded or failed to load —
  // either way there's nothing listening on the other end of publishSearch,
  // so the debounce effect below must keep server-navigating regardless of
  // clientIndexActive.
  const [indexReady, setIndexReadyState] = useState(false);
  useEffect(() => subscribeIndexReady(setIndexReadyState), []);
  const clientPathActive = clientIndexActive && indexReady;

  const push = useCallback(
    (key: string, value: string) => {
      if (key === "category") {
        // Keep source/sort/price/search — only strip spec keys, which don't
        // necessarily mean the same thing (or exist at all) in the new
        // category's filter options (M28).
        const next = new URLSearchParams(params.toString());
        for (const k of SPEC_KEYS) next.delete(k);
        next.delete("offset");
        const qs = next.toString();
        startTransition(() => {
          router.push(value ? `/market/${value}${qs ? `?${qs}` : ""}` : `/market${qs ? `?${qs}` : ""}`);
        });
        return;
      }
      const next = new URLSearchParams(params.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("offset");
      startTransition(() => {
        // replace, not push: a filter tweak is a refinement of the current
        // view, not a place in history worth stepping back through.
        router.replace(`${pathname}?${next.toString()}`);
      });
    },
    [params, router, pathname]
  );

  useEffect(() => {
    // No setState call is synchronous in the effect body — the no-category
    // reset is deferred to a microtask so it can't trigger a cascading
    // render (react-hooks/set-state-in-effect); the fetched-options case was
    // already async via `.then`.
    if (!category) {
      queueMicrotask(() => setFilterOptions({}));
      return;
    }
    getFilterOptions(category).then(setFilterOptions);
  }, [category]);

  // Flag the document while a filter navigation is in flight. The results list
  // is a server component rendered as a sibling, so it can't receive isPending
  // as a prop; globals.css dims it off this attribute.
  useEffect(() => {
    const el = document.documentElement;
    if (isPending) el.dataset.filtering = "1";
    else delete el.dataset.filtering;
    return () => { delete el.dataset.filtering; };
  }, [isPending]);

  // Track last value we pushed to URL so we can distinguish "URL changed externally"
  // from "URL just caught up to our own push". Without this, external sync clobbers
  // in-flight typing after a debounced push completes.
  const lastPushedQ = useRef(q);

  // Sync searchInput when URL param changes EXTERNALLY (clear button, back nav, etc.)
  // Skip if URL just matches our own latest push.
  useEffect(() => {
    if (q === lastPushedQ.current) return;
    setSearchInput(q);
    lastPushedQ.current = q;
  }, [q]);

  // Keep latest push in ref so debounce effect doesn't refire when searchParams change
  const pushRef = useRef(push);
  useEffect(() => { pushRef.current = push; }, [push]);

  // Search is submit-gated: Enter, or the button beside the field. Nothing
  // fires while typing.
  //
  // This replaces a per-keystroke debounce. The debounce was two racing
  // timers — one owned by keystrokes, one implicitly re-armed by the URL `q`
  // it wrote — and on the client-index path the 60ms window made the race
  // tight enough to lose: a fast typist could land a publishSearch for a
  // prefix after the full query's, and the list would sit on the wrong
  // results until the next keystroke. Submitting explicitly means exactly
  // one publish per user intent, and `q` can never re-arm anything.
  const submitSearch = useCallback(
    (value: string) => {
      if (value === lastPushedQ.current) return;
      lastPushedQ.current = value;
      if (clientPathActive) {
        // Update the address bar without an RSC round trip so links stay
        // shareable, then hand the query to the in-browser index.
        const next = new URLSearchParams(params.toString());
        if (value) next.set("q", value);
        else next.delete("q");
        next.delete("offset");
        window.history.replaceState(null, "", `${pathname}?${next.toString()}`);
        publishSearch({ q: value });
      } else {
        pushRef.current("q", value);
      }
    },
    [clientPathActive, params, pathname]
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
      <div className="max-w-6xl mx-auto px-6 py-3 filter-bar-pad">
        <div
          className="filter-inner-scroll"
          style={{
            overflowX: "auto",
            overflowY: "visible",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
        {/* paddingRight leaves room for the last chip's skew overhang + its
            2px hard shadow, which the overflow:auto wrapper would otherwise
            clip at the right edge. */}
        <div className="flex items-center gap-2" style={{ minWidth: "max-content", paddingRight: "6px" }}>

          {/* Parts count */}
          <span
            className="mono hidden sm:block"
            style={{ color: "var(--text-dim)", fontSize: "0.65rem", whiteSpace: "nowrap", flexShrink: 0, marginRight: "4px" }}
          >
            {total.toLocaleString()} parts
          </span>

          {/* Search — submit-gated (Enter or the button); typing alone does
              nothing, so there is no keystroke race to lose. */}
          <form
            onSubmit={e => { e.preventDefault(); submitSearch(searchInput); }}
            style={{
              flex: "1 1 180px",
              minWidth: "150px",
              maxWidth: "260px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
              <input
                type="search"
                className="filter-search-input"
                placeholder="Search..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                style={{
                  width: "100%",
                  padding: "6px 26px 6px 10px",
                  border: searchFocused ? "2px solid var(--purple)" : "2px solid #111112",
                  background: "white",
                  outline: "none",
                  boxShadow: searchFocused ? "2px 2px 0 var(--purple)" : "2px 2px 0 #111112",
                  fontFamily: monoFont,
                  fontSize: "11px",
                  color: "var(--text)",
                  transition: "border-color 0.1s, box-shadow 0.1s",
                  // Safari draws its own clear affordance on type=search and
                  // it would sit on top of ours.
                  WebkitAppearance: "none",
                  appearance: "none",
                }}
              />
              {searchInput && !isPending && (
                <button
                  type="button"
                  aria-label="Clear search"
                  // Clearing is itself a submit — an empty field that still
                  // shows the previous query's results is the same "stuck"
                  // state the debounce used to produce.
                  onClick={() => { setSearchInput(""); submitSearch(""); }}
                  style={{
                    position: "absolute",
                    right: "8px",
                    background: "none",
                    border: "none",
                    padding: 0,
                    lineHeight: 1,
                    cursor: "pointer",
                    fontFamily: monoFont,
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "var(--text-muted)",
                  }}
                >
                  ✕
                </button>
              )}
              {isPending && (
                <span
                  aria-hidden
                  className="filter-pending-dot"
                  style={{ position: "absolute", right: "9px" }}
                />
              )}
            </div>
            <button
              type="submit"
              aria-label="Search"
              className="comic-btn"
              style={{
                flexShrink: 0,
                padding: "5px 12px",
                border: "2px solid #111112",
                background: "var(--purple)",
                color: "white",
                boxShadow: "2px 2px 0 #111112",
                transform: "skewX(-8deg)",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                cursor: "pointer",
                whiteSpace: "nowrap",
                lineHeight: 1.6,
              }}
            >
              <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>Go</span>
            </button>
          </form>

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
              label="Sort"
              // Always the resolved value, never "" — sort is never absent
              // (it falls back to DEFAULT_SORT), so the chip should always
              // read "Price ↑"/"Price ↓" accented rather than showing a
              // neutral "Sort" that misrepresents an ordering that IS applied.
              active={sort}
              options={sortOptions}
              onSelect={v => push("sort", v)}
              onClear={() => push("sort", DEFAULT_SORT)}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
