"use client";

import { AnimatePresence } from "framer-motion";
import PartPickerModal from "@/components/PartPickerModal";
import type { SlotKey } from "@/lib/types";
import type { Part } from "@/lib/api";

interface Props {
  activeSlot: SlotKey | null;
  currentPart: Part | null;
  onSelect: (part: Part) => void;
  onClose: () => void;
}

// Isolates every framer-motion usage the /build route needs (AnimatePresence's
// exit animation + PartPickerModal's mount/exit transitions) behind one lazy
// chunk. `app/build/page.tsx` loads this via `next/dynamic({ ssr: false })` so
// the modal's JS — and framer-motion itself — never ships in the initial
// /build bundle, only fetching once a slot is actually clicked (Perf #8).
export default function PartPickerModalGate({ activeSlot, currentPart, onSelect, onClose }: Props) {
  return (
    <AnimatePresence>
      {activeSlot && (
        <PartPickerModal
          slot={activeSlot}
          currentPart={currentPart}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
    </AnimatePresence>
  );
}
