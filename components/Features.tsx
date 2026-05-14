"use client";

import { Search, Cpu, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { monoFont } from "@/lib/tokens";

const FEATURES = [
  {
    icon: Search,
    tag: "01",
    title: "Browse Prices",
    description:
      "Search and filter thousands of PC parts from multiple Pakistani retailers. Sort by price, source, or category.",
    accent: "var(--purple)",
    dark: false,
    href: "/market",
    cta: "BROWSE MARKET →",
  },
  {
    icon: Cpu,
    tag: "02",
    title: "Build a PC",
    description:
      "Pick parts, check compatibility, and calculate your total build cost in real time.",
    accent: "var(--purple-accent)",
    dark: true,
    href: "/build",
    cta: "BUILD NOW →",
  },
  {
    icon: TrendingUp,
    tag: "03",
    title: "Track Prices",
    description:
      "View full price history graphs for any part. Know the best time to buy.",
    accent: "var(--purple-accent)",
    dark: false,
    href: null,
    cta: "COMING SOON →",
  },
];

export default function Features() {
  return (
    <section
      className="px-6 py-24"
      style={{ background: "var(--bg)", borderTop: "2px solid #111112" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="section-label mb-2">Platform Features</p>
          <h2
            style={{
              fontFamily: monoFont,
              fontWeight: 900,
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--text)",
            }}
          >
            Everything you need
            <br />
            <span style={{ color: "var(--text-muted)" }}>to build smarter.</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  f,
  i,
}: {
  f: (typeof FEATURES)[number];
  i: number;
}) {
  const [hovered, setHovered] = useState(false);

  const border = f.dark ? `2px solid var(--purple)` : "2px solid #111112";
  const shadow = f.dark
    ? hovered ? "7px 7px 0 var(--purple)" : "5px 5px 0 var(--purple)"
    : hovered ? "7px 7px 0 #111112" : "5px 5px 0 #111112";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: i * 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="overflow-hidden relative"
      style={{
        background: f.dark ? "#111112" : "var(--bg-card)",
        border,
        boxShadow: shadow,
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "box-shadow 0.1s, transform 0.1s",
        minHeight: "240px",
      }}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Tag + icon row */}
        <div className="flex items-center justify-between mb-6">
          <span
            className="mono"
            style={{
              color: f.dark ? "rgba(255,255,255,0.2)" : "var(--text-dim)",
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: "2px",
              border: `1px solid ${f.dark ? "#3f3f46" : "var(--border)"}`,
              padding: "2px 6px",
            }}
          >
            {f.tag}
          </span>
          <div
            className="w-9 h-9 flex items-center justify-center"
            style={{
              background: f.dark ? "color-mix(in srgb, var(--purple) 15%, transparent)" : "color-mix(in srgb, var(--purple) 8%, transparent)",
              border: `2px solid ${f.accent}`,
            }}
          >
            <f.icon size={16} style={{ color: f.accent }} />
          </div>
        </div>

        {/* Title */}
        <h3
          className="font-bold mb-2 text-base"
          style={{ color: f.dark ? "#f4f4f5" : "var(--text)" }}
        >
          {f.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mt-auto"
          style={{ color: f.dark ? "#71717a" : "var(--text-muted)" }}
        >
          {f.description}
        </p>

        {/* Bottom tag */}
        <div
          className="mt-6 pt-4"
          style={{ borderTop: `1px solid ${f.dark ? "#3f3f46" : "#111112"}` }}
        >
          {f.href ? (
            <Link
              href={f.href}
              className="mono"
              style={{ color: f.accent, fontSize: "0.65rem", textDecoration: "none" }}
            >
              {f.cta}
            </Link>
          ) : (
            <span className="mono" style={{ color: f.accent, fontSize: "0.65rem" }}>
              {f.cta}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
