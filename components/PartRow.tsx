import { Cpu, HardDrive, MemoryStick, MonitorPlay, Zap, Box, CircuitBoard, Wind, Database, Monitor } from "lucide-react";
import type { Part } from "@/lib/api";
import { SOURCES } from "@/lib/constants";
import { isSafeHref } from "@/lib/safe-url";

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

  return (
    <a
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      className="flex items-center px-4 py-3 no-underline part-row"
      style={{ borderBottom: "1px solid #111112" }}
    >
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 flex items-center justify-center overflow-hidden part-row-thumb"
        style={{
          background: "var(--bg-section)",
          border: "1.5px solid #111112",
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

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate part-row-name" style={{ color: "var(--text)" }}>
          {part.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="mono px-1.5 py-px"
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "var(--purple)",
              background: "color-mix(in srgb, var(--purple) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--purple) 22%, transparent)",
            }}
          >
            {part.category.toUpperCase()}
          </span>
          <span
            className="mono"
            style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)" }}
          >
            {SOURCE_SHORT[part.source] ?? part.source}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <span
          className="mono part-row-price"
          style={{
            fontWeight: 900,
            whiteSpace: "nowrap",
            color: part.price_pkr ? "#111112" : "var(--text-dim)",
          }}
        >
          {formatPrice(part.price_pkr)}
        </span>
      </div>
    </a>
  );
}
