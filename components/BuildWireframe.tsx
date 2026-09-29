"use client";

import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS, SLOT_SUB } from "@/app/build/page";
import { PCChassisSVG } from "./PCChassis";

const INK = "var(--line-art)";
// Theme tokens: SVG presentation attributes resolve var(), so dark mode flips these too.
const PURPLE = "var(--purple)";
const CARD = "var(--bg-card)";
const DIM = "var(--faint)";
const TEXT2 = "var(--text-2)";
const MONO = "var(--mono)";
const SANS = "var(--sans)";

// Coordinate space 960 × 540 (aspect ~16:9 — less vertical stretch than before).
// Chassis occupies x=320–620 (width 300), y=30–510 (height 480). Wider, shorter look.
type SlotAnchor = {
  slot: SlotKey;
  side: "left" | "right";
  caseX: number;
  caseY: number;
  railY: number;
};

// CARD_LEFT_END and CARD_RIGHT_START must match elbowX/railEndX in CalloutLines.
// Cards are placed using percentages derived from these SVG coords so lines always connect.
// Leave 8px gap at left wall (left cards start at 8) and 8px at right wall (right cards end at 952).
const CARD_LEFT_END = 200;    // SVG x where left-side cards' right edge (= line endpoint) sits
const CARD_RIGHT_START = 760; // SVG x where right-side cards' left edge (= line endpoint) sits
const CARD_GAP = 8;           // gap in SVG units between card and section wall

const SLOT_ANCHORS: SlotAnchor[] = [
  { slot: "cpu",         side: "left",  caseX: 320, caseY: 110, railY: 70  },
  { slot: "gpu",         side: "left",  caseX: 320, caseY: 260, railY: 200 },
  { slot: "ssd",         side: "left",  caseX: 320, caseY: 320, railY: 330 },
  { slot: "psu",         side: "left",  caseX: 320, caseY: 450, railY: 460 },
  { slot: "ram",         side: "right", caseX: 620, caseY: 120, railY: 70  },
  { slot: "motherboard", side: "right", caseX: 620, caseY: 370, railY: 200 },
  { slot: "cooling",     side: "right", caseX: 620, caseY: 240, railY: 330 },
  { slot: "case",        side: "right", caseX: 620, caseY: 500, railY: 460 },
];

interface Props {
  build: BuildState;
  onSlotClick: (slot: SlotKey) => void;
}

function DiagLines() {
  const lines = [];
  for (let i = 0; i < 40; i++) {
    const x = (i * 63) % 1400;
    const len = 40 + ((i * 37) % 120);
    const col = i % 3 === 0 ? "var(--purple-pale)" : i % 3 === 1 ? "var(--line-soft)" : "var(--purple-pale)";
    const thick = i % 5 === 0 ? 2.5 : 1.5;
    lines.push(
      <line key={i} x1={x} y1={-20} x2={x - len} y2={len + 20}
        stroke={col} strokeWidth={thick} strokeLinecap="round" />
    );
  }
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.35 }}
      viewBox="0 0 1400 900"
      preserveAspectRatio="xMidYMid slice"
    >
      {lines}
    </svg>
  );
}

