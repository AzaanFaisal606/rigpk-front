"use client";

import { useState } from "react";
import Link from "next/link";
import PCThumb from "./PCThumb";
import type { Prebuilt } from "@/lib/prebuilts-api";
import { monoFont } from "@/lib/tokens";

function truncate(s: string | undefined, n: number): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: monoFont,
        fontSize: "9px",
        fontWeight: 800,
        letterSpacing: "0.8px",
        textTransform: "uppercase",
        padding: "2px 7px",
        border: "1px solid #111112",
        boxShadow: "1px 1px 0 #111112",
        background: "white",
        color: "#111112",
      }}
    >
      {label}
    </span>
  );
}

interface Props {
  prebuilt: Prebuilt;
}

export default function PrebuiltCard({ prebuilt }: Props) {
  const [hovered, setHovered] = useState(false);
  const c = prebuilt.components;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: "none",
        borderRight: "2px solid #111112",
        borderBottom: "2px solid #111112",
        borderLeft: hovered ? "4px solid var(--purple)" : "4px solid transparent",
        boxShadow: hovered ? "6px 6px 0 var(--purple)" : "6px 6px 0 #111112",
        background: hovered ? "var(--purple-pale)" : "white",
        transition: "background 0.1s",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          borderBottom: "2px solid #111112",
          height: 200,
          background: "#f4f4f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Halftone bg */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, color-mix(in srgb, var(--purple) 10%, transparent) 1px, transparent 1px)",
            backgroundSize: "10px 10px",
            pointerEvents: "none",
          }}
        />
        {prebuilt.thumbnail_url ? (
          <img
            src={prebuilt.thumbnail_url}
            referrerPolicy="no-referrer"
            alt={prebuilt.name}
            style={{
              position: "relative",
              maxWidth: "80%",
              maxHeight: "80%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <div style={{ position: "relative" }}>
            <PCThumb scale={0.85} />
          </div>
        )}
        {/* Source label */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            background: "#111112",
            color: "white",
            fontFamily: monoFont,
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            padding: "4px 10px",
          }}
        >
          {prebuilt.source}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        {/* Name */}
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.875rem",
            lineHeight: 1.35,
            color: hovered ? "var(--purple)" : "#111112",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {prebuilt.name}
        </div>

        {/* Component chips */}
        {c && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {c.cpu      && <Chip label={truncate(c.cpu, 30)} />}
            {c.gpu      && <Chip label={truncate(c.gpu, 30)} />}
            {c.ram      && <Chip label={truncate(c.ram, 30)} />}
            {c.storage  && <Chip label={truncate(c.storage, 30)} />}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Price */}
        <div
          style={{
            fontFamily: monoFont,
            fontWeight: 900,
            fontSize: "1.1rem",
            color: "#111112",
            letterSpacing: "-0.01em",
          }}
        >
          {prebuilt.price_pkr
            ? `Rs ${prebuilt.price_pkr.toLocaleString("en-PK")}`
            : "—"}
        </div>

        {/* CTA */}
        <Link
          href={`/prebuilts/${prebuilt.id}`}
          style={{
            display: "inline-block",
            textAlign: "center",
            padding: "7px 14px",
            background: "var(--purple)",
            color: "white",
            border: "2px solid #111112",
            boxShadow: "3px 3px 0 #111112",
            fontFamily: monoFont,
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            textDecoration: "none",
            transform: "skewX(-8deg)",
          }}
        >
          <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>
            VIEW SPECS →
          </span>
        </Link>
      </div>
    </div>
  );
}
