import Image from "next/image";
import { Cpu, HardDrive, MemoryStick, MonitorPlay, Zap, Box, CircuitBoard, Wind, Database, Monitor } from "lucide-react";
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

  return (
    <a
      href={part.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center gap-4 px-4 py-3 no-underline transition-colors"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
      }}
    >
      {/* Purple left accent stripe — visible on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "var(--purple)" }}
      />

      {/* Hover background tint */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: "var(--bg-card-2)" }}
      />

      {/* Thumbnail */}
      <div
        className="relative z-10 flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
        style={{ background: "var(--bg-section)", border: "1px solid var(--border)" }}
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
      <div className="relative z-10 flex-1 min-w-0">
        <p
          className="font-medium text-sm truncate group-hover:text-[#7c3aed] transition-colors"
          style={{ color: "var(--text)" }}
        >
          {part.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="mono px-1.5 py-px rounded-sm"
            style={{
              fontSize: "0.6rem",
              color: "#7c3aed",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.16)",
            }}
          >
            {part.category.toUpperCase()}
          </span>
          <span
            className="mono"
            style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}
          >
            {SOURCE_SHORT[part.source] ?? part.source}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="relative z-10 flex-shrink-0 text-right">
        <span
          className="font-bold mono"
          style={{
            fontSize: "0.95rem",
            color: part.price_pkr ? "var(--text)" : "var(--text-dim)",
          }}
        >
          {formatPrice(part.price_pkr)}
        </span>
      </div>
    </a>
  );
}
