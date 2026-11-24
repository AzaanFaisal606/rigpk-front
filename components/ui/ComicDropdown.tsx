"use client";

import { useState, useEffect, useLayoutEffect, useRef, useId, useCallback, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

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

  // A trigger near the right edge (a wrapped filter row on a phone) would
  // push the panel off screen; once it has a width, slide it back in.
  useLayoutEffect(() => {
    if (!open || !coords || !panelRef.current) return;
    const overflow = panelRef.current.getBoundingClientRect().right - (window.innerWidth - 8);
    if (overflow > 0) setCoords({ top: coords.top, left: Math.max(8, coords.left - overflow) });
  }, [open, coords]);

  // The trigger can sit in a sideways scroller (the market bar, the /build
  // picker's filter row on phones); keep the fixed panel under it while that
  // scrolls. Scrolling the panel's own list is ignored. `capture` because
  // scroll events don't bubble.
  useEffect(() => {
    if (!open) return;
    function onScroll(e: Event) {
      if (panelRef.current?.contains(e.target as Node) || !btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 4, left: r.left });
    }
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, [open]);

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
      className="comic-dropdown-panel"
      style={{ top: coords.top, left: coords.left }}
    >
      {isActive && (
        <button
          onClick={() => { onClear(); setOpen(false); }}
          className="comic-dropdown-clear"
        >
          ✕ Clear
        </button>
      )}
      {options.map((opt, i) =>
        opt.separator ? (
          <div
            key={opt.value}
            className="comic-dropdown-sep"
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
            className={`comic-dropdown-option${i === activeIndex ? " comic-dropdown-option--active" : ""}`}
          >
            {opt.label}
          </button>
        )
      )}
    </div>,
    document.body
  ) : null;

  return (
    <div className="filter-trigger-wrap">
      <button
        ref={btnRef}
        onClick={handleOpen}
        onKeyDown={handleTriggerKeyDown}
        className={`comic-btn filter-trigger comic-dropdown-trigger${isActive ? " filter-trigger--active" : ""}`}
        // role="combobox" (not the implicit button role) is what makes
        // aria-activedescendant legal here — this is the WAI-ARIA
        // select-only combobox pattern: a trigger that keeps focus while
        // pointing at the active option inside a separate listbox.
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={activeOptionId}
      >
        {/* Counter-skew the contents so the text reads upright inside the
            skewed chip — same idiom as ToggleChip. Without it the glyphs lean
            and the trailing caret drifts outside the border. */}
        <span className="skew-label">{displayLabel}</span>
        <span className="skew-label filter-trigger-caret">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {panel}
    </div>
  );
}
