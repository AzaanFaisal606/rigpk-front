"use client";

import { useState, useEffect } from "react";
import { Heart, Share2 } from "lucide-react";
import ComicFrame from "./ComicFrame";
import PCThumb from "./PCThumb";
import { derivePrebuiltTags } from "@/lib/prebuilt-tags";
import type { Prebuilt } from "@/lib/prebuilts-api";
import { GameBenchmarksPanel } from "@/components/ui/GameBenchmarksPanel";

const monoFont = '"JetBrains Mono", "Fira Code", monospace';

function PB_Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: monoFont,
        fontSize: "9px",
        fontWeight: 800,
        letterSpacing: "1px",
        textTransform: "uppercase",
        padding: "3px 10px",
        border: "2px solid #111112",
        boxShadow: "3px 3px 0 #111112",
        background: "#f8f8f9",
        color: "#111112",
        transform: "skewX(-10deg)",
      }}
    >
      <span style={{ display: "inline-block", transform: "skewX(10deg)" }}>{label}</span>
    </span>
  );
}

const SPEC_LABELS: Record<string, string> = {
  cpu:        "CPU",
  gpu:        "GPU",
  ram:        "RAM",
  storage:    "STORAGE",
  motherboard:"MOTHERBOARD",
  psu:        "PSU",
  case:       "CASE",
  cpu_cooler: "COOLING",
};

const SPEC_ORDER = ["cpu", "gpu", "ram", "storage", "motherboard", "psu", "case", "cpu_cooler"] as const;

interface Props {
  prebuilt: Prebuilt;
}

