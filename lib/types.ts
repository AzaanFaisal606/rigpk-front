import type { Part } from "@/lib/api";

export type SlotKey =
  | "cpu"
  | "gpu"
  | "ram"
  | "motherboard"
  | "psu"
  | "case"
  | "ssd"
  | "cooling";

export interface BuildSlot {
  part: Part;
  qty: number;
}

export type BuildState = Record<SlotKey, BuildSlot | null>;

/** Slots the qty stepper is shown on — matches the server's understanding
 * of what makes sense to buy more than one of. */
export const QTY_ELIGIBLE_SLOTS: readonly SlotKey[] = ["ram", "ssd"];
