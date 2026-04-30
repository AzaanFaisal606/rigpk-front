import type { PrebuiltComponents } from "./prebuilts-api";

const GPU_4K        = /5090|4090|5080|4080/;
const GPU_1440P     = /5070|4070|9070|5060 ti|4060 ti/;
const GPU_1080P     = /3060|2060|1660|6600|6700|arc b580|5050|5060[^t]/;
const CPU_3D_VCACHE = /x3d/;
const RAM_WIFI_MB   = /wi-fi|wifi/;
const RAM_HIGH_CAP  = /32gb|64gb|128gb/;
const RAM_DDR5      = /ddr5/;

const DDR5_SPEED_THRESHOLD = 4800;

export function derivePrebuiltTags(components: PrebuiltComponents): string[] {
  const gpu = (components.gpu ?? "").toLowerCase();
  const cpu = (components.cpu ?? "").toLowerCase();
  const ram = (components.ram ?? "").toLowerCase();
  const mb  = (components.motherboard ?? "").toLowerCase();

  const tags: string[] = [];

  if (GPU_4K.test(gpu))                                          tags.push("4K READY");
  if (GPU_1440P.test(gpu))                                       tags.push("1440P GAMING");
  if (GPU_1080P.test(gpu))                                       tags.push("1080P GAMING");
  if (CPU_3D_VCACHE.test(cpu))                                   tags.push("3D V-CACHE");
  if (RAM_DDR5.test(ram) || _parseRamSpeed(ram) >= DDR5_SPEED_THRESHOLD) tags.push("DDR5");
  if (RAM_WIFI_MB.test(mb))                                      tags.push("WIFI");
  if (RAM_HIGH_CAP.test(ram))                                    tags.push("32GB+ RAM");

  return tags.slice(0, 4);
}

function _parseRamSpeed(ram: string): number {
  const m = ram.match(/(\d{4,5})\s*mhz/i) ?? ram.match(/(\d{4,5})/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return n >= 1600 && n <= 9000 ? n : 0;
}
