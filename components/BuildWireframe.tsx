"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS } from "@/app/build/page";

interface Props {
  build: BuildState;
  onSlotClick: (slot: SlotKey) => void;
}

// Left chips: [slot, chipX (right edge), chipY (center), lineToX, lineToY]
// Right chips: [slot, chipX (left edge), chipY (center), lineToX, lineToY]
// Coordinates are in the 860x480 SVG viewBox space.
// Image center is at (430, 220), image is ~260x300px rendered.
const LEFT_CHIPS: [SlotKey, number, number, number, number][] = [
  ["cpu",         148, 68,  300, 120],
  ["gpu",         148, 138, 300, 180],
  ["ram",         148, 208, 310, 230],
  ["motherboard", 148, 278, 305, 270],
];

const RIGHT_CHIPS: [SlotKey, number, number, number, number][] = [
  ["psu",     712, 68,  560, 150],
  ["case",    712, 138, 555, 200],
  ["ssd",     712, 208, 560, 260],
  ["cooling", 712, 278, 555, 130],
];

function Chip({
  slot,
  build,
  onClick,
  style,
}: {
  slot: SlotKey;
  build: BuildState;
  onClick: () => void;
  style: React.CSSProperties;
}) {
  const selected = build[slot] !== null;
  return (
    <motion.button
      onClick={onClick}
      animate={selected ? {} : { opacity: [1, 0.6, 1] }}
      transition={selected ? {} : { repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      style={{
        position: "absolute",
        padding: "6px 16px",
        background: selected ? "#7c3aed" : "var(--bg)",
        border: "2px solid #111112",
        boxShadow: "3px 3px 0 #111112",
        transform: "skewX(-12deg)",
        fontSize: "11px",
        fontWeight: 800,
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: selected ? "white" : "var(--text)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "var(--mono)",
        ...style,
      }}
      whileHover={{ background: selected ? "#6d28d9" : "#ede9fe" }}
    >
      {SLOT_LABELS[slot]}{selected ? " ✓" : ""}
    </motion.button>
  );
}

export default function BuildWireframe({ build, onSlotClick }: Props) {
  function lineColor(slot: SlotKey) {
    return build[slot] ? "#7c3aed" : "#111112";
  }
  function lineDash(slot: SlotKey) {
    return build[slot] ? "none" : "4 3";
  }

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
      <motion.p
        className="section-label"
        style={{ marginBottom: "6px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Configure your build
      </motion.p>
      <motion.h1
        className="font-black text-center"
        style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--text)", marginBottom: "40px" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Build a PC
      </motion.h1>

      {/* Wireframe + chips container */}
      <div style={{ position: "relative", width: "860px", height: "480px", maxWidth: "100%" }}>

        {/* SVG connector lines */}
        <svg
          viewBox="0 0 860 480"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        >
          {LEFT_CHIPS.map(([slot, cx, cy, lx, ly]) => (
            <line
              key={slot}
              x1={cx} y1={cy} x2={lx} y2={ly}
              stroke={lineColor(slot)}
              strokeWidth="1.5"
              strokeDasharray={lineDash(slot)}
            />
          ))}
          {RIGHT_CHIPS.map(([slot, cx, cy, lx, ly]) => (
            <line
              key={slot}
              x1={cx} y1={cy} x2={lx} y2={ly}
              stroke={lineColor(slot)}
              strokeWidth="1.5"
              strokeDasharray={lineDash(slot)}
            />
          ))}
        </svg>

        {/* Left chips */}
        {LEFT_CHIPS.map(([slot, , cy]) => (
          <Chip
            key={slot}
            slot={slot}
            build={build}
            onClick={() => onSlotClick(slot)}
            style={{ left: 0, top: cy - 16 }}
          />
        ))}

        {/* Wireframe image */}
        <div
          style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            border: "2px solid #111112",
            boxShadow: "8px 8px 0 #111112",
          }}
        >
          <Image
            src="/wireframe.webp"
            alt="PC wireframe"
            width={300}
            height={340}
            style={{ display: "block" }}
          />
        </div>

        {/* Right chips */}
        {RIGHT_CHIPS.map(([slot, , cy]) => (
          <Chip
            key={slot}
            slot={slot}
            build={build}
            onClick={() => onSlotClick(slot)}
            style={{ right: 0, top: cy - 16 }}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <motion.div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", marginTop: "32px", color: "var(--text-dim)" }}
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
        <span className="section-label">configure parts below</span>
      </motion.div>
    </section>
  );
}
