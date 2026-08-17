"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import BuildWireframe from "@/components/BuildWireframe";
import BuildCards from "@/components/BuildCards";
import BuildSummary from "@/components/BuildSummary";
import CompatibilityBanner from "@/components/CompatibilityBanner";
import { GameBenchmarksPanel } from "@/components/ui/GameBenchmarksPanel";
import { checkCompatibility } from "@/lib/compatibility";
import type { Part } from "@/lib/api";
import { getSharedBuild } from "@/lib/api";

// Keeps framer-motion (AnimatePresence + PartPickerModal's transitions) out
// of /build's initial bundle — it only loads once a slot is clicked (Perf #8).
const PartPickerModalGate = dynamic(() => import("@/components/PartPickerModalGate"), {
  ssr: false,
});


export type { SlotKey } from "@/lib/types";
import type { SlotKey } from "@/lib/types";
import type { BuildState } from "@/lib/types";
export type { BuildState } from "@/lib/types";

const EMPTY_BUILD: BuildState = {
  cpu: null, gpu: null, ram: null, motherboard: null,
  psu: null, case: null, ssd: null, cooling: null,
};

export const SLOT_LABELS: Record<SlotKey, string> = {
  cpu: "CPU", gpu: "GPU", ram: "RAM", motherboard: "Mobo",
  psu: "PSU", case: "Case", ssd: "Storage", cooling: "Cooling",
};

export const SLOT_SUB: Record<SlotKey, string> = {
  cpu: "Processor", gpu: "Graphics Card", ram: "Memory",
  motherboard: "Mainboard", ssd: "SSD / NVMe", psu: "Power Supply",
  case: "Chassis", cooling: "CPU Cooler",
};

export const SLOT_CATEGORY: Record<SlotKey, string> = {
  cpu: "cpu", gpu: "gpu", ram: "ram", motherboard: "motherboard",
  psu: "psu", case: "case", ssd: "ssd", cooling: "cooling",
};

function BuildPage() {
  const searchParams = useSearchParams();
  const [build, setBuild] = useState<BuildState>(EMPTY_BUILD);
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);

  // Depends on the actual "share" value (not just searchParams identity) so
  // that an in-app client-side navigation to a NEW /build?share=CODE — which
  // reuses this already-mounted component rather than remounting it — still
  // re-runs the resolve. The old `[]` dependency array only ever fired once,
  // on the page's first mount (H15).
  const shareCode = searchParams.get("share");
  // A share link that fails to resolve used to return silently, leaving the
  // visitor on what looks like an ordinary empty build page with no hint
  // their link was bad or the backend was down. getSharedBuild returns a
  // discriminated result precisely so that failure is expressible — this is
  // the same "a failure must never render as emptiness" rule the market page
  // follows with // SEARCH FAILED.
  const [shareFailed, setShareFailed] = useState(false);
  useEffect(() => {
    if (!shareCode) return;
    getSharedBuild(shareCode).then((result) => {
      // Set from the outcome rather than clearing synchronously at the top of
      // the effect — a synchronous setState in an effect body triggers
      // cascading renders (react-hooks/set-state-in-effect).
      setShareFailed(!result.ok);
      if (!result.ok) return;
      setBuild((prev) => {
        const next = { ...prev };
        for (const [slot, sharedPart] of Object.entries(result.data)) {
          if (!sharedPart) continue;
          next[slot as SlotKey] = { part: sharedPart, qty: sharedPart.qty ?? 1 };
        }
        return next;
      });
    });
  }, [shareCode]);

  function selectPart(part: Part) {
    if (!activeSlot) return;
    setBuild((prev) => ({
      ...prev,
      [activeSlot]: { part, qty: prev[activeSlot]?.qty ?? 1 },
    }));
    setActiveSlot(null);
  }

  function removePart(slot: SlotKey) {
    setBuild((prev) => ({ ...prev, [slot]: null }));
  }

  function setQty(slot: SlotKey, qty: number) {
    setBuild((prev) => {
      const entry = prev[slot];
      if (!entry) return prev;
      return { ...prev, [slot]: { ...entry, qty } };
    });
  }

  const issues = checkCompatibility(build);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main
        className="build-main"
        style={{
          display: "flex",
          flex: 1,
          alignItems: "flex-start",
        }}
      >
        {/* Left column — wireframe + cards + banner */}
        <div className="build-left" style={{ flex: 1, minWidth: 0 }}>
          <BuildWireframe build={build} onSlotClick={setActiveSlot} />
          <section className="build-section-list">
            <div style={{ width: "100%" }}>
              <p className="section-label mb-1">Your Build</p>
              <h2
                className="font-black mb-2"
                style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", color: "var(--text)" }}
              >
                Component List
              </h2>
              <p className="text-sm mb-9" style={{ color: "var(--text-muted)" }}>
                Click any slot to browse and select parts from the marketplace.
              </p>
              {shareFailed && (
                <div
                  style={{
                    border: "2px solid #111112",
                    boxShadow: "4px 4px 0 #111112",
                    background: "var(--purple-pale)",
                    padding: "14px 16px",
                    marginBottom: "18px",
                  }}
                >
                  <p
                    className="mono"
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "var(--purple)",
                    }}
                  >
                    {"// SHARED BUILD NOT FOUND"}
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "6px" }}>
                    That share link couldn&apos;t be resolved. It may have expired, or the
                    server is unreachable — the empty build below is not what was shared.
                  </p>
                </div>
              )}
              <BuildCards build={build} onSlotClick={setActiveSlot} onRemove={removePart} onQtyChange={setQty} />
              <CompatibilityBanner issues={issues} />
            </div>
          </section>
          <section className="build-section-bench">
            <GameBenchmarksPanel />
          </section>
        </div>

        {/* Right column — BuildSummary, sticky on desktop / inline on mobile */}
        <div className="build-summary-wrap">
          <BuildSummary build={build} />
        </div>
      </main>

      <PartPickerModalGate
        activeSlot={activeSlot}
        currentPart={activeSlot ? build[activeSlot]?.part ?? null : null}
        onSelect={selectPart}
        onClose={() => setActiveSlot(null)}
      />
    </div>
  );
}

export default function BuildPageShell() {
  return (
    <Suspense fallback={null}>
      <BuildPage />
    </Suspense>
  );
}
