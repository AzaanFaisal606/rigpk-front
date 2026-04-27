"use client";

import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import ComicFrame from "./ComicFrame";
import PCThumb from "./PCThumb";
import { derivePrebuiltTags } from "@/lib/prebuilt-tags";
import type { Prebuilt } from "@/lib/prebuilts-api";

const monoFont = '"JetBrains Mono", "Fira Code", monospace';

function PB_Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: monoFont,
        fontSize: "10px",
        fontWeight: 800,
        letterSpacing: "1px",
        textTransform: "uppercase",
        padding: "3px 9px",
        border: "2px solid #111112",
        boxShadow: "2px 2px 0 #111112",
        background: "#7c3aed",
        color: "white",
        transform: "skewX(-8deg)",
      }}
    >
      <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>{label}</span>
    </span>
  );
}

const SPEC_LABELS: Record<string, string> = {
  cpu:        "CPU",
  gpu:        "GPU",
  ram:        "RAM",
  storage:    "STORAGE",
  motherboard:"MOBO",
  psu:        "PSU",
  case:       "CASE",
  cpu_cooler: "COOLER",
};

const SPEC_ORDER = ["cpu", "gpu", "ram", "storage", "motherboard", "psu", "case", "cpu_cooler"] as const;

interface Props {
  prebuilt: Prebuilt;
}

