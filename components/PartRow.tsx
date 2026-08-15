"use client";

import { Cpu, HardDrive, MemoryStick, MonitorPlay, Zap, Box, CircuitBoard, Wind, Database, Monitor } from "lucide-react";
import { useState } from "react";
import type { Part } from "@/lib/api";

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

const SOURCE_SHORT: Record<string, string> = {
  "czone.com.pk":      "CZone",
  "zahcomputers.pk":   "Zah Computers",
  "amdhouse.pk":       "AMD House",
  "rbtechngames.com":  "RB Tech",
  "junaidtech.pk":     "Junaid Tech",
};

function formatPrice(p: number | null): string {
  if (p === null) return "Out of stock";
  return "Rs\u00a0" + p.toLocaleString("en-PK");
}

export default function PartRow({ part }: { part: Part }) {
  const Icon = CATEGORY_ICONS[part.category] ?? Cpu;
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={part.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center px-4 py-3 no-underline part-row"
      style={{
        borderBottom: "1px solid #111112",
        borderLeft: hovered ? "4px solid var(--purple)" : "4px solid transparent",
        background: hovered ? "var(--purple-pale)" : "var(--bg-card)",
        transition: "background 0.1s, border-left-color 0.1s",
      }}
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
          />
        ) : (
          <Icon className="part-row-icon" style={{ color: "var(--text-dim)" }} />
        )}
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium truncate part-row-name"
          style={{
            color: hovered ? "var(--purple)" : "var(--text)",
            transition: "color 0.1s",
          }}
        >
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
