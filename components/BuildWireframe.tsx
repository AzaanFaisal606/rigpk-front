"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS, SLOT_SUB } from "@/app/build/page";

const INK = "#111112";
const PURPLE = "#7c3aed";
const CARD = "#f8f8f9";
const DIM = "#a1a1aa";
const TEXT2 = "#3f3f46";
const MONO = "var(--mono)";
const SANS = "-apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif";

type SlotAnchor = {
  slot: SlotKey;
  side: "left" | "right";
  caseX: number;
  caseY: number;
  railY: number;
};

const SLOT_ANCHORS: SlotAnchor[] = [
  { slot: "cpu",         side: "left",  caseX: 260, caseY: 110, railY: 60  },
  { slot: "gpu",         side: "left",  caseX: 260, caseY: 240, railY: 180 },
  { slot: "ssd",         side: "left",  caseX: 260, caseY: 295, railY: 300 },
  { slot: "psu",         side: "left",  caseX: 260, caseY: 410, railY: 420 },
  { slot: "ram",         side: "right", caseX: 480, caseY: 120, railY: 60  },
  { slot: "motherboard", side: "right", caseX: 480, caseY: 340, railY: 180 },
  { slot: "cooling",     side: "right", caseX: 480, caseY: 160, railY: 300 },
  { slot: "case",        side: "right", caseX: 480, caseY: 460, railY: 420 },
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
  // Chassis occupies x=260, y=20, width=220, height=480 within 720×512 space
  return (
    <svg
      viewBox="0 0 720 512"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      {/* Vertical rail guide lines */}
      <line x1="240" y1="40" x2="240" y2="472" stroke={INK} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />
      <line x1="480" y1="40" x2="480" y2="472" stroke={INK} strokeWidth="0.8" strokeDasharray="2 3" opacity="0.3" />

      {/* ── Chassis outer walls ── */}
      <rect x="260" y="20" width="220" height="472" fill="none" stroke={INK} strokeWidth="2.5" />
      {/* Inner dashed inset */}
      <rect x="268" y="28" width="204" height="456" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

      {/* Top I/O strip */}
      <line x1="300" y1="28" x2="360" y2="28" stroke={INK} strokeWidth="3" />
      <circle cx="290" cy="34" r="3" fill="none" stroke={INK} strokeWidth="1.5" />
      <rect x="370" y="30" width="30" height="5" fill="none" stroke={INK} strokeWidth="1" />

      {/* Motherboard outline — dashed rect behind everything */}
      <rect x="275" y="60" width="180" height="320" fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.35" />

      {/* CPU zone — top-left of board */}
      <g>
        <rect x="280" y="75" width="80" height="80" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="320" cy="115" r="26" fill="none" stroke={INK} strokeWidth="2" />
        <circle cx="320" cy="115" r="16" fill="none" stroke={INK} strokeWidth="1" />
        <text x="320" y="119" textAnchor="middle" fontFamily={MONO} fontSize="9" fontWeight="700" fill={INK}>CPU</text>
      </g>

      {/* RAM zone — right of CPU (4 sticks, 2 solid + 2 faded) */}
      <g>
        <rect x="370" y="75" width="80" height="80" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={378 + i * 17} y="83"
            width="12" height="64"
            fill={i < 2 ? CARD : "none"}
            stroke={INK}
            strokeWidth={i < 2 ? 2 : 1}
            strokeDasharray={i < 2 ? "none" : "2 2"}
            opacity={i < 2 ? 1 : 0.5}
          />
        ))}
      </g>

      {/* GPU — long horizontal card, mid */}
      <g>
        <rect x="270" y="195" width="190" height="55" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="300" cy="222" r="18" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="300" cy="222" r="6" fill={INK} opacity="0.8" />
        <circle cx="360" cy="222" r="18" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="360" cy="222" r="6" fill={INK} opacity="0.8" />
        <circle cx="420" cy="222" r="18" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="420" cy="222" r="6" fill={INK} opacity="0.8" />
      </g>

      {/* SSD — narrow horizontal rect below GPU */}
      <g>
        <rect x="275" y="268" width="140" height="20" fill={CARD} stroke={INK} strokeWidth="2" />
        <rect x="281" y="273" width="6" height="10" fill={INK} opacity="0.6" />
        <line x1="295" y1="278" x2="407" y2="278" stroke={INK} strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* Mobo marker — small rect + purple dot (lower-center of board) */}
      <g>
        <rect x="395" y="305" width="50" height="40" fill="none" stroke={INK} strokeWidth="1.5" />
        <circle cx="420" cy="325" r="6" fill={PURPLE} />
      </g>

      {/* Cooling — 2 fan circles, right column */}
      <g>
        <circle cx="450" cy="100" r="22" fill="none" stroke={INK} strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="450" y1="100"
            x2={450 + Math.cos((a * Math.PI) / 180) * 18}
            y2={100 + Math.sin((a * Math.PI) / 180) * 18}
            stroke={INK} strokeWidth="1.2" opacity="0.6"
          />
        ))}
        <circle cx="450" cy="100" r="5" fill={INK} />

        <circle cx="450" cy="175" r="22" fill="none" stroke={INK} strokeWidth="2" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <line
            key={a}
            x1="450" y1="175"
            x2={450 + Math.cos((a * Math.PI) / 180) * 18}
            y2={175 + Math.sin((a * Math.PI) / 180) * 18}
            stroke={INK} strokeWidth="1.2" opacity="0.6"
          />
        ))}
        <circle cx="450" cy="175" r="5" fill={INK} />
      </g>

      {/* PSU — bottom full-width block */}
      <g>
        <rect x="265" y="370" width="210" height="55" fill={CARD} stroke={INK} strokeWidth="2" />
        <circle cx="295" cy="397" r="20" fill="none" stroke={INK} strokeWidth="1.5" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={284 + i * 6} y1="385" x2={284 + i * 6} y2="409" stroke={INK} strokeWidth="0.8" opacity="0.5" />
        ))}
        <text x="395" y="402" textAnchor="middle" fontFamily={MONO} fontSize="9" fontWeight="700" fill={INK}>PSU</text>
      </g>

      {/* Case feet */}
      <rect x="270" y="492" width="30" height="8" fill={INK} />
      <rect x="440" y="492" width="30" height="8" fill={INK} />
    </svg>
  );
}

