import type { Prebuilt, PrebuiltComponents } from "./prebuilts-api";
import { SOURCES } from "./constants";

/** Canonical origin for absolute URLs in metadata, sitemap and JSON-LD. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rigpk.vercel.app";

/** "Rs 218,500" — same locale every other price on the site uses. */
export function formatPkr(n: number): string {
  return "Rs " + n.toLocaleString("en-PK");
}

const PREBUILT_STORES: Record<string, string> = {
  "zestrogaming.com": "Zestro Gaming",
};

/** Human store name for a source domain; falls back to the domain itself. */
export function storeName(source: string): string {
  const part = SOURCES.find(s => s.key === source);
  return part?.label ?? PREBUILT_STORES[source] ?? source;
}

/**
 * True when a listing page was reached with any query string at all. Those
 * variants (sort, offset, filters, search) duplicate the clean URL's content,
 * so they are kept out of the index and pointed at the clean canonical.
 */
export function hasQueryParams(
  searchParams: Record<string, string | string[] | undefined>
): boolean {
  return Object.values(searchParams).some(v => v !== undefined);
}

function collapse(s: string): string {
  return s.replace(/[\s ]+/g, " ").trim();
}

/** Drops a word that immediately repeats itself ("PC PC" -> "PC"). */
function dedupeWords(s: string): string {
  return s.replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
}

/**
 * Retailer listing titles carry storefront noise:
 *   "G-2.1.8 | Buy Intel i5 12400F with RTX 2070 Gaming PC Build in Pakistan"
 * becomes
 *   "Intel i5 12400F with RTX 2070 Gaming PC Build (G-2.1.8)"
 * The longest "|"-separated segment is the real name; short leftovers are
 * model codes worth keeping, longer ones are dropped.
 */
export function cleanPrebuiltName(raw: string): string {
  const segments = raw.split("|").map(collapse).filter(Boolean);
  if (segments.length === 0) return collapse(raw);
  const main = segments.reduce((a, b) => (b.length > a.length ? b : a));
  const codes = segments.filter(s => s !== main && s.length <= 12);

  let name = main
    .replace(/^buy\s+/i, "")
    .replace(/\s+(?:price\s+)?in\s+pakistan\s*$/i, "")
    .replace(/[\s\-–—:]+$/, "");
  name = collapse(dedupeWords(name));
  if (!name) name = collapse(raw);
  return codes.length ? `${name} (${codes.join(", ")})` : name;
}

/**
 * Tidies one scraped component line for prose: drops parentheticals that are
 * vendor lists or core counts ("(6 Cores / 12 Threads)", "(Adata / HIKSEMI)"),
 * plus filler like "Graphics Card" / "Processor". Keeps "(Used)"-style notes.
 */
export function cleanComponent(s: string | undefined | null): string | null {
  if (!s) return null;
  const out = collapse(
    s
      .replace(/\([^)]*\/[^)]*\)?/g, "")
      .replace(/\b(graphics?\s+card|processor)\b/gi, "")
  );
  return out || null;
}

/** Short GPU model ("RTX 4060", "GTX 1660 Super", "RX 6700 XT") or null. */
export function gpuModel(s: string | undefined | null): string | null {
  if (!s) return null;
  const nv = s.match(/\b(RTX|GTX)\s*-?\s*(\d{3,4})(\s*Ti)?(\s*Super)?/i);
  if (nv) {
    return [nv[1].toUpperCase(), nv[2], nv[3] ? "Ti" : "", nv[4] ? "Super" : ""]
      .filter(Boolean).join(" ");
  }
  const amd = s.match(/\bRX\s*-?\s*(\d{3,4})(\s*XTX|\s*XT)?\b/i);
  if (amd) return ["RX", amd[1], amd[2] ? amd[2].trim().toUpperCase() : ""].filter(Boolean).join(" ");
  const arc = s.match(/\bArc\s*([AB]\d{3})\b/i);
  if (arc) return `Arc ${arc[1].toUpperCase()}`;
  return null;
}

/** Short CPU model ("Ryzen 5 7500F", "Core i5-12400F", "Core i5 4th Gen") or null. */
export function cpuModel(s: string | undefined | null): string | null {
  if (!s) return null;
  const ryzen = s.match(/\bRyzen\s*([3579])\s*(\d{4}[A-Z0-9]*)/i);
  if (ryzen) return `Ryzen ${ryzen[1]} ${ryzen[2].toUpperCase()}`;
  const ultra = s.match(/\bUltra\s*([579])\s*(\d{3}[A-Z]*)/i);
  if (ultra) return `Core Ultra ${ultra[1]} ${ultra[2].toUpperCase()}`;
  const gen = s.match(/\bi([3579])\s*(\d{1,2}(?:st|nd|rd|th))\s*gen/i);
  if (gen) return `Core i${gen[1]} ${gen[2].toLowerCase()} Gen`;
  const intel = s.match(/\bi([3579])\s*-?\s*(\d{4,5}[A-Z]*)/i);
  if (intel) return `Core i${intel[1]}-${intel[2].toUpperCase()}`;
  return null;
}

/** GPU of a prebuilt: the components line first, the listing name as fallback. */
export function prebuiltGpu(p: Pick<Prebuilt, "name" | "components">): string | null {
  return gpuModel(p.components?.gpu) ?? gpuModel(p.name);
}

/** CPU of a prebuilt: the components line first, the listing name as fallback. */
export function prebuiltCpu(p: Pick<Prebuilt, "name" | "components">): string | null {
  return cpuModel(p.components?.cpu) ?? cpuModel(p.name);
}

/**
 * Meta description for a prebuilt detail page, built from its components:
 * "Ryzen 5 7500F, RTX 4060 8GB, 16GB DDR5 5600MHz RAM, 512GB SSD. Rs 259,500 at TechMatched. ..."
 */
export function prebuiltDescription(
  p: Pick<Prebuilt, "name" | "source" | "price_pkr" | "components">
): string {
  const c: PrebuiltComponents = p.components ?? {};
  const cpu = cleanComponent(c.cpu) ?? prebuiltCpu(p);
  const gpu = cleanComponent(c.gpu) ?? prebuiltGpu(p);
  let ram = cleanComponent(c.ram);
  if (ram && !/\bram\b/i.test(ram)) ram += " RAM";
  const storage = cleanComponent(c.storage);
  const specs = [cpu, gpu, ram, storage].filter(Boolean).join(", ");

  const store = storeName(p.source);
  const price = p.price_pkr != null ? `${formatPkr(p.price_pkr)} at ${store}` : `Sold by ${store}`;
  const lead = specs ? `${specs}. ${price}.` : `${cleanPrebuiltName(p.name)}. ${price}.`;
  return `${lead} Compare pre-built gaming PC prices in Pakistan on RigPK.`;
}
