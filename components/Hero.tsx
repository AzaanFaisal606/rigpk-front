"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { type Stats } from "@/lib/api";
import DiagLines from "./DiagLines";

interface HeroProps {
  stats: Stats | null;
}

export default function Hero({ stats }: HeroProps) {
  const totalParts = stats?.total_parts ?? null;
  const totalSources = stats ? Object.keys(stats.by_source).length : null;
  const categories = stats ? Object.keys(stats.by_category).length : null;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(148deg, #f4f4f5 0%, #ececee 45%, #e6e4ef 100%)",
        minHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Subtle grid lines — horizontal rule accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "100% 80px",
        }}
      />

      {/* Diagonal animated lines — bottom right */}
      <DiagLines />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #7c3aed 40%, #a855f7 60%, transparent)",
          opacity: 0.5,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 w-full">
        {/* Top mono label */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="h-px w-8" style={{ background: "#7c3aed" }} />
          <span className="mono" style={{ color: "#7c3aed" }}>
            PAKPC // PC PART PICKER
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-bold leading-[1.04] tracking-tight"
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            color: "#111112",
            maxWidth: "720px",
          }}
        >
          Build Your
          <br />
          Dream PC
          <br />
          <span
            style={{
              color: "#7c3aed",
              fontStyle: "italic",
            }}
          >
            In Pakistan.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-lg leading-relaxed"
          style={{ color: "#71717a", fontSize: "1.05rem" }}
        >
          Real-time prices scraped from Pakistan&apos;s top PC retailers.
          Compare, build, and track — all in one place.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/market"
            className="btn-primary flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-lg"
          >
            Browse Market <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* Stats row */}
        {totalParts !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center gap-0 border-t pt-8"
            style={{ borderColor: "rgba(0,0,0,0.08)", maxWidth: "560px" }}
          >
            <StatPill value={totalParts.toLocaleString()} label="Parts Tracked" />
            <div className="w-px h-10 mx-6" style={{ background: "var(--border)" }} />
            <StatPill value={String(totalSources)} label="Retailers" />
            <div className="w-px h-10 mx-6" style={{ background: "var(--border)" }} />
            <StatPill value={String(categories)} label="Categories" />
          </motion.div>
        )}
      </div>
    </section>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="font-bold tabular-nums"
        style={{ fontSize: "1.6rem", color: "#111112", lineHeight: 1 }}
      >
        {value}
      </span>
      <span className="mono" style={{ color: "#a1a1aa" }}>
        {label}
      </span>
    </div>
  );
}
