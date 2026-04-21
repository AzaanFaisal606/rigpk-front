"use client";

import { ExternalLink, Database } from "lucide-react";
import { motion } from "framer-motion";
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
      className="rule-top px-6 py-16"
      style={{ background: "var(--bg-section)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label mb-1">Data Sources</p>
            <h2 className="font-bold text-xl" style={{ color: "var(--text)" }}>
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

        {/* Store cards — spec-sheet style */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-5 md:overflow-visible">
          {STORES.map((store, i) => {
            const count = stats?.by_source[store.key];
            return (
              <motion.a
                key={store.key}
                href={`https://${store.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="noise-card flex-shrink-0 w-44 md:w-auto rounded-lg overflow-hidden group no-underline"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Top accent stripe */}
                <div
                  className="h-0.5 w-full"
                  style={{ background: "linear-gradient(90deg, #7c3aed, transparent)" }}
                />

                <div className="p-4">
                  {/* Tag */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="mono px-1.5 py-0.5 rounded-sm"
                      style={{
                        fontSize: "0.6rem",
                        color: "#7c3aed",
                        background: "rgba(124,58,237,0.08)",
                        border: "1px solid rgba(124,58,237,0.16)",
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
                  <div
                    className="pt-2.5"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    {count !== undefined ? (
                      <span className="font-bold mono" style={{ color: "var(--text-2)", fontSize: "0.95rem" }}>
                        {count.toLocaleString()}
                        <span className="font-normal ml-1" style={{ color: "var(--text-dim)", fontSize: "0.68rem" }}>
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
          })}
        </div>
      </div>
    </section>
  );
}
