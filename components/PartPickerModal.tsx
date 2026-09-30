"use client";

import { useState, useEffect, useCallback, useRef, useId, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion } from "framer-motion";
import { getParts, getFilterOptions } from "@/lib/api";
import type { Part, FilterOptions, PartsParams, PartsResult } from "@/lib/api";
import type { SlotKey } from "@/app/build/page";
import { SLOT_LABELS, SLOT_CATEGORY } from "@/app/build/page";
import { DEFAULT_SORT, SOURCES } from "@/lib/constants";
import { ComicDropdown } from "@/components/ui/ComicDropdown";
import { PriceRangeFilter } from "@/components/ui/PriceRangeFilter";
import { specDropdowns } from "@/lib/filter-options";
import { MODELS, modelDropdownOptions } from "@/lib/models";
import { initialFilters, splitFilters, type PickerState } from "@/lib/picker-state";

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

const SOURCE_OPTIONS = SOURCES.map(s => ({ value: s.key, label: s.label }));

const PAGE = 50;

/** "150,000" -> 150000; empty or no digits -> no bound. */
function toPrice(v: string): number | undefined {
  const digits = v.replace(/\D/g, "");
  return digits ? Number(digits) : undefined;
}

type PartsOk = Extract<PartsResult, { ok: true }>;

interface Props {
  slot: SlotKey;
  currentPart: Part | null;
  /** Spec filters from the rest of the build (socket, DDR). Pre-set and clearable. */
  platformFilters: Record<string, string>;
  /** What this slot's picker had set when it last closed. */
  saved?: PickerState;
  /** Called on every filter change, so the page can hand it back on the next open. */
  onStateChange: (slot: SlotKey, state: PickerState) => void;
  onSelect: (part: Part) => void;
  onClose: () => void;
}

