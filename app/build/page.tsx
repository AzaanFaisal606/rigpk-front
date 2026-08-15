"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BuildWireframe from "@/components/BuildWireframe";
import BuildCards from "@/components/BuildCards";
import BuildSummary from "@/components/BuildSummary";
import PartPickerModal from "@/components/PartPickerModal";
import CompatibilityBanner from "@/components/CompatibilityBanner";
import { GameBenchmarksPanel } from "@/components/ui/GameBenchmarksPanel";
import { checkCompatibility } from "@/lib/compatibility";
import type { Part } from "@/lib/api";
import { getSharedBuild } from "@/lib/api";


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

  useEffect(() => {
    const code = searchParams.get("share");
    if (!code) return;
    getSharedBuild(code).then((sharedBuild) => {
      if (!sharedBuild) return;
      setBuild((prev) => ({ ...prev, ...sharedBuild }));
    });
  }, []);

  function selectPart(part: Part) {
    if (!activeSlot) return;
    setBuild((prev) => ({ ...prev, [activeSlot]: part }));
    setActiveSlot(null);
  }

  function removePart(slot: SlotKey) {
    setBuild((prev) => ({ ...prev, [slot]: null }));
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
              <BuildCards build={build} onSlotClick={setActiveSlot} onRemove={removePart} />
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

      {activeSlot && (
        <PartPickerModal
          slot={activeSlot}
          currentPart={build[activeSlot]}
          onSelect={selectPart}
          onClose={() => setActiveSlot(null)}
        />
      )}
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
