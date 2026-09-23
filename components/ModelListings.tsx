"use client";

import { useState, type CSSProperties } from "react";
import PartRow from "@/components/PartRow";
import type { Part } from "@/lib/api";
import { filterByPrice } from "@/lib/models";
import { monoFont } from "@/lib/tokens";

interface Props {
  /** partsForModel output: priced, cheapest first. */
  parts: Part[];
  /** "RTX 4060", for the list header. */
  label: string;
  /** "RTX 40 Series", pointed at when nothing is in stock. */
  seriesLabel: string;
}

const inputStyle: CSSProperties = {
  width: "130px",
  padding: "6px 8px",
  border: "1.5px solid var(--ink)",
  background: "var(--paper)",
  fontFamily: monoFont,
  fontSize: "11px",
  outline: "none",
  color: "var(--text)",
};

const emptyTitleStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: "0.9rem",
  fontWeight: 900,
  color: "var(--text-dim)",
  letterSpacing: "3px",
  textTransform: "uppercase",
};

/**
 * The model's listings with a local min/max price filter. Plain state, no URL:
 * the page is static, and a query string would only duplicate it.
 */
export default function ModelListings({ parts, label, seriesLabel }: Props) {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const shown = filterByPrice(parts, min, max);
  const active = min !== "" || max !== "";

  return (
    <>
      {parts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "12px", marginBottom: "20px" }}>
          <label>
            <span className="section-label" style={{ display: "block", marginBottom: "4px" }}>Min price</span>
            <input
              value={min}
              onChange={e => setMin(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              className="comic-input"
              style={inputStyle}
            />
          </label>
          <label>
            <span className="section-label" style={{ display: "block", marginBottom: "4px" }}>Max price</span>
            <input
              value={max}
              onChange={e => setMax(e.target.value)}
              inputMode="numeric"
              placeholder="Any"
              className="comic-input"
              style={inputStyle}
            />
          </label>
          {active && (
            <button
              type="button"
              onClick={() => { setMin(""); setMax(""); }}
              className="filter-chip"
              style={{
                padding: "5px 12px",
                border: "2px solid var(--ink)",
                boxShadow: "2px 2px 0 var(--shadow)",
                background: "var(--paper)",
                color: "var(--text)",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                transform: "skewX(-8deg)",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>✕ Clear</span>
            </button>
          )}
        </div>
      )}

      {/* Same list card as the market pages. */}
      <div style={{ border: "2px solid var(--ink)", boxShadow: "10px 10px 0 var(--shadow)", overflow: "hidden" }}>
        <div
          style={{
            background: "var(--bar)",
            color: "white",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span style={{ fontFamily: monoFont, fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>
            {label} — Listings
          </span>
          <span aria-live="polite" style={{ fontFamily: monoFont, fontSize: "10px", color: "rgba(255,255,255,0.45)", fontWeight: 600, whiteSpace: "nowrap" }}>
            {shown.length} LISTING{shown.length === 1 ? "" : "S"}
          </span>
        </div>

        {parts.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", background: "var(--bg-card)", borderTop: "1px solid var(--ink)" }}>
            <p style={emptyTitleStyle}>{"// OUT OF STOCK"}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
              None of the stores we track list it right now. Try the other {seriesLabel} models above.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", background: "var(--bg-card)", borderTop: "1px solid var(--ink)" }}>
            <p style={emptyTitleStyle}>{"// NO LISTINGS IN THIS RANGE"}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
              Try widening the price range
            </p>
          </div>
        ) : (
          shown.map(part => <PartRow key={part.id} part={part} />)
        )}
      </div>
    </>
  );
}
