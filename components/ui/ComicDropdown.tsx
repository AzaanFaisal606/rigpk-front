"use client";

import { useState, useEffect, useRef, useId, useCallback, type KeyboardEvent } from "react";
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();

  // Indices of options that are actual selectable rows (skip separators).
  const selectableIndices = options
    .map((opt, i) => (opt.separator ? -1 : i))
    .filter(i => i !== -1);

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

  // The panel scrolls (maxHeight 280px, overflowY auto) and real focus never
  // leaves the trigger — this is the aria-activedescendant pattern — so the
  // browser does nothing to keep the active option visible. Without this, a
  // keyboard user arrowing down a long list (retailer, model) drives an
  // active option they cannot see. `nearest` scrolls only when it has to,
  // which keeps the panel still while moving inside the visible rows.
  useEffect(() => {
    if (!open || activeIndex < 0 || !panelRef.current) return;
    panelRef.current
      .querySelector(`#${CSS.escape(`${listId}-opt-${activeIndex}`)}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, listId]);

  const openMenu = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left });
    }
    const currentIdx = options.findIndex(o => !o.separator && o.value === active);
    setActiveIndex(currentIdx !== -1 ? currentIdx : (selectableIndices[0] ?? -1));
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, active]);

  function handleOpen() {
    if (open) {
      setOpen(false);
    } else {
      openMenu();
    }
  }

  function selectAt(index: number) {
    const opt = options[index];
    if (!opt || opt.separator) return;
    onSelect(opt.value);
    setOpen(false);
  }

  function moveActive(delta: number) {
    if (selectableIndices.length === 0) return;
    setActiveIndex(cur => {
      const pos = selectableIndices.indexOf(cur);
      const nextPos = pos === -1
        ? (delta > 0 ? 0 : selectableIndices.length - 1)
        : Math.min(Math.max(pos + delta, 0), selectableIndices.length - 1);
      return selectableIndices[nextPos] ?? cur;
    });
  }

  function jumpActive(toStart: boolean) {
    if (selectableIndices.length === 0) return;
    setActiveIndex(toStart ? selectableIndices[0] : selectableIndices[selectableIndices.length - 1]);
  }

  function typeaheadJump(char: string) {
    if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    typeaheadRef.current += char.toLowerCase();
    const query = typeaheadRef.current;
    const match = selectableIndices.find(i => options[i].label.toLowerCase().startsWith(query));
    if (match !== undefined) setActiveIndex(match);
    typeaheadTimer.current = setTimeout(() => { typeaheadRef.current = ""; }, 500);
  }

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        e.preventDefault();
        jumpActive(true);
        break;
      case "End":
        e.preventDefault();
        jumpActive(false);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectAt(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        // Let focus move on naturally — just close the panel behind it.
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
          typeaheadJump(e.key);
        }
    }
  }

  const isActive = !!active && !active.startsWith("__sep__");
  const displayLabel = isActive
    ? (options.find(o => !o.separator && o.value === active)?.label ?? active)
    : label;

  const activeOptionId = open && activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  const panel = open && coords ? createPortal(
    <div
      ref={panelRef}
      id={listId}
      role="listbox"
      aria-label={label}
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
            background: "color-mix(in srgb, var(--purple) 6%, transparent)",
            border: "none",
            borderBottom: "1px solid #111112",
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
      {options.map((opt, i) =>
        opt.separator ? (
          <div
            key={opt.value}
            style={{
              padding: "4px 12px 2px",
              fontFamily: monoFont,
              fontSize: "9px",
              fontWeight: 800,
              color: "var(--purple)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              background: "color-mix(in srgb, var(--purple) 5%, transparent)",
              borderTop: "1px solid #e4e4e7",
            }}
          >
            {opt.label}
          </div>
        ) : (
          <button
            key={opt.value}
            id={`${listId}-opt-${i}`}
            role="option"
            aria-selected={active === opt.value}
            tabIndex={-1}
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => selectAt(i)}
            style={{
              display: "block",
              width: "100%",
              padding: "6px 12px 6px 18px",
              textAlign: "left",
              background: active === opt.value ? "var(--purple-pale)" : "white",
              border: "none",
              borderBottom: "1px solid #e4e4e7",
              outline: i === activeIndex ? "2px solid var(--purple)" : "none",
              outlineOffset: "-2px",
              fontFamily: monoFont,
              fontSize: "10px",
              fontWeight: active === opt.value ? 800 : 600,
              color: active === opt.value ? "var(--purple)" : "#111112",
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
        onKeyDown={handleTriggerKeyDown}
        className="comic-btn"
        // role="combobox" (not the implicit button role) is what makes
        // aria-activedescendant legal here — this is the WAI-ARIA
        // select-only combobox pattern: a trigger that keeps focus while
        // pointing at the active option inside a separate listbox.
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeOptionId}
        style={{
          // Horizontal padding absorbs the shear the skew adds: a 24px-tall
          // chip skewed 8deg pushes its top/bottom corners ~1.7px past the
          // unskewed box on each side, and at 44px (the mobile min-height)
          // that grows past 3px. 14px leaves room for it plus the 2px shadow
          // so the last chip in the row isn't clipped by the scroll wrapper.
          padding: "5px 14px",
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
          transition: "background 0.1s, border-color 0.1s",
        }}
      >
        {/* Counter-skew the contents so the text reads upright inside the
            skewed chip — same idiom as ToggleChip. Without it the glyphs lean
            and the trailing caret drifts outside the border. */}
        <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>{displayLabel}</span>
        <span style={{ display: "inline-block", transform: "skewX(8deg)", opacity: 0.6, fontSize: "8px" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {panel}
    </div>
  );
}
