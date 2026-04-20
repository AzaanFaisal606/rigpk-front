"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BuildWireframe from "@/components/BuildWireframe";
import BuildCards from "@/components/BuildCards";
import BuildSummary from "@/components/BuildSummary";
import PartPickerModal from "@/components/PartPickerModal";
import type { Part } from "@/lib/api";

export type SlotKey =
  | "cpu" | "gpu" | "ram" | "motherboard"
  | "psu" | "case" | "ssd" | "cooling";

export type BuildState = Record<SlotKey, Part | null>;

const EMPTY_BUILD: BuildState = {
  cpu: null, gpu: null, ram: null, motherboard: null,
  psu: null, case: null, ssd: null, cooling: null,
};

export const SLOT_LABELS: Record<SlotKey, string> = {
  cpu: "CPU", gpu: "GPU", ram: "RAM", motherboard: "Mobo",
  psu: "PSU", case: "Case", ssd: "SSD", cooling: "Cooling",
};

export const SLOT_CATEGORY: Record<SlotKey, string> = {
  cpu: "cpu", gpu: "gpu", ram: "ram", motherboard: "motherboard",
  psu: "psu", case: "case", ssd: "ssd", cooling: "cooling",
};

export default function BuildPage() {
  const [build, setBuild] = useState<BuildState>(EMPTY_BUILD);
  const [activeSlot, setActiveSlot] = useState<SlotKey | null>(null);

  function selectPart(part: Part) {
    if (!activeSlot) return;
    setBuild((prev) => ({ ...prev, [activeSlot]: part }));
    setActiveSlot(null);
  }

  function removePart(slot: SlotKey) {
    setBuild((prev) => ({ ...prev, [slot]: null }));
  }

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
          <div className="flex gap-7 items-start">
            <BuildCards build={build} onSlotClick={setActiveSlot} onRemove={removePart} />
            <BuildSummary build={build} />
          </div>
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
