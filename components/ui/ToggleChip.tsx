"use client";

import { useState } from "react";
import { monoFont } from "@/lib/tokens";

export function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-pressed={active}
      className="filter-chip"
      style={{
        padding: "5px 12px",
        border: active ? "2px solid var(--purple)" : "2px solid #111112",
        boxShadow: active ? "2px 2px 0 var(--purple)" : "2px 2px 0 #111112",
        background: active ? "var(--purple)" : hov ? "color-mix(in srgb, var(--purple) 6%, transparent)" : "white",
        color: active ? "white" : "#111112",
        fontFamily: monoFont,
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        transform: "skewX(-8deg)",
        cursor: "pointer",
        transition: "background 0.1s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>{label}</span>
    </button>
  );
}
