"use client";

import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS, SLOT_SUB } from "@/app/build/page";
import { PCChassisSVG } from "./PCChassis";

const INK = "var(--line-art)";
// Theme tokens: SVG presentation attributes resolve var(), so dark mode flips these too.
const PURPLE = "var(--purple)";

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
      className="wireframe-layer wireframe-diag"
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
      className="wireframe-layer wireframe-callouts"
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
      className={`wireframe-card wireframe-card--${side}${selected ? " wireframe-card--selected" : ""}`}
      style={{
        // Placed in % of the drawing so the callout lines always meet it.
        top: `calc(${topPct}% - 30px)`,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
      }}
    >
      <div className="wireframe-card-head">
        <span className="wireframe-card-label">
          {SLOT_LABELS[slot]}
        </span>
        {selected && <span className="wireframe-card-check">✓</span>}
      </div>

      {part ? (
        <>
          <div className="wireframe-card-name">
            {part.name}
          </div>
          <div className="wireframe-card-price">
            Rs {part.price_pkr != null ? part.price_pkr.toLocaleString("en-PK") : "—"}
            <span className="wireframe-card-source">· {part.source}</span>
          </div>
        </>
      ) : (
        <div className="wireframe-card-empty">
          + click to select {SLOT_SUB[slot].toLowerCase()}
        </div>
      )}
    </div>
  );
}

export default function BuildWireframe({ build, onSlotClick }: Props) {
  return (
    <section className="build-wireframe">
      <DiagLines />
      <h1
        className="font-black fade-up wireframe-title"
        style={{ animationDelay: "0.3s" }}
      >
        Build a PC
      </h1>

      {/* Framed container — full left column width */}
      <div className="wireframe-frame">
        {/* Corner annotations */}
        <div className="wireframe-corner wireframe-corner--tl">
          ◼ SIDE VIEW · MID-TOWER ATX
        </div>
        <div className="wireframe-corner wireframe-corner--tr">
          SCALE 1:4 · CLICK ANY CALLOUT
        </div>
        <div className="wireframe-corner wireframe-corner--bl">
          REV A · 2026.04
        </div>
        <div className="wireframe-corner wireframe-corner--br">
          PARTS: 8 SLOTS
        </div>

        {/* 960×540 coordinate space */}
        <div className="wireframe-canvas">
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
      <div className="wireframe-legend">
        <div className="wireframe-legend-item">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={INK} strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          empty slot
        </div>
        <div className="wireframe-legend-item">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={PURPLE} strokeWidth="2" /></svg>
          selected
        </div>
        <div className="wireframe-legend-hint">↓ scroll for parts</div>
      </div>
    </section>
  );
}
