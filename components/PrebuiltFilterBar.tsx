"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ComicDropdown } from "@/components/ui/ComicDropdown";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { useScrollHide, SCROLL_HIDE_TRANSITION } from "@/lib/hooks/useScrollHide";
import { DEFAULT_SORT } from "@/lib/constants";

const SOURCES = ["zestrogaming.com", "redtech.pk", "techmatched.pk"];
const CPU_BRANDS  = ["ALL", "AMD", "INTEL"] as const;
const GPU_BRANDS  = ["ALL", "AMD", "NVIDIA", "INTEL"] as const;
const SORT_OPTIONS = [
  { value: "price_asc",  label: "PRICE ↑" },
  { value: "price_desc", label: "PRICE ↓" },
];

interface Props {
  /** Rendered hanging off the bar's bottom edge, under the search input —
   *  outside the horizontal scroll wrapper so it isn't clipped. */
  pulldown?: ReactNode;
}

export default function PrebuiltFilterBar({ pulldown }: Props = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchFocused, setSearchFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hidden = useScrollHide(80, searchFocused);

  const push = useCallback((updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("offset");
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === "") p.delete(k);
      else p.set(k, v);
    }
    startTransition(() => {
      router.replace(`${pathname}?${p.toString()}`);
    });
  }, [searchParams, router, pathname]);

  const source    = searchParams.get("source")    ?? undefined;
  const cpuBrand  = searchParams.get("cpu_brand") ?? undefined;
  const gpuBrand  = searchParams.get("gpu_brand") ?? undefined;
  const sort      = searchParams.get("sort")      ?? DEFAULT_SORT;
  const q         = searchParams.get("q")         ?? "";
  const minPrice  = searchParams.get("min_price") ?? "";
  const maxPrice  = searchParams.get("max_price") ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const lastPushedQ = useRef(q);

  useEffect(() => {
    if (q === lastPushedQ.current) return;
    setSearchInput(q);
    lastPushedQ.current = q;
  }, [q]);

  const pushRef = useRef(push);
  useEffect(() => { pushRef.current = push; }, [push]);

  // See FilterBar.tsx — dims the results list while a navigation is in flight.
  useEffect(() => {
    const el = document.documentElement;
    if (isPending) el.dataset.filtering = "1";
    else delete el.dataset.filtering;
    return () => { delete el.dataset.filtering; };
  }, [isPending]);

  // `q` is intentionally not a dependency — see the same comment in
  // FilterBar.tsx. Including it let every arriving response re-arm the timer
  // and re-fire a navigation, making results flip between queries.
  useEffect(() => {
    if (searchInput === lastPushedQ.current) return;
    const t = setTimeout(() => {
      lastPushedQ.current = searchInput;
      pushRef.current({ q: searchInput || undefined });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div
      className={hidden ? "pb-filterbar pb-filterbar--hidden" : "pb-filterbar"}
      style={{ transition: SCROLL_HIDE_TRANSITION }}
    >
      <div className="pb-filter-scroll">
      <div className="pb-filter-row">
        {/* Search */}
        <div className="pb-filter-search-wrap">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search pre-builts"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            className={searchInput ? "pb-filter-search pb-filter-search--filled" : "pb-filter-search"}
          />
          {isPending && (
            <span aria-hidden className="filter-pending-dot pb-filter-pending" />
          )}
        </div>

        <div className="pb-filter-sep" />

        {/* Retailer */}
        <ComicDropdown
          label="Retailer"
          active={source ?? ""}
          options={SOURCES.map(s => ({ value: s, label: s }))}
          onSelect={v => push({ source: v })}
          onClear={() => push({ source: undefined })}
        />

        <div className="pb-filter-sep" />

        {/* CPU brand */}
        <span className="pb-filter-label">CPU</span>
        <div className="pb-filter-chips">
          {CPU_BRANDS.map(b => (
            <ToggleChip
              key={b}
              label={b}
              active={b === "ALL" ? !cpuBrand : cpuBrand === b.toLowerCase()}
              onClick={() => push({ cpu_brand: b === "ALL" ? undefined : b.toLowerCase() })}
            />
          ))}
        </div>

        <div className="pb-filter-sep" />

        {/* GPU brand */}
        <span className="pb-filter-label">GPU</span>
        <div className="pb-filter-chips">
          {GPU_BRANDS.map(b => (
            <ToggleChip
              key={b}
              label={b}
              active={b === "ALL" ? !gpuBrand : gpuBrand === b.toLowerCase()}
              onClick={() => push({ gpu_brand: b === "ALL" ? undefined : b.toLowerCase() })}
            />
          ))}
        </div>

        <div className="pb-filter-sep" />

        {/* Price range */}
        <span className="pb-filter-label">PRICE</span>
        <input
          value={minPrice}
          onChange={e => push({ min_price: e.target.value || undefined })}
          placeholder="MIN"
          type="number"
          className="pb-filter-price"
        />
        <span className="pb-filter-dash">—</span>
        <input
          value={maxPrice}
          onChange={e => push({ max_price: e.target.value || undefined })}
          placeholder="MAX"
          type="number"
          className="pb-filter-price"
        />

        <div className="pb-filter-sep" />

        {/* Sort */}
        <ComicDropdown
          label="Sort"
          active={sort === DEFAULT_SORT ? "" : sort}
          options={SORT_OPTIONS}
          onSelect={v => push({ sort: v })}
          onClear={() => push({ sort: DEFAULT_SORT })}
        />
      </div>
      </div>
      {pulldown}
    </div>
  );
}
