"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getParts, getFilterOptions } from "@/lib/api";
import type { Part, FilterOptions } from "@/lib/api";
import type { SlotKey } from "@/app/build/page";
import { SLOT_LABELS, SLOT_CATEGORY } from "@/app/build/page";

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
  const [sort, setSort] = useState<"price_asc" | "price_desc">("price_asc");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load filter options once on open
  useEffect(() => {
    getFilterOptions(category).then(setFilterOptions);
  }, [category]);

  // Load parts whenever filters/sort change
  const loadParts = useCallback(async () => {
    setLoading(true);
    const result = await getParts({
      category,
      sort,
      limit: 50,
      ...activeFilters,
    });
    setParts(result.items);
    setTotal(result.total);
    setLoading(false);
  }, [category, sort, activeFilters]);

  useEffect(() => { loadParts(); }, [loadParts]);

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

  const filteredParts = search.trim()
    ? parts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : parts;

  const relevantFilterKeys = CATEGORY_FILTERS[category] ?? [];

  return (
    <AnimatePresence>
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
              className="mono"
              style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}
            >
              Select — {SLOT_LABELS[slot]}
            </span>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "white", fontSize: "18px", fontWeight: 800, cursor: "pointer", lineHeight: 1 }}
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
              style={{
                width: "100%", padding: "10px 14px",
                border: "2px solid #111112",
                background: "white", fontSize: "13px", outline: "none",
                boxShadow: "2px 2px 0 #111112",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7c3aed";
                e.target.style.boxShadow = "2px 2px 0 #7c3aed";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#111112";
                e.target.style.boxShadow = "2px 2px 0 #111112";
              }}
            />
          </div>

          {/* Filter chips */}
          {relevantFilterKeys.length > 0 && (
            <div
              style={{
                padding: "10px 22px",
                borderBottom: "2px solid #111112",
                display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap",
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
                            border: active ? "1.5px solid #7c3aed" : "1.5px solid var(--border)",
                            background: active ? "#f0ebff" : "white",
                            boxShadow: active ? "2px 2px 0 #7c3aed" : "none",
                            transform: "skewX(-8deg)",
                            fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px",
                            color: active ? "#7c3aed" : "var(--text-muted)",
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
                      background: isCurrent ? "#f0ebff" : "transparent",
                      borderLeft: isCurrent ? "3px solid #7c3aed" : "3px solid transparent",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) (e.currentTarget as HTMLDivElement).style.background = "#ede9fe";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = isCurrent ? "#f0ebff" : "transparent";
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
                        <Image src={part.thumbnail_url} alt={part.name} width={52} height={52} style={{ objectFit: "contain" }} unoptimized />
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
                        background: isCurrent ? "#7c3aed" : "var(--bg)",
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
                        btn.style.background = "#7c3aed";
                        btn.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = isCurrent ? "#7c3aed" : "var(--bg)";
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
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "price_asc" | "price_desc")}
              style={{ border: "1.5px solid var(--border)", padding: "6px 10px", fontSize: "11px", background: "white", cursor: "pointer" }}
            >
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
