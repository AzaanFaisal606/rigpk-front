"use client";

import { useState, useEffect, useRef } from "react";
import { monoFont } from "@/lib/tokens";

interface PriceRangeFilterProps {
  minPrice: string;
  maxPrice: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  onClear: () => void;
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
  const isActive = !!minPrice || !!maxPrice;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = isActive ? `${minPrice || "0"} – ${maxPrice || "∞"}` : "Price";

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