export default function PrebuiltSpecPage({ prebuilt }: Props) {
  const [liked, setLiked] = useState(false);
  const c = prebuilt.components ?? {};
  const tags = derivePrebuiltTags(c);

  const specRows = SPEC_ORDER.filter(key => c[key]);
  const scrapedDate = prebuilt.scraped_at
    ? new Date(prebuilt.scraped_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  // Italic last word of title
  const words = prebuilt.name.trim().split(" ");
  const lastWord = words.pop();
  const restOfName = words.join(" ");

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "32px 24px" }}>

      {/* Hero — 2-col */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: "32px",
          alignItems: "start",
          marginBottom: "40px",
        }}
      >
        {/* Left: ComicFrame thumbnail */}
        <ComicFrame height={460} sub={prebuilt.source}>
          {prebuilt.thumbnail_url ? (
            <img
              src={prebuilt.thumbnail_url}
              referrerPolicy="no-referrer"
              alt={prebuilt.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PCThumb scale={1.6} />
            </div>
          )}
        </ComicFrame>

        {/* Right: info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Eyebrow */}
          <div style={{ fontFamily: monoFont, fontSize: "11px", fontWeight: 800, color: "#71717a", letterSpacing: "2px", textTransform: "uppercase" }}>
            — RIGPK // PRE-BUILT
          </div>

          {/* Source */}
          <div style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 700, color: "#a1a1aa", letterSpacing: "1px", textTransform: "uppercase" }}>
            {prebuilt.source}
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: monoFont,
              fontWeight: 900,
              fontSize: "clamp(2rem, 4vw, 4rem)",
              lineHeight: 1.05,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              color: "#111112",
              margin: 0,
            }}
          >
            {restOfName}{restOfName ? " " : ""}
            <span style={{ fontStyle: "italic" }}>{lastWord}</span>
          </h1>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {tags.map(t => <PB_Chip key={t} label={t} />)}
            </div>
          )}

          {/* Price card */}
          <div
            style={{
              border: "2px solid #111112",
              boxShadow: "6px 6px 0 #111112",
              overflow: "hidden",
              marginTop: "8px",
            }}
          >
            {/* Header bar */}
            <div
              style={{
                background: "#111112",
                padding: "10px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "white", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                ◼ PRICE · LISTED ON {prebuilt.source.toUpperCase()}
              </span>
              {scrapedDate && (
                <span style={{ fontFamily: monoFont, fontSize: "9px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                  {scrapedDate}
                </span>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  fontFamily: monoFont,
                  fontWeight: 900,
                  fontSize: "2rem",
                  color: "#7c3aed",
                  letterSpacing: "-0.02em",
                }}
              >
                {prebuilt.price_pkr
                  ? `Rs ${prebuilt.price_pkr.toLocaleString("en-PK")}`
                  : "—"}
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Buy Now */}
                <a
                  href={prebuilt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "10px 22px",
                    background: "#7c3aed",
                    color: "white",
                    border: "2px solid #111112",
                    boxShadow: "3px 3px 0 #111112",
                    fontFamily: monoFont,
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    transform: "skewX(-8deg)",
                  }}
                >
                  <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>
                    BUY NOW →
                  </span>
                </a>

                {/* Like button */}
                <button
                  onClick={() => setLiked(l => !l)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    border: "2px solid #111112",
                    boxShadow: "2px 2px 0 #111112",
                    background: liked ? "#fef2f2" : "white",
                    cursor: "pointer",
                  }}
                  aria-label="Like"
                >
                  <Heart size={16} color={liked ? "#dc2626" : "#111112"} fill={liked ? "#dc2626" : "none"} />
                </button>

                {/* Share button */}
                <button
                  onClick={() => {}}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "38px",
                    height: "38px",
                    border: "2px solid #111112",
                    boxShadow: "2px 2px 0 #111112",
                    background: "white",
                    cursor: "pointer",
                  }}
                  aria-label="Share"
                >
                  <Share2 size={16} color="#111112" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spec table section — 2-col */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 0.9fr",
          gap: "28px",
          alignItems: "start",
        }}
      >
        {/* Left: Full spec sheet */}
        <div>
          <div style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "#a1a1aa", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>
            COMPONENTS
          </div>
          <h2 style={{ fontFamily: monoFont, fontWeight: 900, fontSize: "1.35rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#111112", margin: "0 0 16px" }}>
            What&apos;s inside.
          </h2>

          <div style={{ border: "2px solid #111112", boxShadow: "6px 6px 0 #111112", overflow: "hidden" }}>
            {/* Header bar */}
            <div style={{ background: "#111112", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: monoFont, fontSize: "11px", fontWeight: 800, color: "white", letterSpacing: "2px" }}>◼ FULL SPEC SHEET</span>
              <span style={{ fontFamily: monoFont, fontSize: "10px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{specRows.length} COMPONENTS</span>
            </div>

            {/* Rows */}
            {specRows.map((key, i) => (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  borderBottom: i < specRows.length - 1 ? "1px dashed #d4d4d8" : "none",
                  background: i % 2 === 0 ? "white" : "#fafafa",
                }}
              >
                <div style={{ padding: "12px 14px", fontFamily: monoFont, fontSize: "11px", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.5px", borderRight: "1px solid #e4e4e7" }}>
                  {SPEC_LABELS[key]}
                </div>
                <div style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 700, color: "#111112" }}>
                  {c[key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Benchmarks placeholder */}
          <div style={{ border: "2px solid #111112", boxShadow: "4px 4px 0 #111112", overflow: "hidden" }}>
            <div style={{ background: "#7c3aed", padding: "10px 16px" }}>
              <span style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "white", letterSpacing: "1.5px", textTransform: "uppercase" }}>◼ GAME BENCHMARKS</span>
            </div>
            <div style={{ padding: "20px 16px" }}>
              <p style={{ fontFamily: monoFont, fontSize: "11px", color: "#a1a1aa", margin: 0, lineHeight: 1.7 }}>
                // Game performance data coming soon.{" "}
                <br />We&apos;re working on it.
              </p>
            </div>
          </div>

          {/* What's Included */}
          <div style={{ border: "2px solid #111112", boxShadow: "4px 4px 0 #111112", overflow: "hidden" }}>
            <div style={{ background: "#111112", padding: "10px 16px" }}>
              <span style={{ fontFamily: monoFont, fontSize: "10px", fontWeight: 800, color: "white", letterSpacing: "1.5px", textTransform: "uppercase" }}>◼ WHAT&apos;S INCLUDED</span>
            </div>
            <ul style={{ padding: "16px", margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Assembly + cable management", "Delivery across Pakistan", "Retailer warranty applies"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ fontFamily: monoFont, fontSize: "11px", fontWeight: 800, color: "#7c3aed", flexShrink: 0 }}>◼</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#111112" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
