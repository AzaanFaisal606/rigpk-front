"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cpu, HardDrive, MemoryStick, MonitorPlay, Zap, Box, CircuitBoard, Wind, Database, Monitor } from "lucide-react";
import type { Part } from "@/lib/api";
import { SOURCES } from "@/lib/constants";
import { partPath } from "@/lib/part-slug";
import { isSafeHref } from "@/lib/safe-url";
import PartDetailModal from "./PartDetailModal";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  gpu:         MonitorPlay,
  cpu:         Cpu,
  ram:         MemoryStick,
  ssd:         Database,
  hdd:         HardDrive,
  psu:         Zap,
  case:        Box,
  motherboard: CircuitBoard,
  cooling:     Wind,
  monitor:     Monitor,
};

const SOURCE_SHORT: Record<string, string> = Object.fromEntries(
  SOURCES.map(s => [s.key, s.label])
);

function formatPrice(p: number | null): string {
  if (p === null) return "Out of stock";
  return "Rs\u00a0" + p.toLocaleString("en-PK");
}

/**
 * The history entry a popup pushed carries { rigpkPart: id }. Matching the
 * path alone would also fire on a direct visit to the real part page.
 */
function ownsEntry(id: number, path: string): boolean {
  return window.location.pathname === path &&
    (window.history.state as { rigpkPart?: number } | null)?.rigpkPart === id;
}

/** The one row whose popup is open: a part listed twice on a page opens once. */
let claimant: object | null = null;

export default function PartRow({ part }: { part: Part }) {
  const Icon = CATEGORY_ICONS[part.category] ?? Cpu;
  // In the HTML the row links to our own part page (/part/<id>-<slug>), so
  // crawlers follow it into an indexable page. A plain <a>, never next/link:
  // a list of 50 Links would prefetch every visible row, each one a server
  // render + backend call.
  //
  // People, though, open rows in new tabs to collect the listings they mean
  // to order, so every "new tab" gesture goes to the retailer: ctrl/cmd/
  // shift-click, middle-click, and right-click (or long-press) → "Open link
  // in new tab". The href is swapped to the retailer just before the browser
  // reads it, and swapped back when the pointer leaves. Scraped urls are
  // third-party content, so they pass isSafeHref first.
  const path = partPath(part);
  const retailer = isSafeHref(part.url) ? part.url : undefined;
  const [open, setOpen] = useState(false);
  const token = useRef<object>({});

  // Back/Forward drive the popup: leaving our entry closes it, landing on it
  // again (e.g. Back from the model page link) reopens it. The same check
  // runs on mount, because returning to the list remounts the rows.
  useEffect(() => {
    const me = token.current;
    const sync = () => {
      const want = ownsEntry(part.id, path) && (claimant === null || claimant === me);
      if (want) claimant = me;
      else if (claimant === me) claimant = null;
      setOpen(want);
    };
    if (ownsEntry(part.id, path)) queueMicrotask(sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      if (claimant === me) claimant = null;
    };
  }, [part.id, path]);

  // Closing steps back through the entry the popup added, so the list's own
  // URL (filters, search, page) is restored exactly and Forward still works.
  const close = useCallback(() => {
    if (ownsEntry(part.id, path)) window.history.back();
    else setOpen(false);
  }, [part.id, path]);

  // A plain click opens the popup and puts the part URL in the address bar
  // without a navigation: the list underneath is untouched.
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.button !== 0 || e.altKey) return;
    e.preventDefault();
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      if (retailer) window.open(retailer, "_blank", "noopener,noreferrer");
      return;
    }
    window.history.pushState({ rigpkPart: part.id }, "", path);
    claimant = token.current;
    setOpen(true);
  }

  function pointRetailer(e: React.SyntheticEvent<HTMLAnchorElement>) {
    if (!retailer) return;
    e.currentTarget.href = retailer;
    e.currentTarget.rel = "noopener noreferrer";
  }
  function pointOurs(e: React.SyntheticEvent<HTMLAnchorElement>) {
    e.currentTarget.setAttribute("href", path);
    e.currentTarget.removeAttribute("rel");
  }

  return (
    <>
    <a
      onClick={handleClick}
      // Right-click / long-press: the context menu reads the href after this fires.
      onContextMenu={pointRetailer}
      // Middle-click: browsers open the href on release, after mousedown.
      onMouseDown={e => { if (e.button === 1) pointRetailer(e); }}
      onMouseLeave={pointOurs}
      onBlur={pointOurs}
      aria-haspopup="dialog"
      href={path}
      className="px-4 py-3 no-underline part-row"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 flex items-center justify-center overflow-hidden part-row-thumb">
        {part.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={part.thumbnail_url}
            alt={part.name}
            className="object-contain"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Icon className="part-row-icon" />
        )}
      </div>

      {/* Name */}
      <p className="font-medium part-row-name">
        {part.name}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-2 min-w-0 part-row-meta">
        <span className="mono px-1.5 py-px part-row-badge part-row-badge--cat">
          {part.category.toUpperCase()}
        </span>
        {part.condition && (
          <span className="mono px-1.5 py-px part-row-badge part-row-badge--cond">
            {part.condition.toUpperCase()}
          </span>
        )}
        <span className="mono truncate part-row-source">
          {SOURCE_SHORT[part.source] ?? part.source}
        </span>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right part-row-price-wrap">
        <span className={`mono part-row-price${part.price_pkr ? "" : " part-row-price--oos"}`}>
          {formatPrice(part.price_pkr)}
        </span>
      </div>
    </a>
    {/* Sibling, not child: React events from the portal would otherwise
        bubble to the row's onClick and swallow clicks on the Buy link. */}
    {open && <PartDetailModal part={part} onClose={close} />}
    </>
  );
}
