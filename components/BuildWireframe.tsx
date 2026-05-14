"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS, SLOT_SUB } from "@/app/build/page";

const INK = "#111112";
// Note: SVG `fill`/`stroke` attributes do not resolve CSS vars. Must stay literal.
// Keep in sync with --purple in app/globals.css.
const PURPLE = "#873260";
const CARD = "#f8f8f9";
const DIM = "#a1a1aa";
const TEXT2 = "#3f3f46";
const MONO = "var(--mono)";
const SANS = "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif";

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
    const col = i % 3 === 0 ? "#c4b5fd" : i % 3 === 1 ? "#e4e4e7" : "#ddd6fe";
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

function PCChassisSVG() {
  // ViewBox 960×540. Chassis x=320..620 (width 300), y=30..510 (height 480).
  // Motherboard tray x=335..605, y=70..420.
  return (
    <svg
      viewBox="0 0 960 540"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      {/* Vertical rail guide lines */}
      <line x1="300" y1="50" x2="300" y2="490" stroke={INK} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />
      <line x1="640" y1="50" x2="640" y2="490" stroke={INK} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />

      {/* ── Chassis outer walls ── */}
      <rect x="320" y="30" width="300" height="480" fill="none" stroke={INK} strokeWidth="2.5" />
      {/* Inner dashed inset */}
      <rect x="328" y="38" width="284" height="464" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

      {/* Top I/O strip */}
      <line x1="360" y1="38" x2="450" y2="38" stroke={INK} strokeWidth="3" />
      <circle cx="350" cy="44" r="3" fill="none" stroke={INK} strokeWidth="1.5" />
      <rect x="460" y="40" width="34" height="5" fill="none" stroke={INK} strokeWidth="1" />
      <rect x="500" y="40" width="34" height="5" fill="none" stroke={INK} strokeWidth="1" />

      {/* Motherboard tray outline */}
      <rect x="335" y="70" width="270" height="340" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.35" />

      {/* CPU zone — top-left of board */}
      <g>
        <rect x="355" y="85" width="90" height="90" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="400" cy="130" r="30" fill="none" stroke={INK} strokeWidth="2" />
        <circle cx="400" cy="130" r="18" fill="none" stroke={INK} strokeWidth="1" />
        <text x="400" y="134" textAnchor="middle" fontFamily={MONO} fontSize="10" fontWeight="700" fill={INK}>CPU</text>
      </g>

      {/* RAM zone — right of CPU, fully inside board (4 sticks) */}
      <g>
        <rect x="465" y="85" width="115" height="90" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={475 + i * 25} y="95"
            width="15" height="72"
            fill={i < 2 ? CARD : "none"}
            stroke={INK}
            strokeWidth={i < 2 ? 2 : 1}
            strokeDasharray={i < 2 ? "none" : "2 2"}
            opacity={i < 2 ? 1 : 0.5}
          />
        ))}
      </g>

      {/* Cooling fans — moved BELOW RAM, near right edge so no overlap.
          Two fans stacked vertically on right side, at y=210 and y=290. */}
      <g>
        <circle cx="580" cy="210" r="22" fill="none" stroke={INK} strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="580" y1="210"
            x2={580 + Math.cos((a * Math.PI) / 180) * 18}
            y2={210 + Math.sin((a * Math.PI) / 180) * 18}
            stroke={INK} strokeWidth="1.2" opacity="0.6"
          />
        ))}
        <circle cx="580" cy="210" r="5" fill={INK} />

        <circle cx="580" cy="290" r="22" fill="none" stroke={INK} strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="580" y1="290"
            x2={580 + Math.cos((a * Math.PI) / 180) * 18}
            y2={290 + Math.sin((a * Math.PI) / 180) * 18}
            stroke={INK} strokeWidth="1.2" opacity="0.6"
          />
        ))}
        <circle cx="580" cy="290" r="5" fill={INK} />
      </g>

      {/* GPU — long horizontal card, mid */}
      <g>
        <rect x="340" y="235" width="215" height="55" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="378" cy="262" r="20" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="378" cy="262" r="7" fill={INK} opacity="0.8" />
        <circle cx="448" cy="262" r="20" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="448" cy="262" r="7" fill={INK} opacity="0.8" />
        <circle cx="518" cy="262" r="20" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="518" cy="262" r="7" fill={INK} opacity="0.8" />
      </g>

      {/* SSD — narrow horizontal rect below GPU */}
      <g>
        <rect x="345" y="308" width="190" height="22" fill={CARD} stroke={INK} strokeWidth="2" />
        <rect x="353" y="314" width="8" height="10" fill={INK} opacity="0.6" />
        <line x1="368" y1="319" x2="528" y2="319" stroke={INK} strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* Chipset + mobo anchor marker */}
      <g>
        <rect x="475" y="345" width="70" height="50" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="510" cy="370" r="6" fill={PURPLE} />
        <text x="510" y="388" textAnchor="middle" fontFamily={MONO} fontSize="8" fill={DIM}>CHIPSET</text>
      </g>

      {/* PSU — bottom shroud */}
      <g>
        <rect x="325" y="420" width="290" height="70" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="375" cy="455" r="26" fill="none" stroke={INK} strokeWidth="1.5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={360 + i * 8} y1="435" x2={360 + i * 8} y2="475" stroke={INK} strokeWidth="0.8" opacity="0.5" />
        ))}
        <text x="520" y="460" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={INK}>PSU</text>
      </g>

      {/* Case feet */}
      <rect x="335" y="510" width="40" height="10" fill={INK} />
      <rect x="565" y="510" width="40" height="10" fill={INK} />
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
        const selected = build[slot] !== null;
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
  const part = build[slot];
  const selected = part !== null;
  const color = selected ? PURPLE : INK;

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
        border: `2px solid ${color}`,
        boxShadow: `3px 3px 0 ${color}`,
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) return null;

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "32px 32px 24px",
        background: "var(--bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <DiagLines />

      <motion.p
        className="section-label"
        style={{ marginBottom: "6px", position: "relative" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Configure your build
      </motion.p>
      <motion.h1
        className="font-black"
        style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--text)", marginBottom: "20px", position: "relative" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Build a PC
      </motion.h1>

      {/* Framed container — full left column width */}
      <div style={{
        position: "relative",
        width: "100%",
        background: CARD,
        border: `2px solid ${INK}`,
        boxShadow: `6px 6px 0 ${INK}`,
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