function CalloutLines({ build }: { build: BuildState }) {
  return (
    <svg
      viewBox="0 0 960 540"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {SLOT_ANCHORS.map(({ slot, side, caseX, caseY, railY }) => {
        const selected = build[slot] != null;
        const color = selected ? PURPLE : INK;
        const strokeWidth = selected ? 2 : 1.5;
        const strokeDasharray = selected ? "none" : "4 3";

        // elbowX: 10px out from chassis, then route to rail end aligned with card edge
        const elbowX = side === "left" ? 310 : 630;
        const railEndX = side === "left" ? CARD_LEFT_END : CARD_RIGHT_START;
        const points = `${caseX},${caseY} ${elbowX},${caseY} ${elbowX},${railY} ${railEndX},${railY}`;

        return (
          <g key={slot}>
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
            />
            <circle cx={caseX} cy={caseY} r="4" fill={color} stroke={INK} strokeWidth="1.5" />
            <circle cx={railEndX} cy={railY} r="3" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

function LabelCard({
  anchor,
  build,
  onSlotClick,
}: {
  anchor: SlotAnchor;
  build: BuildState;
  onSlotClick: (slot: SlotKey) => void;
}) {
  const { slot, side, railY } = anchor;
  const entry = build[slot];
  const part = entry?.part ?? null;
  const selected = entry != null;

  const topPct = (railY / 540) * 100;
  // Left cards: span CARD_GAP..CARD_LEFT_END (inset from left wall by CARD_GAP)
  // Right cards: span CARD_RIGHT_START..(960-CARD_GAP) (inset from right wall by CARD_GAP)
  const cardWidth = CARD_LEFT_END - CARD_GAP; // 192 SVG units, same both sides
  const leftPct = side === "left"
    ? (CARD_GAP / 960) * 100
    : (CARD_RIGHT_START / 960) * 100;
  const widthPct = (cardWidth / 960) * 100;

  return (
    <div
      onClick={() => onSlotClick(slot)}
      style={{
        position: "absolute",
        top: `calc(${topPct}% - 30px)`,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        // Inner padding: left cards inset from left wall; right cards inset from right wall
        // Box sizing accounts for the percentage-based width
        boxSizing: "border-box" as const,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: side === "left" ? 10 : 12,
        paddingRight: side === "left" ? 12 : 10,
        background: selected ? "var(--bg-card)" : "var(--bg)",
        border: `2px solid ${selected ? PURPLE : "var(--ink)"}`,
        boxShadow: `3px 3px 0 ${selected ? PURPLE : "var(--shadow)"}`,
        cursor: "pointer",
        transition: "transform 0.12s",
        zIndex: 3,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px, -2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translate(0, 0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
        <span style={{
          fontFamily: MONO, fontSize: 9, fontWeight: 800,
          color: selected ? PURPLE : DIM,
          letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          {SLOT_LABELS[slot]}
        </span>
        {selected && <span style={{ color: PURPLE, fontSize: 11, fontWeight: 900 }}>✓</span>}
      </div>

      {part ? (
        <>
          <div style={{
            fontFamily: SANS, fontSize: 11, fontWeight: 700, color: INK,
            lineHeight: 1.25, marginBottom: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {part.name}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: TEXT2 }}>
            Rs {part.price_pkr != null ? part.price_pkr.toLocaleString("en-PK") : "—"}
            <span style={{ color: DIM, marginLeft: 6 }}>· {part.source}</span>
          </div>
        </>
      ) : (
        <div style={{
          fontFamily: MONO, fontSize: 10, fontWeight: 700,
          color: DIM, fontStyle: "italic",
        }}>
          + click to select {SLOT_SUB[slot].toLowerCase()}
        </div>
      )}
    </div>
  );
}

export default function BuildWireframe({ build, onSlotClick }: Props) {
  return (
    <section
      className="build-wireframe"
      style={{
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "32px 32px 24px",
        background: "var(--bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <DiagLines />
      <h1
        className="font-black fade-up"
        style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--text)", marginBottom: "20px", position: "relative", animationDelay: "0.3s" }}
      >
        Build a PC
      </h1>

      {/* Framed container — full left column width */}
      <div style={{
        position: "relative",
        width: "100%",
        background: CARD,
        border: `2px solid var(--ink)`,
        boxShadow: `6px 6px 0 var(--shadow)`,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Corner annotations */}
        <div style={{ position: "absolute", top: 10, left: 14, fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: 1.5, zIndex: 2, pointerEvents: "none" }}>
          ◼ SIDE VIEW · MID-TOWER ATX
        </div>
        <div style={{ position: "absolute", top: 10, right: 14, fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: 1.5, zIndex: 2, pointerEvents: "none" }}>
          SCALE 1:4 · CLICK ANY CALLOUT
        </div>
        <div style={{ position: "absolute", bottom: 10, left: 14, fontFamily: MONO, fontSize: 9, color: DIM, letterSpacing: 1.5, zIndex: 2, pointerEvents: "none" }}>
          REV A · 2026.04
        </div>
        <div style={{ position: "absolute", bottom: 10, right: 14, fontFamily: MONO, fontSize: 9, color: PURPLE, letterSpacing: 1.5, zIndex: 2, pointerEvents: "none" }}>
          PARTS: 8 SLOTS
        </div>

        {/* 960×540 coordinate space */}
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "960 / 540",
        }}>
          <PCChassisSVG />
          <CalloutLines build={build} />
          {SLOT_ANCHORS.map((anchor) => (
            <LabelCard
              key={anchor.slot}
              anchor={anchor}
              build={build}
              onSlotClick={onSlotClick}
            />
          ))}
        </div>
      </div>

      {/* Legend — same width as framed container so "scroll for parts" aligns with right edge */}
      <div style={{ marginTop: 14, display: "flex", gap: 16, alignItems: "center", position: "relative", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, color: TEXT2 }}>
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={INK} strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          empty slot
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, color: TEXT2 }}>
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={PURPLE} strokeWidth="2" /></svg>
          selected
        </div>
        <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: DIM }}>↓ scroll for parts</div>
      </div>
    </section>
  );
}
