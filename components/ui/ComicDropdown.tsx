"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { monoFont } from "@/lib/tokens";

export interface DropdownOption {
  value: string;
  label: string;
  separator?: boolean;
}

interface ComicDropdownProps {
  label: string;
  active: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  onClear: () => void;
}

export function ComicDropdown({
  label,
  active,
  options,
  onSelect,
  onClear,
}: ComicDropdownProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleOpen() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left });
    }
    setOpen(o => !o);
  }

  const isActive = !!active && !active.startsWith("__sep__");
  const displayLabel = isActive
    ? (options.find(o => !o.separator && o.value === active)?.label ?? active)
    : label;

  const panel = open && coords ? createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
        background: "white",
        border: "2px solid #111112",
        boxShadow: "4px 4px 0 #111112",
        minWidth: "140px",
        maxHeight: "280px",
        overflowY: "auto",
      }}
    >
      {isActive && (
        <button
          onClick={() => { onClear(); setOpen(false); }}
          style={{
            display: "block",
            width: "100%",
            padding: "7px 12px",
            textAlign: "left",
            background: "rgba(124,58,237,0.06)",
            border: "none",
            borderBottom: "1px solid #111112",
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
      {options.map(opt =>
        opt.separator ? (
          <div
            key={opt.value}
            style={{
              padding: "4px 12px 2px",
              fontFamily: monoFont,
              fontSize: "9px",
              fontWeight: 800,
              color: "#7c3aed",
              letterSpacing: "1px",
              textTransform: "uppercase",
              background: "rgba(124,58,237,0.05)",
              borderTop: "1px solid #e4e4e7",
            }}
          >
            {opt.label}
          </div>
        ) : (
          <button
            key={opt.value}
            onClick={() => { onSelect(opt.value); setOpen(false); }}
            style={{
              display: "block",
              width: "100%",
              padding: "6px 12px 6px 18px",
              textAlign: "left",
              background: active === opt.value ? "#f0ebff" : "white",
              border: "none",
              borderBottom: "1px solid #e4e4e7",
              fontFamily: monoFont,
              fontSize: "10px",
              fontWeight: active === opt.value ? 800 : 600,
              color: active === opt.value ? "#7c3aed" : "#111112",
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            {opt.label}
          </button>
        )
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
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
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        <span>{displayLabel}</span>
        <span style={{ opacity: 0.6, fontSize: "8px" }}>{open ? "▲" : "▼"}</span>
      </button>
      {panel}
    </div>
  );
}
