"use client";

import { useState, useEffect, useCallback, useRef, useId, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion } from "framer-motion";
import { getParts, getFilterOptions } from "@/lib/api";
import type { Part, FilterOptions } from "@/lib/api";
import type { SlotKey } from "@/app/build/page";
import { SLOT_LABELS, SLOT_CATEGORY } from "@/app/build/page";
import { DEFAULT_SORT } from "@/lib/constants";
import { ComicDropdown } from "@/components/ui/ComicDropdown";

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

// Spec filter keys relevant per category
const CATEGORY_FILTERS: Record<string, (keyof FilterOptions)[]> = {
  gpu:         ["vram", "brand"],
  cpu:         ["socket", "brand"],
  ram:         ["ddr_type", "speed"],
  motherboard: ["socket", "chipset"],
  psu:         ["wattage", "rating"],
  case:        ["form_factor"],
  ssd:         ["interface", "capacity"],
  cooling:     ["type"],
};

interface Props {
  slot: SlotKey;
  currentPart: Part | null;
  onSelect: (part: Part) => void;
  onClose: () => void;
}

export default function PartPickerModal({ slot, currentPart, onSelect, onClose }: Props) {
  const category = SLOT_CATEGORY[slot];
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"price_asc" | "price_desc">(DEFAULT_SORT);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  // Capture the element that opened the modal *during the initial render*,
  // before the search input's `autoFocus` steals focus in the commit phase —
  // an effect would run after that and capture the search input instead.
  const previousFocusRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" ? (document.activeElement as HTMLElement) : null
  );

  // Restore focus to whatever opened the modal — a keyboard user should not
  // be dropped back at the top of the page.
  useEffect(() => {
    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, []);

  function getFocusable(): HTMLElement[] {
    if (!dialogRef.current) return [];
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null);
  }

  // Focus trap: Tab/Shift+Tab wrap within the dialog instead of escaping to
  // the page behind the backdrop.
  function handleDialogKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab") return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeInDialog = dialogRef.current?.contains(document.activeElement);
    if (e.shiftKey) {
      if (document.activeElement === first || !activeInDialog) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !activeInDialog) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Load filter options once on open
  useEffect(() => {
    getFilterOptions(category).then(setFilterOptions);
  }, [category]);

  // Debounced search value sent to API
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Load parts whenever filters/sort/search change. Guarded against the fetch
  // race (H9): typing fast can fire several requests whose responses land out
  // of order, so an earlier-fired-but-later-resolving request must never
  // overwrite the list with stale results. Aborting the in-flight request
  // when a new one starts — and re-checking `aborted` after the await, since
  // abort() doesn't synchronously stop the code below it — closes the window
  // a debounce alone only narrows.
  const abortRef = useRef<AbortController | null>(null);

  const loadParts = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const result = await getParts({
      category,
      sort,
      limit: 50,
      q: debouncedSearch || undefined,
      include_specs: true,
      signal: controller.signal,
      ...activeFilters,
    });
    if (controller.signal.aborted) return; // superseded by a newer request

    if (result.ok) {
      setParts(result.items);
      setTotal(result.total);
    } else {
      setParts([]);
      setTotal(0);
    }
    setLoading(false);
  }, [category, sort, activeFilters, debouncedSearch]);

  useEffect(() => {
    loadParts();
    return () => abortRef.current?.abort();
  }, [loadParts]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleFilter(key: string, value: string) {
    setActiveFilters((prev) => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }

  const filteredParts = parts;

  const relevantFilterKeys = CATEGORY_FILTERS[category] ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(244,244,245,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: "24px",
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onKeyDown={handleDialogKeyDown}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "820px", maxWidth: "100%",
          background: "var(--bg-card)",
          border: "2px solid #111112",
          boxShadow: "10px 10px 0 #111112",
          display: "flex", flexDirection: "column",
          maxHeight: "86vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#111112", color: "white",
            padding: "16px 22px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span
            id={headingId}
            className="mono"
            style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}
          >
            Select — {SLOT_LABELS[slot]}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="comic-btn"
            style={{
              background: "none", border: "none", color: "white", fontSize: "18px", fontWeight: 800,
              cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)" }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${SLOT_LABELS[slot]}s...`}
            aria-label={`Search ${SLOT_LABELS[slot]}s`}
            className="comic-input"
            style={{
              width: "100%", padding: "10px 14px",
              border: "2px solid #111112",
              background: "white", fontSize: "13px", outline: "none",
              boxShadow: "2px 2px 0 #111112",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Filter chips */}
        {relevantFilterKeys.length > 0 && (
          <div
            style={{
              padding: "10px 22px",
              borderBottom: "2px solid #111112",
              display: "flex", gap: "8px", alignItems: "center",
              overflowX: "auto", flexShrink: 0,
              scrollbarWidth: "none",
            }}
          >
            {relevantFilterKeys.map((key) => {
              const values = filterOptions[key] ?? [];
              if (values.length === 0) return null;
              return (
                <div key={key} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span
                    className="mono"
                    style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)" }}
                  >
                    {key.replace("_", " ")}:
                  </span>
                  {values.map((v) => {
                    const active = activeFilters[key] === v;
                    return (
                      <button
                        key={v}
                        onClick={() => toggleFilter(key, v)}
                        style={{
                          padding: "4px 12px",
                          border: active ? "1.5px solid var(--purple)" : "1.5px solid var(--border)",
                          background: active ? "var(--purple-pale)" : "white",
                          boxShadow: active ? "2px 2px 0 var(--purple)" : "none",
                          transform: "skewX(-8deg)",
                          fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px",
                          color: active ? "var(--purple)" : "var(--text-muted)",
                          cursor: "pointer",
                          fontFamily: "var(--mono)",
                        }}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Part list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }} className="mono">
              Loading…
            </div>
          ) : filteredParts.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }} className="mono">
              No parts found
            </div>
          ) : (
            filteredParts.map((part) => {
              const isCurrent = currentPart?.id === part.id;
              return (
                <div
                  key={part.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "14px 22px",
                    borderBottom: "1px solid var(--border)",
                    background: isCurrent ? "var(--purple-pale)" : "transparent",
                    borderLeft: isCurrent ? "3px solid var(--purple)" : "3px solid transparent",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = "var(--purple-pale)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = isCurrent ? "var(--purple-pale)" : "transparent";
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: "52px", height: "52px",
                      background: "var(--bg-section)",
                      border: "1.5px solid var(--border)",
                      flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {part.thumbnail_url ? (
                      <img
                        src={part.thumbnail_url}
                        alt={part.name}
                        referrerPolicy="no-referrer"
                        style={{ width: "52px", height: "52px", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>IMG</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {part.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
                      {Object.values(part.specs ?? {}).filter(Boolean).slice(0, 3).join(" · ")}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>
                      {part.price_pkr != null ? "Rs\u00a0" + part.price_pkr.toLocaleString("en-PK") : "—"}
                    </p>
                    <p style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "2px" }}>{part.source}</p>
                  </div>

                  {/* Select button */}
                  <button
                    onClick={() => onSelect(part)}
                    style={{
                      padding: "8px 18px",
                      background: isCurrent ? "var(--purple)" : "var(--bg)",
                      border: "2px solid #111112",
                      boxShadow: "2px 2px 0 #111112",
                      fontSize: "9px", fontWeight: 800, letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: isCurrent ? "white" : "var(--text)",
                      cursor: "pointer",
                      transform: "skewX(-8deg)",
                      flexShrink: 0,
                      fontFamily: "var(--mono)",
                    }}
                    onMouseEnter={(e) => {
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.background = "var(--purple)";
                      btn.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget as HTMLButtonElement;
                      btn.style.background = isCurrent ? "var(--purple)" : "var(--bg)";
                      btn.style.color = isCurrent ? "white" : "var(--text)";
                    }}
                  >
                    {isCurrent ? "Selected ✓" : "Select"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "2px solid #111112",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "var(--bg)",
          }}
        >
          <span className="mono" style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
            {total} {SLOT_LABELS[slot]}s found
          </span>
          <ComicDropdown
            label="Sort"
            active={sort === DEFAULT_SORT ? "" : sort}
            options={SORT_OPTIONS}
            onSelect={(v) => setSort(v as "price_asc" | "price_desc")}
            onClear={() => setSort(DEFAULT_SORT)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
