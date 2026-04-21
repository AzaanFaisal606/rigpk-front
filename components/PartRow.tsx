"use client";

import Image from "next/image";
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
      className="flex items-center gap-4 px-4 py-3 no-underline"
      style={{
        borderBottom: "1px solid #111112",
        borderLeft: hovered ? "4px solid #7c3aed" : "4px solid transparent",
        background: hovered ? "#ede9fe" : "var(--bg-card)",
        transition: "background 0.1s, border-left-color 0.1s",
      }}
    >
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden"
        style={{
          background: "var(--bg-section)",
          border: "1.5px solid #111112",
        }}
      >
        {part.thumbnail_url ? (
          <Image
            src={part.thumbnail_url}
            alt={part.name}
            width={48}
            height={48}
            className="object-contain"
            unoptimized
          />
        ) : (
          <Icon size={20} style={{ color: "var(--text-dim)" }} />
        )}
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-sm truncate"
          style={{ color: hovered ? "#7c3aed" : "var(--text)", transition: "color 0.1s" }}
        >
          {part.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="mono px-1.5 py-px"
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#7c3aed",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.22)",
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
          className="mono"
          style={{
            fontSize: "1rem",
            fontWeight: 900,
            color: part.price_pkr ? "#111112" : "var(--text-dim)",
          }}
        >
          {formatPrice(part.price_pkr)}
        </span>
      </div>
    </a>
  );
}
