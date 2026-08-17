import type { BuildState } from "@/lib/types";
import type { SlotKey } from "@/lib/types";

const ALL_SLOTS: SlotKey[] = [
  "cpu", "gpu", "ram", "motherboard",
  "psu", "case", "ssd", "cooling",
];

/** Sum of price_pkr * qty across every filled slot. A missing qty (older
 * shapes / bare parts) is treated as 1. */
export function buildTotal(build: BuildState): number {
  return ALL_SLOTS.reduce((sum, slot) => {
    const entry = build[slot];
    if (!entry) return sum;
    const qty = entry.qty ?? 1;
    return sum + (entry.part.price_pkr ?? 0) * qty;
  }, 0);
}
