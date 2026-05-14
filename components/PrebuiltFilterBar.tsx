"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ComicDropdown } from "@/components/ui/ComicDropdown";
import { ToggleChip } from "@/components/ui/ToggleChip";
import { monoFont } from "@/lib/tokens";
import { useScrollHide } from "@/lib/hooks/useScrollHide";

const SOURCES = ["zestrogaming.com", "redtech.pk", "techmatched.pk"];
const CPU_BRANDS  = ["ALL", "AMD", "INTEL"] as const;
const GPU_BRANDS  = ["ALL", "AMD", "NVIDIA", "INTEL"] as const;
const SORT_OPTIONS = [
  { value: "price_asc",  label: "PRICE ↑" },
  { value: "price_desc", label: "PRICE ↓" },
];

export default function PrebuiltFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hidden = useScrollHide();

  const push = useCallback((updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("offset");
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === "") p.delete(k);
      else p.set(k, v);
    }
    router.push(`${pathname}?${p.toString()}`);
  }, [searchParams, router, pathname]);

  const source    = searchParams.get("source")    ?? undefined;
  const cpuBrand  = searchParams.get("cpu_brand") ?? undefined;
  const gpuBrand  = searchParams.get("gpu_brand") ?? undefined;
  const sort      = searchParams.get("sort")      ?? "price_asc";
  const q         = searchParams.get("q")         ?? "";
  const minPrice  = searchParams.get("min_price") ?? "";
  const maxPrice  = searchParams.get("max_price") ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const didMount = useRef(false);

  useEffect(() => { setSearchInput(q); }, [q]);

  const pushRef = useRef(push);
  useEffect(() => { pushRef.current = push; }, [push]);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    if (searchInput === q) return;
    const t = setTimeout(() => { pushRef.current({ q: searchInput || undefined }); }, 350);
    return () => clearTimeout(t);
  }, [searchInput, q]);

  return (
    <div
      style={{
        position: "sticky",
        top: "52px",
        zIndex: 40,
        background: "var(--bg)",
        borderBottom: "2px solid #111112",
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.25s ease",
      }}
    >
      <div style={{
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minWidth: "max-content",
        }}
      >
        {/* Search */}
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="SEARCH PREBUILTS"
          style={{
            padding: "5px 10px",
            border: searchInput ? "2px solid var(--purple)" : "2px solid #111112",
            boxShadow: searchInput ? "2px 2px 0 var(--purple)" : "2px 2px 0 #111112",
            fontFamily: monoFont,
            fontSize: "11px",
            fontWeight: 700,
            background: "white",
            color: "#111112",
            outline: "none",
            width: "180px",
          }}
        />

        <div style={{ width: "1px", height: "20px", background: "#111112", flexShrink: 0 }} />

        {/* Retailer */}
        <ComicDropdown
          label="RETAILER"
          active={source ?? ""}
          options={SOURCES.map(s => ({ value: s, label: s }))}
          onSelect={v => push({ source: v })}
          onClear={() => push({ source: undefined })}
        />

        <div style={{ width: "1px", height: "20px", background: "#111112", flexShrink: 0 }} />

        {/* CPU brand */}
        <span style={{ fontFamily: monoFont, fontSize: "9px", fontWeight: 800, color: "#71717a", letterSpacing: "1px" }}>CPU</span>
        <div style={{ display: "flex", gap: "4px" }}>
          {CPU_BRANDS.map(b => (
            <ToggleChip
              key={b}
              label={b}
              active={b === "ALL" ? !cpuBrand : cpuBrand === b.toLowerCase()}
              onClick={() => push({ cpu_brand: b === "ALL" ? undefined : b.toLowerCase() })}
            />
          ))}
        </div>

        <div style={{ width: "1px", height: "20px", background: "#111112", flexShrink: 0 }} />

        {/* GPU brand */}
        <span style={{ fontFamily: monoFont, fontSize: "9px", fontWeight: 800, color: "#71717a", letterSpacing: "1px" }}>GPU</span>
        <div style={{ display: "flex", gap: "4px" }}>
          {GPU_BRANDS.map(b => (
            <ToggleChip
              key={b}
              label={b}
              active={b === "ALL" ? !gpuBrand : gpuBrand === b.toLowerCase()}
              onClick={() => push({ gpu_brand: b === "ALL" ? undefined : b.toLowerCase() })}
            />
          ))}
        </div>

        <div style={{ width: "1px", height: "20px", background: "#111112", flexShrink: 0 }} />

        {/* Price range */}
        <span style={{ fontFamily: monoFont, fontSize: "9px", fontWeight: 800, color: "#71717a", letterSpacing: "1px" }}>PRICE</span>
        <input
          value={minPrice}
          onChange={e => push({ min_price: e.target.value || undefined })}
          placeholder="MIN"
          type="number"
          style={{
            width: "70px", padding: "5px 8px",
            border: "2px solid #111112", boxShadow: "2px 2px 0 #111112",
            fontFamily: monoFont, fontSize: "10px", fontWeight: 700,
            background: "white", color: "#111112", outline: "none",
          }}
        />
        <span style={{ fontFamily: monoFont, fontSize: "10px", color: "#71717a" }}>—</span>
        <input
          value={maxPrice}
          onChange={e => push({ max_price: e.target.value || undefined })}
          placeholder="MAX"
          type="number"
          style={{
            width: "70px", padding: "5px 8px",
            border: "2px solid #111112", boxShadow: "2px 2px 0 #111112",
            fontFamily: monoFont, fontSize: "10px", fontWeight: 700,
            background: "white", color: "#111112", outline: "none",
          }}
        />

        <div style={{ width: "1px", height: "20px", background: "#111112", flexShrink: 0 }} />

        {/* Sort */}
        <ComicDropdown
          label="SORT"
          active={sort}
          options={SORT_OPTIONS}
          onSelect={v => push({ sort: v })}
          onClear={() => push({ sort: "price_asc" })}
        />
      </div>
      </div>
    </div>
  );
}
