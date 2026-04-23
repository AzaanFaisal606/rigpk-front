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
          {/* SVG layers and label cards go here in later tasks */}
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
