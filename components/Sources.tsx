"use client";

import { ExternalLink, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { type Stats } from "@/lib/api";

const STORES = [
  { key: "czone.com.pk",       name: "CZone",           domain: "czone.com.pk",       tag: "FLAGSHIP" },
  { key: "zahcomputers.pk",    name: "Zah Computers",   domain: "zahcomputers.pk",    tag: "VERIFIED" },
  { key: "amdhouse.pk",        name: "AMD House",        domain: "amdhouse.pk",        tag: "VERIFIED" },
  { key: "rbtechngames.com",   name: "RB Tech & Games",  domain: "rbtechngames.com",   tag: "ACTIVE" },
  { key: "junaidtech.pk",      name: "Junaid Tech",      domain: "junaidtech.pk",      tag: "ACTIVE" },
];

interface SourcesProps {
  stats: Stats | null;
}

export default function Sources({ stats }: SourcesProps) {
  const total = stats?.total_parts ?? 0;

  return (
    <section
      className="px-6 py-16"
      style={{ background: "var(--bg)", borderTop: "2px solid #111112" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label mb-1">Data Sources</p>
            <h2
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontWeight: 900,
                fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text)",
              }}
            >
              Sourced from {STORES.length} retailers
            </h2>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 mono" style={{ color: "var(--text-dim)" }}>
              <Database size={12} />
              <span>{total.toLocaleString()} total parts</span>
            </div>
          )}
        </div>

        {/* Store cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-5 md:overflow-visible">
          {STORES.map((store, i) => {
            const count = stats?.by_source[store.key];
            return (
              <StoreCard key={store.key} store={store} count={count} i={i} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StoreCard({
  store,
  count,
  i,
}: {
  store: { key: string; name: string; domain: string; tag: string };
  count: number | undefined;
  i: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={`https://${store.domain}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: i * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 w-44 md:w-auto overflow-hidden group no-underline"
      style={{
        background: "var(--bg-card)",
        borderTop: "3px solid #7c3aed",
        borderRight: "2px solid #111112",
        borderBottom: "2px solid #111112",
        borderLeft: "2px solid #111112",
        boxShadow: hovered ? "6px 6px 0 #111112" : "4px 4px 0 #111112",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "box-shadow 0.1s, transform 0.1s",
      }}
    >
      <div className="p-4">
        {/* Tag */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="mono px-1.5 py-0.5"
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "#7c3aed",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.22)",
            }}
          >
            {store.tag}
          </span>
          <ExternalLink
            size={11}
            style={{ color: "var(--text-dim)" }}
            className="group-hover:text-purple-600 transition-colors"
          />
        </div>

        {/* Name */}
        <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>
          {store.name}
        </p>

        {/* Domain */}
        <p className="mono mb-3" style={{ color: "var(--text-dim)" }}>
          {store.domain}
        </p>

        {/* Parts count */}
        <div className="pt-2.5" style={{ borderTop: "1px solid #111112" }}>
          {count !== undefined ? (
            <span
              className="mono"
              style={{ color: "var(--text-2)", fontSize: "1.05rem", fontWeight: 900 }}
            >
              {count.toLocaleString()}
              <span
                className="font-normal ml-1"
                style={{ color: "var(--text-dim)", fontSize: "0.68rem" }}
              >
                PARTS
              </span>
            </span>
          ) : (
            <span className="mono" style={{ color: "var(--text-dim)" }}>— SYNCING</span>
          )}
        </div>
      </div>
    </motion.a>
  );
}
