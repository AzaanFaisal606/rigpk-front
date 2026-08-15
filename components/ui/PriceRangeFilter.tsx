"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { monoFont } from "@/lib/tokens";

interface PriceRangeFilterProps {
  minPrice: string;
  maxPrice: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  onClear: () => void;
}

/**
 * Local-state + debounce for one price field.
 *
 * These inputs used to be controlled straight from the URL with no debounce, so
 * typing "150000" fired six full navigations and each character only appeared
 * once its own navigation resolved — fast typing dropped characters and jumped
 * the caret. The committed value is now local; the URL is written 400 ms after
 * typing stops.
 *
 * `committed` is deliberately absent from the debounce dependencies: it is
 * URL-derived, so including it would let each arriving response re-arm the
 * timer and re-fire a navigation the client already issued.
 */
function useDebouncedField(committed: string, commit: (v: string) => void) {
  const [value, setValue] = useState(committed);
  const lastCommitted = useRef(committed);
  const commitRef = useRef(commit);
  useEffect(() => { commitRef.current = commit; }, [commit]);

  useEffect(() => {
    if (committed === lastCommitted.current) return;
    lastCommitted.current = committed;
    setValue(committed);
  }, [committed]);

  useEffect(() => {
    if (value === lastCommitted.current) return;
    const t = setTimeout(() => {
      lastCommitted.current = value;
      commitRef.current(value);
    }, 400);
    return () => clearTimeout(t);
  }, [value]);

  return [value, setValue] as const;
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onMin,
  onMax,
  onClear,
}: PriceRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const isActive = !!minPrice || !!maxPrice;

  const [minValue, setMinValue] = useDebouncedField(minPrice, onMin);
  const [maxValue, setMaxValue] = useDebouncedField(maxPrice, onMax);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = isActive ? `${minPrice || "0"} – ${maxPrice || "∞"}` : "Price";

  function handleContainerKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  }

  return (
    <div ref={ref} onKeyDown={handleContainerKeyDown} style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="comic-btn"
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          padding: "5px 10px",
          border: isActive ? "2px solid var(--purple)" : "2px solid #111112",
          background: isActive ? "var(--purple)" : "white",
          color: isActive ? "white" : "#111112",
          boxShadow: isActive ? "2px 2px 0 var(--purple)" : "2px 2px 0 #111112",
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
              value={minValue}
              onChange={e => setMinValue(e.target.value)}
              className="comic-input"
              aria-label="Minimum price (PKR)"
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
              value={maxValue}
              onChange={e => setMaxValue(e.target.value)}
              className="comic-input"
              aria-label="Maximum price (PKR)"
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
              className="comic-btn"
              style={{
                width: "100%",
                padding: "5px 8px",
                background: "color-mix(in srgb, var(--purple) 6%, transparent)",
                border: "1.5px solid var(--purple)",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--purple)",
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
