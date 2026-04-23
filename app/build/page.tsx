"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import BuildWireframe from "@/components/BuildWireframe";
import BuildCards from "@/components/BuildCards";
import BuildSummary from "@/components/BuildSummary";
import PartPickerModal from "@/components/PartPickerModal";
import CompatibilityBanner from "@/components/CompatibilityBanner";
import { checkCompatibility } from "@/lib/compatibility";
import type { Part } from "@/lib/api";
import { getSharedBuild } from "@/lib/api";


export type { SlotKey } from "@/lib/types";
import type { SlotKey } from "@/lib/types";

export type BuildState = Record<SlotKey, Part | null>;

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flex: 1,
          alignItems: "flex-start",
          gap: isMobile ? 0 : "24px",
          padding: isMobile ? "0" : "0 16px 0 0",
        }}
      >
        {/* Left column — wireframe + cards + banner */}
        <div style={{ flex: 1, minWidth: 0, width: isMobile ? "100%" : "auto" }}>
          <BuildWireframe build={build} onSlotClick={setActiveSlot} />
          <section style={{ padding: isMobile ? "32px 24px 48px" : "32px 32px 64px" }}>
            <div style={{ width: isMobile ? "100%" : "85%" }}>
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
        </div>

        {/* Right column — sticky BuildSummary */}
        {!isMobile && (
          <div
            style={{
              position: "sticky",
              top: "72px",
              width: "320px",
              flexShrink: 0,
              marginTop: "127px",
            }}
          >
            <BuildSummary build={build} />
          </div>
        )}
        {isMobile && (
          <div style={{ padding: "0 24px 48px", width: "100%" }}>
            <BuildSummary build={build} />
          </div>
        )}
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
