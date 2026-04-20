"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS } from "@/app/build/page";

interface Props {
  build: BuildState;
  onSlotClick: (slot: SlotKey) => void;
}

// SVG viewBox: 1000x560. Image rendered 340x380, centered at (500, 280).
// Image origin in SVG: left=330, top=90. Scale: 340/600=0.567 x, 380/600=0.633 y.
// Part hotspot coords measured from wireframe image (600x600):
//   cpu cooler circle:  ~(220,285) → SVG (330+220*0.567, 90+285*0.633) = (455, 270)
//   gpu (long card):    ~(195,405) → SVG (330+195*0.567, 90+405*0.633) = (441, 346)
//   ram sticks:         ~(305,205) → SVG (330+305*0.567, 90+205*0.633) = (503, 220)
//   motherboard center: ~(265,310) → SVG (330+265*0.567, 90+310*0.633) = (480, 286)
//   psu (bottom-right): ~(445,455) → SVG (330+445*0.567, 90+455*0.633) = (582, 378)
//   case (outer frame): ~(500,100) → SVG (330+500*0.567, 90+100*0.633) = (614, 153)
//   ssd (small card):   ~(195,375) → SVG (330+195*0.567, 90+375*0.633) = (441, 327)
//   cooling (top fans): ~(310,150) → SVG (330+310*0.567, 90+150*0.633) = (506, 185)
// Left chips anchor at x=148, right chips at x=852 (in 1000-wide viewBox)
const LEFT_CHIPS: [SlotKey, number, number, number, number][] = [
  ["cpu",         148, 80,  455, 270],
  ["gpu",         148, 170, 441, 346],
  ["ram",         148, 260, 503, 220],
  ["motherboard", 148, 350, 480, 286],
];

const RIGHT_CHIPS: [SlotKey, number, number, number, number][] = [
  ["case",    852, 80,  614, 153],
  ["cooling", 852, 170, 506, 185],
  ["ssd",     852, 260, 441, 327],
  ["psu",     852, 350, 582, 378],
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

      {/* Wireframe + chips container — 1000x560 coordinate space */}
      <div style={{ position: "relative", width: "min(1000px, 96vw)", aspectRatio: "1000/560" }}>

        {/* SVG connector lines */}
        <svg
          viewBox="0 0 1000 560"
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

        {/* Left chips — positioned as % of container */}
        {LEFT_CHIPS.map(([slot, , cy]) => (
          <Chip
            key={slot}
            slot={slot}
            build={build}
            onClick={() => onSlotClick(slot)}
            style={{ left: 0, top: `calc(${(cy / 560) * 100}% - 16px)` }}
          />
        ))}

        {/* Wireframe image — positioned at 33% from left, 16% from top, 34% wide */}
        <div
          style={{
            position: "absolute",
            left: "33%", top: "16%",
            width: "34%",
            border: "2px solid #111112",
            boxShadow: "8px 8px 0 #111112",
          }}
        >
          <Image
            src="/wireframe.webp"
            alt="PC wireframe"
            width={340}
            height={380}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        </div>

        {/* Right chips */}
        {RIGHT_CHIPS.map(([slot, , cy]) => (
          <Chip
            key={slot}
            slot={slot}
            build={build}
            onClick={() => onSlotClick(slot)}
            style={{ right: 0, top: `calc(${(cy / 560) * 100}% - 16px)` }}
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
