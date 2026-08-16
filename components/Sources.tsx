"use client";

import { ExternalLink, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { type Stats } from "@/lib/api";
import { monoFont } from "@/lib/tokens";

const STORES = [
  { key: "czone.com.pk",       name: "CZone",           domain: "czone.com.pk",       tag: "FLAGSHIP" },
  { key: "zahcomputers.pk",    name: "Zah Computers",   domain: "zahcomputers.pk",    tag: "VERIFIED" },
  { key: "amdhouse.pk",        name: "AMD House",       domain: "amdhouse.pk",        tag: "VERIFIED" },
  { key: "rbtechngames.com",   name: "RB Tech & Games", domain: "rbtechngames.com",   tag: "ACTIVE" },
  { key: "junaidtech.pk",      name: "Junaid Tech",     domain: "junaidtech.pk",      tag: "ACTIVE" },
  { key: "techarc.pk",         name: "Tech Arc",        domain: "techarc.pk",         tag: "ACTIVE" },
  { key: "pakbyte.pk",         name: "PakByte",         domain: "www.pakbyte.pk",     tag: "ACTIVE" },
  { key: "redtech.pk",         name: "Red Tech",        domain: "redtech.pk",         tag: "NEW" },
  { key: "techmatched.pk",     name: "TechMatched",     domain: "techmatched.pk",     tag: "NEW" },
];

interface SourcesProps {
  stats: Stats | null;
}

export default function Sources({ stats }: SourcesProps) {
  const total = stats?.total_parts ?? 0;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);   // 0..1
  const [thumbWidth, setThumbWidth] = useState(1);           // 0..1 — ratio of visible viewport
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{ startX: number; startScrollLeft: number; trackWidth: number; thumbWidthPx: number } | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const ratio = el.clientWidth / el.scrollWidth;
      setIsOverflowing(max > 1);
      setThumbWidth(Math.min(1, Math.max(0.15, ratio)));
      setScrollProgress(max > 0 ? el.scrollLeft / max : 0);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Thumb position: scroll progress maps into track minus thumb width
  const thumbLeft = scrollProgress * (1 - thumbWidth) * 100;

  const scrollContainerToProgress = (progress: number, smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const clamped = Math.max(0, Math.min(1, progress));
    el.scrollTo({ left: clamped * max, behavior: smooth ? "smooth" : "auto" });
  };

  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // synthetic pointer events (e.g. devtools/tests) lack a real pointer id; ignore
    }
    setIsDragging(true);
    const trackRect = track.getBoundingClientRect();
    dragStateRef.current = {
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      trackWidth: trackRect.width,
      thumbWidthPx: thumbWidth * trackRect.width,
    };
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const { startX, startScrollLeft, trackWidth, thumbWidthPx } = dragStateRef.current;
    const travel = trackWidth - thumbWidthPx;
    if (travel <= 0) return;
    const deltaX = e.clientX - startX;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollLeft = Math.max(0, Math.min(max, startScrollLeft + (deltaX / travel) * max));
  };

  const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore: capture may not have been set (synthetic events)
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current) return;
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const target = (clickX - (thumbWidth * rect.width) / 2) / (rect.width - thumbWidth * rect.width);
    scrollContainerToProgress(target, true);
  };

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
                fontFamily: monoFont,
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

        {/* Store cards — always horizontal-scroll on all viewports */}
        <div
          ref={scrollRef}
          id="sources-cards"
          className="flex gap-3 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {STORES.map((store, i) => {
            const count = stats?.by_source[store.key];
            // Staleness comes from the backend's last recorded scrape outcome,
            // so a retailer flags itself when a scrape fails and clears itself
            // when one succeeds — nothing to update here by hand.
            const stale = stats?.sources?.[store.key]?.stale ?? false;
            return (
              <StoreCard key={store.key} store={store} count={count} stale={stale} i={i} />
            );
          })}
        </div>

        {/* Scroll indicator — interactive scrollbar (click track, drag thumb) */}
        {isOverflowing && (
          <div className="mt-4 flex items-center gap-3">
            <div
              ref={trackRef}
              role="scrollbar"
              tabIndex={0}
              aria-controls="sources-cards"
              aria-label="Scroll retailer cards"
              aria-orientation="horizontal"
              aria-valuenow={Math.round(scrollProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              onPointerDown={handleTrackPointerDown}
              onKeyDown={(e) => {
                const step = 0.1;
                if (e.key === "ArrowRight") { e.preventDefault(); scrollContainerToProgress(scrollProgress + step, true); }
                if (e.key === "ArrowLeft")  { e.preventDefault(); scrollContainerToProgress(scrollProgress - step, true); }
                if (e.key === "Home")       { e.preventDefault(); scrollContainerToProgress(0, true); }
                if (e.key === "End")        { e.preventDefault(); scrollContainerToProgress(1, true); }
              }}
              style={{
                position: "relative",
                flex: 1,
                height: 10,
                background: "var(--bg-card)",
                border: "1.5px solid #111112",
                boxShadow: "2px 2px 0 #111112",
                cursor: "pointer",
                touchAction: "none",
              }}
            >
              <div
                onPointerDown={handleThumbPointerDown}
                onPointerMove={handleThumbPointerMove}
                onPointerUp={handleThumbPointerUp}
                onPointerCancel={handleThumbPointerUp}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${thumbLeft}%`,
                  width: `${thumbWidth * 100}%`,
                  background: "var(--purple)",
                  borderRight: "1.5px solid #111112",
                  transition: isDragging ? "none" : "left 0.08s linear",
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
              />
            </div>
            <span
              className="mono"
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
                whiteSpace: "nowrap",
              }}
            >
              Scroll →
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function StoreCard({
  store,
  count,
  stale,
  i,
}: {
  store: { key: string; name: string; domain: string; tag: string };
  count: number | undefined;
  stale: boolean;
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
      className="flex-shrink-0 w-44 overflow-hidden group no-underline"
      style={{
        position: "relative",
        background: "var(--bg-card)",
        borderTop: "3px solid var(--purple)",
        borderRight: "2px solid #111112",
        borderBottom: "2px solid #111112",
        borderLeft: "2px solid #111112",
        boxShadow: hovered ? "6px 6px 0 #111112" : "4px 4px 0 #111112",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "box-shadow 0.1s, transform 0.1s",
      }}
    >
      {/* Stale ribbon — diagonal red corner flag */}
      {stale && (
        <div
          aria-label="data is stale"
          className="mono"
          style={{
            position: "absolute",
            top: 13,
            right: -30,
            width: 110,
            transform: "rotate(45deg)",
            transformOrigin: "center",
            background: "#dc2626",
            color: "#fff",
            textAlign: "center",
            fontSize: "0.55rem",
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            padding: "2px 0",
            borderTop: "1.5px solid #111112",
            borderBottom: "1.5px solid #111112",
            boxShadow: "0 1px 0 #111112",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          Stale
        </div>
      )}

      <div className="p-4">
        {/* Tag */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="mono px-1.5 py-0.5"
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color: "var(--purple)",
              background: "color-mix(in srgb, var(--purple) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--purple) 22%, transparent)",
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
