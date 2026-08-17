import type { BuildState } from "@/lib/types";

export type IssueCategory = "SOCKET" | "DDR";

export interface CompatIssue {
  category: IssueCategory;
  description: string;
}

const SOCKET_DDR: Record<string, string | null> = {
  AM5:    "DDR5",
  AM4:    "DDR4",
  LGA1700: null,  // supports both DDR4 and DDR5
  LGA1851: "DDR5",
  LGA1200: "DDR4",
  LGA1151: "DDR4",
};

export function checkCompatibility(build: BuildState): CompatIssue[] {
  const issues: CompatIssue[] = [];

  const cpuSocket  = build.cpu?.part.specs?.socket;
  const moboSocket = build.motherboard?.part.specs?.socket;
  const ramDdr     = build.ram?.part.specs?.ddr_type;

  if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
    issues.push({
      category: "SOCKET",
      description: `CPU uses ${cpuSocket} but motherboard uses ${moboSocket}`,
    });
  }

  if (cpuSocket && cpuSocket in SOCKET_DDR) {
    const req = SOCKET_DDR[cpuSocket];
    if (req !== null && ramDdr && ramDdr !== req) {
      issues.push({
        category: "DDR",
        description: `${cpuSocket} platform requires ${req} but selected RAM is ${ramDdr}`,
      });
    }
  }

  return issues;
}
