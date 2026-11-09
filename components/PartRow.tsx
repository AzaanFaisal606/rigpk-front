"use client";

import { useCallback, useState } from "react";
import { Cpu, HardDrive, MemoryStick, MonitorPlay, Zap, Box, CircuitBoard, Wind, Database, Monitor } from "lucide-react";
import type { Part } from "@/lib/api";
import { SOURCES } from "@/lib/constants";
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

export default function PartRow({ part }: { part: Part }) {
  const Icon = CATEGORY_ICONS[part.category] ?? Cpu;
  // Scraped urls are third-party content — a javascript: value must never
  // reach an href. React 19 blocks that scheme too, but that protection is
  // inherited from the framework rather than owned here (L7). An <a> with no
  // href is inert (no navigation, not focusable) so this needs no fallback tag.
  const href = isSafeHref(part.url) ? part.url : undefined;
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // A plain click opens the detail popup. The row stays a real link to the
  // retailer, so crawlers follow it and ctrl/cmd/middle/shift-click still
  // open the store directly.
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(true);
  }

  return (
    <>
    <a
      onClick={handleClick}
      aria-haspopup="dialog"
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      className="px-4 py-3 no-underline part-row"
      style={{ borderBottom: "1px solid var(--ink)" }}
    >
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 flex items-center justify-center overflow-hidden part-row-thumb"
        style={{
          background: "var(--bg-section)",
          border: "1.5px solid var(--ink)",
        }}
      >
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
          <Icon className="part-row-icon" style={{ color: "var(--text-dim)" }} />
        )}
      </div>

      {/* Name */}
      <p className="font-medium part-row-name" style={{ color: "var(--text)" }}>
        {part.name}
      </p>

      {/* Badges */}
      <div className="flex items-center gap-2 min-w-0 part-row-meta">
        <span
          className="mono px-1.5 py-px"
          style={{
            fontSize: "0.6rem",
            fontWeight: 800,
            color: "var(--purple-text)",
            background: "color-mix(in srgb, var(--purple) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--purple) 22%, transparent)",
          }}
        >
          {part.category.toUpperCase()}
        </span>
        {part.condition && (
          <span
            className="mono px-1.5 py-px"
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#fff",
              background: "var(--bar)",
              border: "1px solid var(--ink)",
            }}
          >
            {part.condition.toUpperCase()}
          </span>
        )}
        <span
          className="mono truncate"
          style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)" }}
        >
          {SOURCE_SHORT[part.source] ?? part.source}
        </span>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right part-row-price-wrap">
        <span
          className="mono part-row-price"
          style={{
            fontWeight: 900,
            whiteSpace: "nowrap",
            color: part.price_pkr ? "var(--text)" : "var(--text-dim)",
          }}
        >
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