function CalloutLines({ build }: { build: BuildState }) {
  return (
    <svg
      viewBox="0 0 720 512"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {SLOT_ANCHORS.map(({ slot, side, caseX, caseY, railY }) => {
        const selected = build[slot] !== null;
        const color = selected ? PURPLE : INK;
        const strokeWidth = selected ? 2 : 1.5;
        const strokeDasharray = selected ? "none" : "4 3";

        const elbowX = side === "left" ? 230 : 510;
        const railEndX = side === "left" ? 220 : 500;
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
            {/* Anchor dot on chassis edge */}
            <circle cx={caseX} cy={caseY} r="4" fill={color} stroke={INK} strokeWidth="1.5" />
            {/* Rail-end bullet */}
            <circle cx={railEndX} cy={railY} r="3" fill={color} />
          </g>
        );
      })}
    </svg>
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
        height: "calc(100vh - 52px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 32px",
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
        className="font-black text-center"
        style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--text)", marginBottom: "28px", position: "relative" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Build a PC
      </motion.h1>

      {/* Framed container */}
      <div style={{
        position: "relative",
        width: "min(960px, 94vw)",
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

        {/* 720×512 coordinate space — placeholder for now */}
        <div style={{
          position: "relative",
          width: "100%",
          aspectRatio: "720 / 512",
        }}>
          <PCChassisSVG />
          <CalloutLines build={build} />
          {/* LabelCards go here in the next task */}
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: "flex", gap: 16, alignItems: "center", position: "relative" }}>
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

      {/* Scroll hint */}
      <motion.div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", marginTop: "16px", color: "var(--text-dim)", position: "relative" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.span
          style={{ fontSize: "18px" }}
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