export default function PrebuiltSpecPage({ prebuilt }: Props) {
  const [liked, setLiked] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2500);
    });
  }
  const c = prebuilt.components ?? {};
  const tags = derivePrebuiltTags(c);

  const specRows = SPEC_ORDER.filter(key => c[key]);
  const scrapedDate = prebuilt.scraped_at
    ? new Date(prebuilt.scraped_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const words = prebuilt.name.trim().split(" ");
  const lastWord = words.pop();
  const restOfName = words.join(" ");

  return (
    <div className="pb-spec-wrapper" style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 48px 60px", overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <div className="pb-spec-hero" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "28px", alignItems: "start", marginBottom: "40px" }}>
        {/* Left: ComicFrame thumbnail */}
        <ComicFrame height={isMobile ? 260 : 460} sub={prebuilt.source}>
          {prebuilt.thumbnail_url ? (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={prebuilt.thumbnail_url}
                referrerPolicy="no-referrer"
                alt={prebuilt.name}
                style={{ maxWidth: "85%", maxHeight: "85%", width: "auto", height: "auto", objectFit: "contain", display: "block" }}
              />
            </div>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PCThumb scale={1.6} />
            </div>
          )}
        </ComicFrame>

        {/* Right: info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Eyebrow */}
          <div style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase" }}>
            — RIGPK // PRE-BUILT
          </div>

          {/* Source */}
          <div style={{ fontFamily: monoFont, fontSize: "13px", fontWeight: 700, color: "#3f3f46", marginBottom: "2px" }}>
            {prebuilt.source} //
          </div>

          {/* Title — max 2 lines */}
          <h1
            style={{
              fontFamily: monoFont,
              fontWeight: 900,
              fontSize: "clamp(1.4rem, 2.8vw, 2.8rem)",
              lineHeight: 0.95,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              color: "#111112",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {restOfName}{restOfName ? " " : ""}
            <span style={{ fontStyle: "italic" }}>{lastWord}</span>
          </h1>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {tags.map(t => <PB_Chip key={t} label={t} />)}
            </div>
          )}

          {/* Price + buy card */}
          <div
            style={{
              marginTop: "12px",
              border: "3px solid #111112",
              boxShadow: "6px 6px 0 #111112",
              background: "white",
            }}
          >
            {/* Header bar */}
            <div
              style={{
                background: "#111112",
                padding: "8px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "white", letterSpacing: "2px", textTransform: "uppercase" }}>
                ◼ PRICE · LISTED ON {prebuilt.source.toUpperCase()}
              </span>
              {scrapedDate && (
                <span style={{ fontFamily: monoFont, fontSize: "9px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                  {scrapedDate}
                </span>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "18px 20px 20px" }}>
              <div
                style={{
                  fontFamily: monoFont,
                  fontWeight: 900,
                  fontSize: isMobile ? "1.5rem" : "2.25rem",
                  color: "#7c3aed",
                  letterSpacing: "-0.02em",
                  marginBottom: isMobile ? "8px" : "12px",
                }}
              >
                {prebuilt.price_pkr
                  ? `Rs ${prebuilt.price_pkr.toLocaleString("en-PK")}`
                  : "—"}
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {/* Buy Now */}
                <a
                  href={prebuilt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: "block",
                    padding: isMobile ? "9px 10px" : "14px 18px",
                    background: "#7c3aed",
                    color: "white",
                    border: "2px solid #111112",
                    boxShadow: "4px 4px 0 #111112",
                    fontFamily: monoFont,
                    fontSize: isMobile ? "10px" : "12px",
                    fontWeight: 800,
                    letterSpacing: isMobile ? "1px" : "2px",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    textAlign: "center",
                    transform: "skewX(-6deg)",
                  }}
                >
                  <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>
                    BUY NOW @ {prebuilt.source.toUpperCase()} ↗
                  </span>
                </a>

                {/* Like */}
                <button
                  onClick={() => setLiked(l => !l)}
                  style={{
                    width: isMobile ? "38px" : "52px", height: isMobile ? "38px" : "52px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #111112", boxShadow: "4px 4px 0 #111112",
                    background: liked ? "#fef2f2" : "white", cursor: "pointer",
                    fontFamily: monoFont, fontSize: "18px",
                  }}
                  aria-label="Like"
                >
                  <Heart size={18} color={liked ? "#dc2626" : "#111112"} fill={liked ? "#dc2626" : "none"} />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  style={{
                    width: isMobile ? "38px" : "52px", height: isMobile ? "38px" : "52px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid #111112",
                    boxShadow: "4px 4px 0 #111112",
                    background: shareStatus === "copied" ? "#16a34a" : "white",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  aria-label="Share"
                >
                  <Share2 size={18} color={shareStatus === "copied" ? "white" : "#111112"} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SPECS + SIDEBAR ── */}
      <div className="pb-spec-bottom" style={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr", gap: "28px", alignItems: "start" }}>
        {/* Left: spec table */}
        <div>
          <div style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
            — FULL SPEC SHEET
          </div>
          <h2
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 900,
              fontSize: "1.875rem",
              letterSpacing: "-0.04em",
              color: "#111112",
              margin: "0 0 16px",
            }}
          >
            What&apos;s <span style={{ color: "#7c3aed", fontStyle: "italic" }}>inside.</span>
          </h2>

          <div style={{ border: "2px solid #111112", boxShadow: "6px 6px 0 #111112", background: "white" }}>
            {specRows.map((key, i) => (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr",
                  padding: "14px 18px",
                  gap: "18px",
                  alignItems: "baseline",
                  borderBottom: i < specRows.length - 1 ? "1.5px dashed #d4d4d8" : "none",
                  background: i % 2 === 0 ? "white" : "#fafafa",
                }}
              >
                <div style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "#7c3aed", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  {SPEC_LABELS[key]}
                </div>
                <div style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px", fontWeight: 700, color: "#111112" }}>
                  {c[key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Benchmarks */}
          <GameBenchmarksPanel />

          {/* What's included */}
          <div style={{ border: "2px solid #111112", boxShadow: "5px 5px 0 #111112", background: "white" }}>
            <div style={{ background: "#111112", padding: "8px 12px" }}>
              <span style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "white", letterSpacing: "2px", textTransform: "uppercase" }}>◼ WHAT&apos;S INCLUDED</span>
            </div>
            <div style={{ padding: "14px" }}>
              {["Free assembly + cable management", "Delivery across Pakistan", "Retailer warranty applies"].map((item, i, arr) => (
                <div
                  key={item}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "10px",
                    padding: "6px 0",
                    borderBottom: i < arr.length - 1 ? "1px dashed #d4d4d8" : "none",
                  }}
                >
                  <span style={{ color: "#7c3aed", fontFamily: monoFont, fontWeight: 900, fontSize: "12px", flexShrink: 0 }}>+</span>
                  <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "12px", color: "#3f3f46", lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
