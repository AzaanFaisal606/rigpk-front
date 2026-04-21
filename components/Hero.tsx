"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
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
        background: "var(--bg)",
        minHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderBottom: "2px solid #111112",
      }}
    >
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "100% 80px",
        }}
      />

      <DiagLines />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: "4px",
          background: "#7c3aed",
          borderRight: "1px solid #111112",
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
          <div style={{ width: "8px", height: "2px", background: "#7c3aed" }} />
          <span className="mono" style={{ color: "#7c3aed" }}>
            PAKPC // PC PART PICKER
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: "#111112",
            maxWidth: "720px",
          }}
        >
          Build Your
          <br />
          Dream PC
          <br />
          <span style={{ color: "#7c3aed", fontStyle: "italic" }}>In Pakistan.</span>
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
          <CTAButton href="/market" primary>
            Browse Market <ArrowRight size={14} />
          </CTAButton>
          <CTAButton href="/build" primary={false}>
            Build PC →
          </CTAButton>
        </motion.div>

        {/* Stats row */}
        {totalParts !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{ marginTop: "56px", display: "flex", maxWidth: "480px" }}
          >
            {[
              { value: totalParts.toLocaleString(), label: "Parts Tracked" },
              { value: String(totalSources), label: "Retailers" },
              { value: String(categories), label: "Categories" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  border: "2px solid #111112",
                  borderLeft: i === 0 ? "2px solid #111112" : "none",
                  background: "var(--bg-card)",
                  boxShadow: i === 2 ? "4px 4px 0 #111112" : "none",
                }}
              >
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 900,
                    color: "#111112",
                    lineHeight: 1,
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  }}
                >
                  {stat.value}
                </div>
                <div className="section-label" style={{ marginTop: "4px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

function CTAButton({
  href,
  primary,
  children,
}: {
  href: string;
  primary: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 28px",
        background: primary
          ? hovered ? "#6d28d9" : "#7c3aed"
          : hovered ? "rgba(124,58,237,0.06)" : "transparent",
        color: primary ? "white" : "#111112",
        border: "2px solid #111112",
        boxShadow: hovered ? "5px 5px 0 #111112" : "4px 4px 0 #111112",
        transform: "skewX(-8deg)",
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: "0.78rem",
        fontWeight: 800,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "background 0.1s, box-shadow 0.1s",
      }}
    >
      {children}
    </Link>
  );
}