export default function PartPickerModal({ slot, currentPart, platformFilters, saved, onStateChange, onSelect, onClose }: Props) {
  const category = SLOT_CATEGORY[slot];
  const hasModels = category === "gpu" || category === "cpu";
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  // The modal mounts fresh on every open and picks up where this slot's
  // picker left off (lib/picker-state.ts). The build's platform is applied
  // on top unless the user cleared that exact value last time.
  const [search, setSearch] = useState(saved?.search ?? "");
  const [sort, setSort] = useState<"price_asc" | "price_desc">(saved?.sort ?? DEFAULT_SORT);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    () => initialFilters(saved, platformFilters)
  );
  const [modelSlug, setModelSlug] = useState(saved?.modelSlug ?? "");
  const [minPrice, setMinPrice] = useState(saved?.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(saved?.maxPrice ?? "");
  const [source, setSource] = useState(saved?.source ?? "");
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
  // Starts at the restored query so reopening doesn't fetch twice.
  const [debouncedSearch, setDebouncedSearch] = useState(saved?.search ?? "");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Hand every change back to the page, so closing the picker keeps it.
  // The platform is read from a ref: it can't change while the picker is
  // open, and it mustn't re-run this on each parent render.
  const platformRef = useRef(platformFilters);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);
  useEffect(() => {
    onStateChangeRef.current(slot, {
      search, sort, modelSlug, minPrice, maxPrice, source,
      ...splitFilters(activeFilters, platformRef.current),
    });
  }, [slot, search, sort, modelSlug, minPrice, maxPrice, source, activeFilters]);

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
    const model = modelSlug ? MODELS.find(m => m.category === category && m.slug === modelSlug) : undefined;
    const base: PartsParams = {
      category,
      sort,
      limit: PAGE,
      q: debouncedSearch || undefined,
      include_specs: true,
      source: source || undefined,
      min_price: toPrice(minPrice),
      max_price: toPrice(maxPrice),
      // The cooler slot wants CPU coolers; case fans share the category.
      exclude_type: category === "cooling" && !activeFilters.type ? "Fan/Accessory" : undefined,
      signal: controller.signal,
      ...activeFilters,
      // A VRAM-variant model ("RTX 4060 Ti 16GB") is its model plus a VRAM.
      ...(model?.vram && { vram: model.vram }),
    };
    // /api/parts takes one model value, and a K/KF pair is two, so a model
    // page's worth of listings is one request per value, merged here.
    const results = await Promise.all(
      (model?.models ?? [undefined]).map(name => getParts({ ...base, model: name }))
    );
    if (controller.signal.aborted) return; // superseded by a newer request

    if (results.every((r): r is PartsOk => r.ok)) {
      const dir = sort === "price_desc" ? -1 : 1;
      const items = results
        .flatMap(r => r.items)
        .sort((a, b) => dir * ((a.price_pkr ?? 0) - (b.price_pkr ?? 0)))
        .slice(0, PAGE);
      setParts(items);
      setTotal(results.reduce((n, r) => n + r.total, 0));
    } else {
      setParts([]);
      setTotal(0);
    }
    setLoading(false);
  }, [category, sort, activeFilters, debouncedSearch, modelSlug, source, minPrice, maxPrice]);

  useEffect(() => {
    // `loadParts` calls `setLoading(true)` before its first `await`, which
    // would otherwise run synchronously inside this effect's body
    // (react-hooks/set-state-in-effect). Deferring the call to a microtask
    // keeps it out of the effect's own call stack without any visible delay.
    queueMicrotask(loadParts);
    return () => abortRef.current?.abort();
  }, [loadParts]);

  // Close on Escape
  useEffect(() => {
    // A dropdown open inside the picker handles its own Escape first.
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !e.defaultPrevented) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setFilter(key: string, value: string) {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  function clearPlatform() {
    setActiveFilters((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(platformFilters)) delete next[key];
      return next;
    });
  }

  // The raw `model` spec is replaced by the curated model list (the same one
  // as the "Shop by model" pulldown), so it isn't offered twice.
  const dropdowns = specDropdowns(filterOptions, hasModels ? ["model"] : []);
  const modelOptions = hasModels ? modelDropdownOptions(category, activeFilters.socket) : [];
  // Platform filters still in force, for the note under the filter row.
  const matched = Object.entries(platformFilters)
    .filter(([key, value]) => activeFilters[key] === value)
    .map(([, value]) => value);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="picker-backdrop"
      style={{
        position: "fixed", inset: 0,
        background: "var(--scrim)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
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
        // Max height and shadow size live in globals.css (.picker-dialog) so
        // phones can take more of the screen.
        className="picker-dialog"
        style={{
          width: "820px", maxWidth: "100%",
          background: "var(--bg-card)",
          border: "2px solid var(--ink)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="picker-pad"
          style={{
            background: "var(--bar)", color: "white",
            paddingBlock: "16px",
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
        <div className="picker-pad" style={{ paddingBlock: "16px", borderBottom: "1px solid var(--border)" }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${SLOT_LABELS[slot]}s...`}
            aria-label={`Search ${SLOT_LABELS[slot]}s`}
            className="comic-input"
            style={{
              width: "100%", padding: "10px 14px",
              border: "2px solid var(--ink)",
              background: "var(--paper)", fontSize: "13px", outline: "none",
              boxShadow: "2px 2px 0 var(--shadow)",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Filters: the market bar's set as dropdowns. They wrap onto more
            rows on desktop and become one sideways-scrolling row on phones
            (.picker-filter-* in globals.css). The panels portal out, so the
            scroller can't clip them. */}
        <div className="picker-pad" style={{ paddingBlock: "12px", borderBottom: "2px solid var(--ink)", flexShrink: 0 }}>
          <div className="picker-filter-scroll">
          <div className="picker-filter-row">
            {hasModels && (
              <ComicDropdown
                label="Model"
                active={modelSlug}
                options={modelOptions}
                onSelect={setModelSlug}
                onClear={() => setModelSlug("")}
              />
            )}
            {dropdowns.map(({ key, label, options }) => (
              <ComicDropdown
                key={key}
                label={label}
                active={activeFilters[key] ?? ""}
                options={options}
                onSelect={(v) => setFilter(key, v)}
                onClear={() => setFilter(key, "")}
              />
            ))}
            <PriceRangeFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMin={setMinPrice}
              onMax={setMaxPrice}
              onClear={() => { setMinPrice(""); setMaxPrice(""); }}
            />
            <ComicDropdown
              label="Retailer"
              active={source}
              options={SOURCE_OPTIONS}
              onSelect={setSource}
              onClear={() => setSource("")}
            />
          </div>
          </div>
          {matched.length > 0 && (
            <div
              style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px",
                marginTop: "10px",
              }}
            >
              <span
                className="mono"
                style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--purple-text)" }}
              >
                {`// Matched to your build: ${matched.join(" · ")}`}
              </span>
              <button
                type="button"
                onClick={clearPlatform}
                style={{
                  background: "none", border: "none", padding: 0,
                  fontFamily: "var(--sans)", fontSize: "12px", fontWeight: 700,
                  color: "var(--text-muted)", cursor: "pointer",
                  textDecoration: "underline", textUnderlineOffset: "3px",
                }}
              >
                Show all
              </button>
            </div>
          )}
        </div>

        {/* Part list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }} className="mono">
              Loading…
            </div>
          ) : parts.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }} className="mono">
              No parts found
            </div>
          ) : (
            parts.map((part) => {
              const isCurrent = currentPart?.id === part.id;
              return (
                <div
                  key={part.id}
                  className="picker-row"
                  style={{
                    display: "flex", alignItems: "center",
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
                    className="picker-thumb"
                    style={{
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
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>IMG</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* One line on desktop, two on phones (globals.css). */}
                    <p className="picker-name" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                      {part.name}
                    </p>
                    <p
                      style={{
                        fontSize: "11px", color: "var(--text-muted)", marginTop: "3px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {Object.values(part.specs ?? {}).filter(Boolean).slice(0, 3).join(" · ")}
                    </p>
                  </div>

                  {/* Price and Select: side by side on desktop, stacked on phones. */}
                  <div className="picker-row-end">
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 800, color: "var(--text)" }}>
                      {part.price_pkr != null ? "Rs\u00a0" + part.price_pkr.toLocaleString("en-PK") : "—"}
                    </p>
                    <p style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "2px" }}>{part.source}</p>
                  </div>

                  {/* Select button */}
                  <button
                    onClick={() => onSelect(part)}
                    className="picker-select"
                    style={{
                      background: isCurrent ? "var(--purple)" : "var(--bg)",
                      border: "2px solid var(--ink)",
                      boxShadow: "2px 2px 0 var(--shadow)",
                      fontSize: "11px", fontWeight: 700, letterSpacing: "-0.005em",
                      color: isCurrent ? "white" : "var(--text)",
                      cursor: "pointer",
                      transform: "skewX(-8deg)",
                      flexShrink: 0,
                      fontFamily: "var(--sans)",
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
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="picker-pad"
          style={{
            paddingBlock: "14px",
            borderTop: "2px solid var(--ink)",
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
