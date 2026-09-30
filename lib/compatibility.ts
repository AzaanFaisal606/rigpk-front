import type { BuildState, SlotKey } from "@/lib/types";

export type IssueCategory = "SOCKET" | "DDR";

export interface CompatIssue {
  category: IssueCategory;
  /** An error is a known clash; a warning is something the specs can't settle. */
  severity: "error" | "warning";
  description: string;
}

/** The DDR generation a socket's boards take; null when boards come in both. */
export const SOCKET_DDR: Record<string, string | null> = {
  AM5:    "DDR5",
  AM4:    "DDR4",
  LGA1700: null,  // supports both DDR4 and DDR5
  LGA1851: "DDR5",
  LGA1200: "DDR4",
  LGA1151: "DDR4",
};

/**
 * The build's platform: the CPU's socket, else the motherboard's. Never
 * stored — it follows whichever of the two was picked, and the picker for the
 * other one is filtered to match, so the first pick sets it.
 */
export function buildSocket(build: BuildState): string | undefined {
  return build.cpu?.part.specs?.socket ?? build.motherboard?.part.specs?.socket;
}

/**
 * Spec filters the part picker opens with for `slot`, taken from the rest of
 * the build. A slot never filters on itself, so swapping an AM4 CPU for an
 * AM5 one still works when no board is chosen yet.
 */
export function platformFilters(build: BuildState, slot: SlotKey): Record<string, string> {
  const cpuSocket = build.cpu?.part.specs?.socket;
  const boardSocket = build.motherboard?.part.specs?.socket;
  if (slot === "cpu" && boardSocket) return { socket: boardSocket };
  if (slot === "motherboard" && cpuSocket) return { socket: cpuSocket };
  if (slot === "ram") {
    const ddr = SOCKET_DDR[cpuSocket ?? boardSocket ?? ""];
    if (ddr) return { ddr_type: ddr };
  }
  return {};
}

export function checkCompatibility(build: BuildState): CompatIssue[] {
  const issues: CompatIssue[] = [];

  const cpuSocket  = build.cpu?.part.specs?.socket;
  const moboSocket = build.motherboard?.part.specs?.socket;
  const ramDdr     = build.ram?.part.specs?.ddr_type;
  const socket     = cpuSocket ?? moboSocket;

  if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
    issues.push({
      category: "SOCKET",
      severity: "error",
      description: `CPU uses ${cpuSocket} but motherboard uses ${moboSocket}`,
    });
  }

  if (socket && SOCKET_DDR[socket] === null) {
    // Boards on this socket are DDR4 or DDR5 and the specs don't say which,
    // so it can't be called either way. Shown as soon as the platform is
    // set, since that's when the RAM choice starts to matter.
    issues.push({
      category: "DDR",
      severity: "warning",
      description: ramDdr
        ? `${socket} boards come in DDR4 and DDR5 versions. Check that your motherboard takes ${ramDdr}.`
        : `${socket} boards come in DDR4 and DDR5 versions. Pick RAM that matches your motherboard.`,
    });
  } else if (socket && socket in SOCKET_DDR && ramDdr) {
    const req = SOCKET_DDR[socket];
    if (ramDdr !== req) {
      issues.push({
        category: "DDR",
        severity: "error",
        description: `${socket} platform requires ${req} but selected RAM is ${ramDdr}`,
      });
    }
  }

  return issues;
}
