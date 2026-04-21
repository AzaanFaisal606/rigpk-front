"use client";

import { Search, Cpu, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Search,
    tag: "01",
    title: "Browse Prices",
    description:
      "Search and filter thousands of PC parts from multiple Pakistani retailers. Sort by price, source, or category.",
    accent: "#7c3aed",
  },
  {
    icon: Cpu,
    tag: "02",
    title: "Build a PC",
    description:
      "Pick parts, check compatibility, and calculate your total build cost in real time.",
    accent: "#9333ea",
    dark: true,
  },
  {
    icon: TrendingUp,
    tag: "03",
    title: "Track Prices",
    description:
      "View full price history graphs for any part. Know the best time to buy.",
    accent: "#a855f7",
  },
];

export default function Features() {
  return (
    <section
      className="rule-top px-6 py-24"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="section-label mb-2">Platform Features</p>
          <h2 className="font-bold" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", color: "var(--text)" }}>
            Everything you need
            <br />
            <span style={{ color: "var(--text-muted)" }}>to build smarter.</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="noise-card rounded-xl overflow-hidden relative"
              style={{
                background: f.dark ? "#1c1c1e" : "var(--bg-card)",
                border: `1px solid ${f.dark ? "#3f3f46" : "var(--border)"}`,
                minHeight: "240px",
              }}
            >
              {/* Top line accent */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, ${f.accent}, transparent 60%)` }}
              />

              <div className="p-6 h-full flex flex-col">
                {/* Tag + icon row */}
                <div className="flex items-center justify-between mb-6">
                  <span
                    className="mono"
                    style={{
                      color: f.dark ? "#52525b" : "var(--text-dim)",
                      fontSize: "0.65rem",
                    }}
                  >
                    {f.tag}
                  </span>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: f.dark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.08)" }}
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

                {/* Bottom coming-soon tag */}
                <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${f.dark ? "#3f3f46" : "var(--border)"}` }}>
                  <span
                    className="mono"
                    style={{ color: f.accent, fontSize: "0.65rem" }}
                  >
                    COMING SOON →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
