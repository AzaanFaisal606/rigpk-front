"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isActive = !!minPrice || !!maxPrice;

  const [minValue, setMinValue] = useDebouncedField(minPrice, onMin);
  const [maxValue, setMaxValue] = useDebouncedField(maxPrice, onMax);

  const updateCoords = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, left: r.left });
    }
  }, []);

  function openPanel() {
    updateCoords();
    setOpen(true);
  }

  // Panel is portaled to <body>, so outside-click/Escape must check both the
  // trigger and the portaled panel — same pattern as ComicDropdown. Recompute
  // coords on scroll while open: the trigger sits in the filter bar's own
  // overflow-x scrollport, so a fixed-position panel anchored to it drifts
  // without this. `capture: true` catches scroll on that nested scrollport,
  // since scroll events don't bubble.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Claimed, so a modal around the filter doesn't close on the same key.
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", updateCoords, { passive: true, capture: true });
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", updateCoords, { capture: true });
    };
  }, [open, updateCoords]);

  const label = isActive ? `${minPrice || "0"} – ${maxPrice || "∞"}` : "Price";

  const panel = open && coords ? createPortal(
    <div
      ref={panelRef}
      className="price-range-panel"
      style={{
        top: coords.top,
        left: Math.min(Math.max(coords.left, 8), window.innerWidth - 216),
      }}
    >
      <div className="price-range-field">
        <div className="section-label price-range-label">Min (PKR)</div>
        <input
          type="number"
          placeholder="0"
          value={minValue}
          onChange={e => setMinValue(e.target.value)}
          className="comic-input price-range-input"
          aria-label="Minimum price (PKR)"
        />
      </div>
      <div className="price-range-field price-range-field--last">
        <div className="section-label price-range-label">Max (PKR)</div>
        <input
          type="number"
          placeholder="Any"
          value={maxValue}
          onChange={e => setMaxValue(e.target.value)}
          className="comic-input price-range-input"
          aria-label="Maximum price (PKR)"
        />
      </div>
      {isActive && (
        <button
          onClick={() => { onClear(); setOpen(false); }}
          className="comic-btn price-range-clear"
        >
          ✕ Clear
        </button>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="filter-trigger-wrap">
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`comic-btn filter-trigger${isActive ? " filter-trigger--active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Counter-skewed so the label reads upright, as in ComicDropdown. */}
        <span className="skew-label">{label}</span>
        <span className="skew-label filter-trigger-caret">{open ? "▲" : "▼"}</span>
      </button>

      {panel}
    </div>
  );
}
