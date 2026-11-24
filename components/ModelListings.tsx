"use client";

import { useState } from "react";
import PartRow from "@/components/PartRow";
import type { Part } from "@/lib/api";
import { filterByPrice } from "@/lib/models";

interface Props {
  /** partsForModel output: priced, cheapest first. */
  parts: Part[];
  /** "RTX 4060", for the list header. */
  label: string;
  /** "RTX 40 Series", pointed at when nothing is in stock. */
  seriesLabel: string;
}

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
        <div className="model-filter">
          <label>
            <span className="section-label model-filter-label">Min price</span>
            <input
              value={min}
              onChange={e => setMin(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              className="comic-input model-filter-input"
            />
          </label>
          <label>
            <span className="section-label model-filter-label">Max price</span>
            <input
              value={max}
              onChange={e => setMax(e.target.value)}
              inputMode="numeric"
              placeholder="Any"
              className="comic-input model-filter-input"
            />
          </label>
          {active && (
            <button
              type="button"
              onClick={() => { setMin(""); setMax(""); }}
              className="filter-chip model-filter-clear"
            >
              <span className="skew-label">✕ Clear</span>
            </button>
          )}
        </div>
      )}

      {/* Same list card as the market pages. */}
      <div className="model-list">
        <div className="model-list-bar">
          <span className="model-list-title">
            {label} — Listings
          </span>
          <span aria-live="polite" className="model-list-count">
            {shown.length} LISTING{shown.length === 1 ? "" : "S"}
          </span>
        </div>

        {parts.length === 0 ? (
          <div className="model-list-empty">
            <p className="model-list-empty-title">{"// OUT OF STOCK"}</p>
            <p className="model-list-empty-text">
              None of the stores we track list it right now. Try the other {seriesLabel} models above.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <div className="model-list-empty">
            <p className="model-list-empty-title">{"// NO LISTINGS IN THIS RANGE"}</p>
            <p className="model-list-empty-text">
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
