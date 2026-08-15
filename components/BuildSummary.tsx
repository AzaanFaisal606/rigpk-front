"use client";

import { useState } from "react";
import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS } from "@/app/build/page";
import { shareBuild } from "@/lib/api";

const ALL_SLOTS: SlotKey[] = [
  "cpu", "gpu", "ram", "motherboard",
  "psu", "case", "ssd", "cooling",
];

interface Props {
  build: BuildState;
}

export default function BuildSummary({ build }: Props) {
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "copied" | "error">("idle");

  const total = ALL_SLOTS.reduce((sum, slot) => {
    return sum + (build[slot]?.price_pkr ?? 0);
  }, 0);

  function copyBuild() {
    const lines = ALL_SLOTS.map((slot) => {
      const part = build[slot];
      const price = part?.price_pkr != null
        ? "Rs " + part.price_pkr.toLocaleString("en-PK")
        : "—";
      return `${SLOT_LABELS[slot]}: ${part?.name ?? "Not selected"} (${price})`;
    });
    lines.push(`\nTotal: Rs ${total.toLocaleString("en-PK")}`);
    navigator.clipboard.writeText(lines.join("\n"));
  }

  async function handleShare() {
    setShareStatus("loading");
    const ids: Partial<Record<SlotKey, number>> = {};
    for (const slot of ALL_SLOTS) {
      if (build[slot] !== null) {
        ids[slot] = build[slot]!.id;
      }
    }
    const result = await shareBuild(ids);
    if (!result) {
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 3000);
      return;
    }
    await navigator.clipboard.writeText(
      `${window.location.origin}/build?share=${result.code}`
    );
    setShareStatus("copied");
    setTimeout(() => setShareStatus("idle"), 3000);
  }

  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        border: "2px solid #111112",
        background: "var(--bg-card)",
        boxShadow: "5px 5px 0 #111112",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#111112",
          color: "white",
          padding: "12px 16px",
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily: "var(--mono)",
        }}
      >
        Build Summary
      </div>

      {/* Rows */}
      <div style={{ padding: "16px" }}>
        {ALL_SLOTS.map((slot) => {
          const part = build[slot];
          return (
            <div
              key={slot}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "7px 0",
                borderBottom: "1px solid var(--border)",
                gap: "8px",
              }}
            >
              <span
                className="mono"
                style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0 }}
              >
                {SLOT_LABELS[slot]}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: part?.price_pkr != null ? "var(--text-2)" : "var(--text-dim)",
                  textAlign: "right",
                }}
              >
                {part?.price_pkr != null
                  ? "Rs " + part.price_pkr.toLocaleString("en-PK")
                  : "—"}
              </span>
            </div>
          );
        })}

        {/* Total */}
        <div
          style={{
            marginTop: "14px",
            paddingTop: "14px",
            borderTop: "2px solid #111112",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            className="mono"
            style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}
          >
            Total
          </span>
          <span
            className="mono"
            style={{ fontSize: "18px", fontWeight: 900, color: "var(--purple)" }}
          >
            Rs&nbsp;{total.toLocaleString("en-PK")}
          </span>
        </div>

        {/* Copy button */}
        <button
          onClick={copyBuild}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "10px",
            background: "var(--purple)",
            color: "white",
            border: "2px solid #111112",
            boxShadow: "3px 3px 0 #111112",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: "pointer",
            transform: "skewX(-6deg)",
            fontFamily: "var(--mono)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--purple-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--purple)"; }}
        >
          Copy Build List
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          disabled={shareStatus === "loading"}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "10px",
            background: shareStatus === "copied" ? "#16a34a" : shareStatus === "error" ? "#dc2626" : "white",
            color: shareStatus === "idle" ? "#111112" : "white",
            border: "2px solid #111112",
            boxShadow: "3px 3px 0 #111112",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: shareStatus === "loading" ? "not-allowed" : "pointer",
            transform: "skewX(-6deg)",
            fontFamily: "var(--mono)",
            opacity: shareStatus === "loading" ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (shareStatus === "idle") (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--purple) 6%, transparent)";
          }}
          onMouseLeave={(e) => {
            if (shareStatus === "idle") (e.currentTarget as HTMLButtonElement).style.background = "white";
          }}
        >
          {shareStatus === "idle" && "Share Build"}
          {shareStatus === "loading" && "Sharing…"}
          {shareStatus === "copied" && "Link Copied!"}
          {shareStatus === "error" && "Error — Retry"}
        </button>
      </div>
    </div>
  );
}
