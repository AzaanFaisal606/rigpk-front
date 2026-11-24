"use client";

import { useState } from "react";
import type { BuildState, SlotKey } from "@/app/build/page";
import { SLOT_LABELS } from "@/app/build/page";
import { shareBuild } from "@/lib/api";
import type { ShareSlotValue } from "@/lib/api";
import { buildTotal } from "@/lib/build-total";

const ALL_SLOTS: SlotKey[] = [
  "cpu", "gpu", "ram", "motherboard",
  "psu", "case", "ssd", "cooling",
];

interface Props {
  build: BuildState;
}

export default function BuildSummary({ build }: Props) {
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "copied" | "error">("idle");

  const total = buildTotal(build);

  function copyBuild() {
    const lines = ALL_SLOTS.map((slot) => {
      const entry = build[slot];
      const part = entry?.part;
      const qty = entry?.qty ?? 1;
      const price = part?.price_pkr != null
        ? "Rs " + (part.price_pkr * qty).toLocaleString("en-PK")
        : "—";
      const qtyLabel = entry && qty > 1 ? ` x${qty}` : "";
      return `${SLOT_LABELS[slot]}: ${part?.name ?? "Not selected"}${qtyLabel} (${price})`;
    });
    lines.push(`\nTotal: Rs ${total.toLocaleString("en-PK")}`);
    navigator.clipboard.writeText(lines.join("\n"));
  }

  async function handleShare() {
    setShareStatus("loading");
    const payload: Partial<Record<SlotKey, ShareSlotValue>> = {};
    for (const slot of ALL_SLOTS) {
      const entry = build[slot];
      if (entry) {
        payload[slot] = { id: entry.part.id, qty: entry.qty };
      }
    }
    const result = await shareBuild(payload);
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
    <div className="build-summary">
      {/* Header */}
      <div className="build-summary-head">
        Build Summary
      </div>

      {/* Rows */}
      <div className="build-summary-body">
        {ALL_SLOTS.map((slot) => {
          const entry = build[slot];
          const part = entry?.part;
          const qty = entry?.qty ?? 1;
          // is_active / price_at_share only exist on a part resolved from a
          // shared-build code (see SharedPart) — a freshly picked part has
          // neither, so these checks are no-ops outside that path.
          const isDelisted = part != null && (
            (part as { is_active?: boolean }).is_active === false || part.price_pkr == null
          );
          const priceAtShare = (part as { price_at_share?: number | null } | undefined)?.price_at_share;
          const priceChanged =
            priceAtShare != null && part?.price_pkr != null && priceAtShare !== part.price_pkr;
          return (
            <div
              key={slot}
              className="build-summary-row"
            >
              <span className="mono build-summary-slot">
                {SLOT_LABELS[slot]}{entry && qty > 1 ? ` x${qty}` : ""}
              </span>
              <span className="build-summary-values">
                {isDelisted && (
                  <span className="mono build-summary-unavailable">
                    Unavailable
                  </span>
                )}
                {priceChanged ? (
                  <span className="mono build-summary-price build-summary-price--changed">
                    {`shared at Rs ${(priceAtShare! * qty).toLocaleString("en-PK")} · now Rs ${(part!.price_pkr! * qty).toLocaleString("en-PK")}`}
                  </span>
                ) : (
                  <span className={`mono build-summary-price${part?.price_pkr != null ? "" : " build-summary-price--none"}`}>
                    {part?.price_pkr != null
                      ? "Rs " + (part.price_pkr * qty).toLocaleString("en-PK")
                      : "—"}
                  </span>
                )}
              </span>
            </div>
          );
        })}

        {/* Total */}
        <div className="build-summary-total">
          <span className="mono build-summary-total-label">
            Total
          </span>
          <span className="mono build-summary-total-value">
            Rs&nbsp;{total.toLocaleString("en-PK")}
          </span>
        </div>

        {/* Copy button */}
        <button
          onClick={copyBuild}
          className="build-summary-btn build-summary-copy"
        >
          <span className="skew-label-6">Copy build list</span>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          disabled={shareStatus === "loading"}
          className={`build-summary-btn build-summary-share build-summary-share--${shareStatus}`}
        >
          <span className="skew-label-6">
            {shareStatus === "idle" && "Share build"}
            {shareStatus === "loading" && "Sharing…"}
            {shareStatus === "copied" && "Link copied!"}
            {shareStatus === "error" && "Couldn't share. Retry"}
          </span>
        </button>
      </div>
    </div>
  );
}
