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
      <main className="flex flex-col flex-1">
        <BuildWireframe build={build} onSlotClick={setActiveSlot} />
        <section className="max-w-[1200px] mx-auto w-full px-8 py-16">
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
          <div
            className="flex gap-7 items-start"
            style={{ flexDirection: isMobile ? "column" : "row" }}
          >
            <BuildCards build={build} onSlotClick={setActiveSlot} onRemove={removePart} />
            <BuildSummary build={build} />
          </div>
          <CompatibilityBanner issues={issues} />
        </section>
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
