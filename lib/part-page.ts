import { API_BASE, type Part, type PartDetails } from "./api";
import { MODELS, type ModelEntry } from "./models";
import { monthYear } from "./budgets";
import { formatPkr, storeName } from "./seo";

export { partSlug, partPath, parsePartParam, PART_PARAM_RE } from "./part-slug";

/**
 * Part pages (/part/<id>-<slug>) are built on their first request and cached
 * for a day (ISR). Prices move on the weekly scrape, and every regeneration is
 * a Vercel ISR write plus a backend call on the Render free tier, so a shorter
 * window buys nothing and costs quota. See docs/product-pages.md.
 */
export const PART_REVALIDATE = 86400;

/** A listing as the part page gets it: the market row plus its retailer details. */
export interface PartPage extends Part {
  is_active: boolean;
  last_seen_at: string | null;
  details: PartDetails;
}

export interface SitemapPart {
  id: number;
  name: string;
  last_seen_at: string | null;
}

/**
 * The model page a GPU/CPU listing belongs to, from its parsed specs.model.
 * VRAM-variant pages need an exact VRAM match; otherwise the model's
 * single-VRAM page (which ignores VRAM, like partsForModel) is used. A
 * variant-only model with an unmatched VRAM gets no link rather than a wrong one.
 */
export function modelForPart(p: Pick<Part, "category" | "specs">): ModelEntry | undefined {
  const model = p.specs?.model;
  if (!model || (p.category !== "gpu" && p.category !== "cpu")) return undefined;
  const candidates = MODELS.filter(m => m.category === p.category && m.models.includes(model));
  return candidates.find(m => m.vram && m.vram === p.specs?.vram)
    ?? candidates.find(m => !m.vram);
}

export function hasContent(d: PartDetails | null | undefined): boolean {
  return !!d && (!!d.overview || d.highlights.length > 0 || d.specs.length > 0);
}

/**
 * Same rule as the backend's list_indexable_parts (the sitemap): active,
 * priced, and some retailer content. Everything else is noindex, follow.
 */
export function partIsIndexable(p: PartPage): boolean {
  return p.is_active && p.price_pkr != null && hasContent(p.details);
}

/** null = no such part (404); "error" = backend down, never cached as a 404. */
export async function getPartPage(id: number): Promise<PartPage | null | "error"> {
  try {
    // A hung Render cold start must not burn function time; a timeout is
    // "error", so the last good page keeps being served.
    const res = await fetch(`${API_BASE}/api/parts/${id}`, {
      next: { revalidate: PART_REVALIDATE },
      signal: AbortSignal.timeout(25_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return "error";
    return (await res.json()) as PartPage;
  } catch {
    return "error";
  }
}

/** Indexable part pages for the sitemap; null when the backend can't answer. */
export async function getIndexableParts(): Promise<SitemapPart[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/parts/sitemap`, {
      next: { revalidate: PART_REVALIDATE },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as SitemapPart[];
  } catch {
    return null;
  }
}

// Spec keys shown as chips under the name, in this order, when present.
const CHIP_KEYS = ["brand", "model", "vram", "socket", "chipset", "ddr_type", "speed", "capacity",
  "wattage", "rating", "form_factor", "type", "aio_size", "screen_size", "resolution", "refresh_rate", "panel"] as const;

export function partChips(part: Pick<Part, "specs">): string[] {
  return CHIP_KEYS.map(k => part.specs?.[k]).filter((v): v is string => !!v).slice(0, 4);
}

/** WordPress thumbnails carry a size suffix ("-247x247.jpg"); the original is the same path without it. */
export function fullImageUrl(url: string): string {
  return url.includes("/wp-content/uploads/") ? url.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+(?:\?|$))/i, "") : url;
}

/** "9 Nov 2026" in Pakistan time, fixed locale so server and client agree. */
export function checkedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });
}

const DESCRIPTION_MAX = 160;

/** Meta description: price, store, month checked, top spec chips. <= 160 chars, cut at a word. */
export function partDescription(p: PartPage): string {
  const store = storeName(p.source);
  const seen = p.last_seen_at ? new Date(p.last_seen_at) : null;
  const month = seen && !Number.isNaN(seen.getTime()) ? ` (checked ${monthYear(seen)})` : "";
  const lead = p.price_pkr != null
    ? `${p.name} price in Pakistan: ${formatPkr(p.price_pkr)} at ${store}${month}.`
    : `${p.name}: currently out of stock at ${store}.`;
  const chips = partChips(p);
  const full = chips.length ? `${lead} ${chips.join(" · ")}.` : lead;
  if (full.length <= DESCRIPTION_MAX) return full;
  const cut = full.slice(0, DESCRIPTION_MAX - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.:;·-]+$/, "") + "…";
}
