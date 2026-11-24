"use client";

import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import ComicFrame from "./ComicFrame";
import PCThumb from "./PCThumb";
import { derivePrebuiltTags } from "@/lib/prebuilt-tags";
import type { Prebuilt } from "@/lib/prebuilts-api";
import { GameBenchmarksPanel } from "@/components/ui/GameBenchmarksPanel";
import { isSafeHref } from "@/lib/safe-url";

function PB_Chip({ label }: { label: string }) {
  return (
    <span className="pbsp-chip">
      <span className="skew-label-10">{label}</span>
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

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2500);
    });
  }
  const c = prebuilt.components ?? {};
  const tags = derivePrebuiltTags(c);
  // Scraped url — reject anything that isn't http(s): before it reaches href (L7).
  const buyHref = isSafeHref(prebuilt.url) ? prebuilt.url : undefined;

  const specRows = SPEC_ORDER.filter(key => c[key]);
  const scrapedDate = prebuilt.scraped_at
    ? new Date(prebuilt.scraped_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const words = prebuilt.name.trim().split(" ");
  const lastWord = words.pop();
  const restOfName = words.join(" ");

  return (
    <div className="pb-spec-wrapper">

      {/* ── HERO ── */}
      <div className="pb-spec-hero">
        {/* Left: ComicFrame thumbnail. ComicFrame's own `height` prop always
            renders as an inline pixel style, so a CSS class on this page
            can't win against it without `!important`. Bridging through a
            custom property lets the wrapper's media query pick the value
            while ComicFrame just reads whatever `--pbsp-frame-h` resolves
            to — no !important, and ComicFrame itself stays untouched. */}
        <div className="pbsp-hero-frame">
          <ComicFrame height={"var(--pbsp-frame-h)" as unknown as number} sub={prebuilt.source}>
          {prebuilt.thumbnail_url ? (
            <div className="pbsp-frame-fill">
              <img
                src={prebuilt.thumbnail_url}
                referrerPolicy="no-referrer"
                alt={prebuilt.name}
                width={400}
                height={300}
                className="pbsp-frame-img"
              />
            </div>
          ) : (
            <div className="pbsp-frame-fill">
              <PCThumb scale={1.6} />
            </div>
          )}
          </ComicFrame>
        </div>

        {/* Right: info */}
        <div className="pbsp-info">

          {/* Source */}
          <div className="pbsp-source">
            {prebuilt.source} {"//"}
          </div>

          {/* Title — max 2 lines */}
          <h1 className="pbsp-title">
            {restOfName}{restOfName ? " " : ""}
            <span className="pbsp-title-last">{lastWord}</span>
          </h1>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="pbsp-tags">
              {tags.map(t => <PB_Chip key={t} label={t} />)}
            </div>
          )}

          {/* Price + buy card */}
          <div className="pbsp-card">
            {/* Header bar */}
            <div className="pbsp-card-bar">
              <span className="pbsp-bar-label">
                ◼ PRICE · LISTED ON {prebuilt.source.toUpperCase()}
              </span>
              {scrapedDate && (
                <span className="pbsp-card-date">
                  {scrapedDate}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="pbsp-card-body">
              <div className="pbsp-price">
                {prebuilt.price_pkr
                  ? `Rs ${prebuilt.price_pkr.toLocaleString("en-PK")}`
                  : "—"}
              </div>

              <div className="pbsp-actions">
                {/* Buy Now */}
                <a
                  href={buyHref}
                  target={buyHref ? "_blank" : undefined}
                  rel={buyHref ? "noopener noreferrer" : undefined}
                  className="pbsp-buy-btn"
                >
                  <span className="skew-label-6">
                    Buy at {prebuilt.source} ↗
                  </span>
                </a>

                {/* Like */}
                <button
                  onClick={() => setLiked(l => !l)}
                  className={liked ? "pbsp-icon-btn pbsp-icon-btn--like pbsp-icon-btn--on" : "pbsp-icon-btn pbsp-icon-btn--like"}
                  aria-label="Like"
                >
                  <Heart size={18} color={liked ? "#dc2626" : "var(--text)"} fill={liked ? "#dc2626" : "none"} />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className={shareStatus === "copied" ? "pbsp-icon-btn pbsp-icon-btn--share pbsp-icon-btn--copied" : "pbsp-icon-btn pbsp-icon-btn--share"}
                  aria-label="Share"
                >
                  <Share2 size={18} color={shareStatus === "copied" ? "white" : "var(--text)"} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SPECS + SIDEBAR ── */}
      <div className="pb-spec-bottom">
        {/* Left: spec table */}
        <div>
          <div className="pbsp-kicker">
            — FULL SPEC SHEET
          </div>
          <h2 className="pbsp-sub">
            What&apos;s <span className="pbsp-sub-accent">inside.</span>
          </h2>

          <div className="pbsp-specs">
            {specRows.map(key => (
              <div key={key} className="pbsp-spec-row">
                <div className="pbsp-spec-key">
                  {SPEC_LABELS[key]}
                </div>
                <div className="pbsp-spec-val">
                  {c[key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="pbsp-side">
          {/* Benchmarks */}
          <GameBenchmarksPanel />

          {/* What's included */}
          <div className="pbsp-included">
            <div className="pbsp-included-bar">
              <span className="pbsp-bar-label">◼ WHAT&apos;S INCLUDED</span>
            </div>
            <div className="pbsp-included-list">
              {["Free assembly + cable management", "Delivery across Pakistan", "Retailer warranty applies"].map(item => (
                <div key={item} className="pbsp-included-item">
                  <span className="pbsp-included-plus">+</span>
                  <span className="pbsp-included-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
