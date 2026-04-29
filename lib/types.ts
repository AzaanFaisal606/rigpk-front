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

export type BuildState = Record<SlotKey, Part | null>;
