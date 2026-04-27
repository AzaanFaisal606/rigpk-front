"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const monoFont = '"JetBrains Mono", "Fira Code", monospace';

const SOURCES = ["zestrogaming.com", "redtech.pk", "techmatched.pk"];
const CPU_BRANDS  = ["ALL", "AMD", "INTEL"] as const;
const GPU_BRANDS  = ["ALL", "AMD", "NVIDIA", "INTEL"] as const;
const SORT_OPTIONS = [
  { value: "price_asc",  label: "PRICE ↑" },
  { value: "price_desc", label: "PRICE ↓" },
];

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "5px 12px",
        border: active ? "2px solid #7c3aed" : "2px solid #111112",
        boxShadow: active ? "2px 2px 0 #7c3aed" : "2px 2px 0 #111112",
        background: active ? "#7c3aed" : hov ? "rgba(124,58,237,0.06)" : "white",
        color: active ? "white" : "#111112",
        fontFamily: monoFont,
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        transform: "skewX(-8deg)",
        cursor: "pointer",
        transition: "background 0.1s",
      }}
    >
      <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>{label}</span>
    </button>
  );
}

function ComicDropdown({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  onSelect: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = value ?? label;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "5px 12px",
          border: value ? "2px solid #7c3aed" : "2px solid #111112",
          boxShadow: value ? "2px 2px 0 #7c3aed" : "2px 2px 0 #111112",
          background: value ? "#7c3aed" : "white",
          color: value ? "white" : "#111112",
          fontFamily: monoFont,
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          transform: "skewX(-8deg)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>
          {display} ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 100,
            background: "white",
            border: "2px solid #111112",
            boxShadow: "4px 4px 0 #111112",
            minWidth: "160px",
          }}
        >
          {value && (
            <button
              onClick={() => { onSelect(undefined); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 800,
                color: "#7c3aed",
                background: "rgba(124,58,237,0.06)",
                cursor: "pointer",
                border: "none",
                borderBottom: "1px solid #111112",
              }}
            >
              CLEAR
            </button>
          )}
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                borderBottom: "1px solid #e4e4e7",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: opt === value ? 800 : 600,
                color: opt === value ? "#7c3aed" : "#111112",
                background: opt === value ? "#f0ebff" : "white",
                cursor: "pointer",
                border: "none",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PrebuiltFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible]   = useState(true);
  const lastScroll               = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y < 60) { setVisible(true); lastScroll.current = y; return; }
      setVisible(y < lastScroll.current);
      lastScroll.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function push(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("offset");
    for (const [k, v] of Object.entries(updates)) {
      if (v == null || v === "") p.delete(k);
      else p.set(k, v);
    }
    router.push(`${pathname}?${p.toString()}`);
  }

  const source    = searchParams.get("source")    ?? undefined;
  const cpuBrand  = searchParams.get("cpu_brand") ?? undefined;
  const gpuBrand  = searchParams.get("gpu_brand") ?? undefined;
  const sort      = searchParams.get("sort")      ?? "price_asc";
  const q         = searchParams.get("q")         ?? "";
  const minPrice  = searchParams.get("min_price") ?? "";
  const maxPrice  = searchParams.get("max_price") ?? "";

  return (
    <div
      style={{
        position: "sticky",
        top: "52px",
        zIndex: 40,
        background: "var(--bg)",
        borderBottom: "2px solid #111112",
        transform: visible ? "translateY(0)" : "translateY(-110%)",
        transition: "transform 0.2s ease",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          minWidth: "max-content",
        }}
      >
        {/* Search */}
        <input
          value={q}
          onChange={e => push({ q: e.target.value || undefined })}
          placeholder="SEARCH PREBUILTS"
          style={{
            padding: "5px 10px",
            border: q ? "2px solid #7c3aed" : "2px solid #111112",
            boxShadow: q ? "2px 2px 0 #7c3aed" : "2px 2px 0 #111112",
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
          value={source}
          options={SOURCES}
          onSelect={v => push({ source: v })}
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
        {SORT_OPTIONS.map(opt => (
          <ToggleChip
            key={opt.value}
            label={opt.label}
            active={sort === opt.value}
            onClick={() => push({ sort: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}
