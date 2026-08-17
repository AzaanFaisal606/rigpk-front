import type { PrebuiltComponents } from "./prebuilts-api";
import { indexTokens } from "./search-tokenize";

const DDR5_SPEED_THRESHOLD = 4800;
const RAM_HIGH_CAP_GB_THRESHOLD = 32;

// Every rule below matches against TOKENS (the same tokenizer the search
// index uses — see lib/search-tokenize.ts), never against the raw name
// string. Raw-substring regexes broke whenever a scraped name's spacing
// didn't match the hardcoded literal ("5060 Ti" vs "5060ti", "9800X 3D" vs
// "9800X3D"); the tokenizer already normalises that variance away, so once
// two names mean the same product they always produce the same tokens.

/** True if `a` and `b` appear as two consecutive tokens, in that order. */
function hasAdjacentTokens(tokens: string[], a: string, b: string): boolean {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i] === a && tokens[i + 1] === b) return true;
  }
  return false;
}

function hasAnyToken(tokens: string[], values: string[]): boolean {
  return values.some((v) => tokens.includes(v));
}

const GPU_4K_MODELS    = ["5090", "4090", "5080", "4080"];
const GPU_1440P_MODELS = ["5070", "4070", "9070"];
const GPU_1080P_MODELS = ["3060", "2060", "1660", "6600", "6700", "5050"];

function isGpu4K(tokens: string[]): boolean {
  return hasAnyToken(tokens, GPU_4K_MODELS);
}

function isGpu1440p(tokens: string[]): boolean {
  return (
    hasAnyToken(tokens, GPU_1440P_MODELS) ||
    hasAdjacentTokens(tokens, "5060", "ti") ||
    hasAdjacentTokens(tokens, "4060", "ti")
  );
}

function isGpu1080p(tokens: string[]): boolean {
  if (hasAnyToken(tokens, GPU_1080P_MODELS)) return true;
  if (hasAdjacentTokens(tokens, "arc", "b580")) return true;
  // Bare 5060 is 1080p; the Ti variant is bumped to 1440p above. Both "5060
  // Ti" and "5060ti" tokenize to the identical ["5060", "ti"] pair, so this
  // exclusion — unlike the old `5060[^t]` regex, which only worked when there
  // was no space before "Ti" — holds regardless of how the name was spaced.
  if (tokens.includes("5060") && !hasAdjacentTokens(tokens, "5060", "ti")) return true;
  return false;
}

// "9800X3D" tokenizes as a single "9800x3d" token (a lone "x" is below the
// tokenizer's 2-letter split threshold), but the real scraped spacing
// variant "9800X 3D" tokenizes as adjacent ["9800x", "3d"]. Cover both.
function hasVCache(tokens: string[]): boolean {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].includes("x3d")) return true;
    if (tokens[i].endsWith("x") && tokens[i + 1] === "3d") return true;
  }
  return false;
}

// "DDR5" tokenizes as adjacent ["ddr", "5"] (the alphabetic side is 3
// letters, so the digit boundary splits); "DDR 5" does too. Either spacing
// lands on the same pair.
function hasDdr5(tokens: string[]): boolean {
  return hasAdjacentTokens(tokens, "ddr", "5");
}

// "WiFi" tokenizes as a single "wifi" token; "Wi-Fi" splits on the hyphen
// into adjacent ["wi", "fi"].
function hasWifi(tokens: string[]): boolean {
  return tokens.includes("wifi") || hasAdjacentTokens(tokens, "wi", "fi");
}

// "32GB" tokenizes as adjacent ["32", "gb"] ("gb" is 2 letters, so the digit
// boundary splits); "32 GB" does too. A threshold instead of a fixed list
// covers every kit size retailers actually sell (32/64/96/128/192GB) without
// hardcoding each one.
function hasHighCapRam(tokens: string[]): boolean {
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i + 1] !== "gb") continue;
    const n = Number(tokens[i]);
    if (Number.isFinite(n) && n >= RAM_HIGH_CAP_GB_THRESHOLD) return true;
  }
  return false;
}

export function derivePrebuiltTags(components: PrebuiltComponents): string[] {
  const gpuTokens = indexTokens(components.gpu ?? "");
  const cpuTokens = indexTokens(components.cpu ?? "");
  const ramTokens = indexTokens(components.ram ?? "");
  const mbTokens  = indexTokens(components.motherboard ?? "");
  const ram = (components.ram ?? "").toLowerCase();

  const tags: string[] = [];

  if (isGpu4K(gpuTokens))                                                tags.push("4K READY");
  if (isGpu1440p(gpuTokens))                                             tags.push("1440P GAMING");
  if (isGpu1080p(gpuTokens))                                             tags.push("1080P GAMING");
  if (hasVCache(cpuTokens))                                              tags.push("3D V-CACHE");
  if (hasDdr5(ramTokens) || _parseRamSpeed(ram) >= DDR5_SPEED_THRESHOLD)  tags.push("DDR5");
  if (hasWifi(mbTokens))                                                 tags.push("WIFI");
  if (hasHighCapRam(ramTokens))                                          tags.push("32GB+ RAM");

  return tags.slice(0, 4);
}

function _parseRamSpeed(ram: string): number {
  const m = ram.match(/(\d{4,5})\s*mhz/i) ?? ram.match(/(\d{4,5})/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return n >= 1600 && n <= 9000 ? n : 0;
}
