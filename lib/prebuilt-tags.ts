import type { PrebuiltComponents } from "./prebuilts-api";

export function derivePrebuiltTags(components: PrebuiltComponents): string[] {
  const gpu = (components.gpu ?? "").toLowerCase();
  const cpu = (components.cpu ?? "").toLowerCase();
  const ram = (components.ram ?? "").toLowerCase();
  const mb  = (components.motherboard ?? "").toLowerCase();

  const tags: string[] = [];

  if (/5090|4090|5080|4080/.test(gpu))                       tags.push("4K READY");
  if (/5070|4070|9070|5060 ti|4060 ti/.test(gpu))            tags.push("1440P GAMING");
  if (/3060|2060|1660|6600|6700|arc b580|5050|5060[^t]/.test(gpu)) tags.push("1080P GAMING");
  if (/x3d/.test(cpu))                                        tags.push("3D V-CACHE");
  if (/ddr5/.test(ram) || _parseRamSpeed(ram) >= 4800)        tags.push("DDR5");
  if (/wi-fi|wifi/.test(mb))                                  tags.push("WIFI");
  if (/32gb|64gb|128gb/.test(ram))                            tags.push("32GB+ RAM");

  return tags.slice(0, 4);
}

function _parseRamSpeed(ram: string): number {
  const m = ram.match(/(\d{4,5})\s*mhz/i) ?? ram.match(/(\d{4,5})/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  // Only treat as speed if in plausible RAM speed range
  return n >= 1600 && n <= 9000 ? n : 0;
}
