import type { Part } from "./api";
import { listJoin, monthYear, type Faq } from "./budgets";
import { formatPkr, storeName } from "./seo";

export type ModelCategory = "gpu" | "cpu";
export type ModelBrand = "nvidia" | "amd" | "intel";

export interface ModelEntry {
  /** URL segment: /<category>/<slug> */
  slug: string;
  category: ModelCategory;
  brand: ModelBrand;
  /** Key into MODEL_SERIES. */
  series: string;
  /** "RTX 4060 Ti 16GB", "Core i5-14600K / KF" */
  label: string;
  /** Exact backend specs.model values this page collects (a K/KF pair shares one page). */
  models: string[];
  /** Set only on VRAM-variant pages; listings must carry exactly this VRAM. */
  vram?: string;
}

export interface ModelSeries {
  key: string;
  label: string;
  category: ModelCategory;
  brand: ModelBrand;
}

export const BRAND_LABEL: Record<ModelBrand, string> = {
  nvidia: "NVIDIA",
  amd: "AMD",
  intel: "Intel",
};

export const CATEGORY_LABEL: Record<ModelCategory, string> = {
  gpu: "GPUs",
  cpu: "CPUs",
};

// Display order in the menu is the order here.
export const MODEL_SERIES: readonly ModelSeries[] = [
  { key: "rtx-50", label: "RTX 50 Series", category: "gpu", brand: "nvidia" },
  { key: "rtx-40", label: "RTX 40 Series", category: "gpu", brand: "nvidia" },
  { key: "rtx-30", label: "RTX 30 Series", category: "gpu", brand: "nvidia" },
  { key: "rx-9000", label: "RX 9000 Series", category: "gpu", brand: "amd" },
  { key: "rx-7000", label: "RX 7000 Series", category: "gpu", brand: "amd" },
  { key: "rx-6000", label: "RX 6000 Series", category: "gpu", brand: "amd" },
  { key: "ryzen-9000", label: "Ryzen 9000", category: "cpu", brand: "amd" },
  { key: "ryzen-7000", label: "Ryzen 7000", category: "cpu", brand: "amd" },
  { key: "ryzen-5000", label: "Ryzen 5000", category: "cpu", brand: "amd" },
  { key: "core-ultra", label: "Core Ultra 200S", category: "cpu", brand: "intel" },
  { key: "intel-14", label: "14th Gen", category: "cpu", brand: "intel" },
  { key: "intel-13", label: "13th Gen", category: "cpu", brand: "intel" },
  { key: "intel-12", label: "12th Gen", category: "cpu", brand: "intel" },
];

// [slug, label, models, vram?]
type Row = [string, string, string[], string?];
const G = (series: string, brand: ModelBrand, rows: Row[]): ModelEntry[] =>
  rows.map(([slug, label, models, vram]) => ({ slug, category: "gpu", brand, series, label, models, ...(vram && { vram }) }));
const C = (series: string, brand: ModelBrand, rows: Row[]): ModelEntry[] =>
  rows.map(([slug, label, models]) => ({ slug, category: "cpu", brand, series, label, models }));

/**
 * Every model page. A fixed list, so a URL never disappears when stock runs
 * out. `models` values must be on the backend allowlist
 * (scrapers/spec_extractor.py), or the page can never match anything.
 */
export const MODELS: readonly ModelEntry[] = [
  ...G("rtx-50", "nvidia", [
    ["rtx-5050", "RTX 5050", ["RTX 5050"]],
    ["rtx-5060", "RTX 5060", ["RTX 5060"]],
    ["rtx-5060-ti-8gb", "RTX 5060 Ti 8GB", ["RTX 5060 Ti"], "8GB"],
    ["rtx-5060-ti-16gb", "RTX 5060 Ti 16GB", ["RTX 5060 Ti"], "16GB"],
    ["rtx-5070", "RTX 5070", ["RTX 5070"]],
    ["rtx-5070-ti", "RTX 5070 Ti", ["RTX 5070 Ti"]],
    ["rtx-5080", "RTX 5080", ["RTX 5080"]],
    ["rtx-5090", "RTX 5090", ["RTX 5090"]],
  ]),
  ...G("rtx-40", "nvidia", [
    ["rtx-4060", "RTX 4060", ["RTX 4060"]],
    ["rtx-4060-ti-8gb", "RTX 4060 Ti 8GB", ["RTX 4060 Ti"], "8GB"],
    ["rtx-4060-ti-16gb", "RTX 4060 Ti 16GB", ["RTX 4060 Ti"], "16GB"],
    ["rtx-4070", "RTX 4070", ["RTX 4070"]],
    ["rtx-4070-super", "RTX 4070 Super", ["RTX 4070 Super"]],
    ["rtx-4070-ti-super", "RTX 4070 Ti Super", ["RTX 4070 Ti Super"]],
    ["rtx-4080-super", "RTX 4080 Super", ["RTX 4080 Super"]],
  ]),
  ...G("rtx-30", "nvidia", [
    ["rtx-3050-6gb", "RTX 3050 6GB", ["RTX 3050"], "6GB"],
    ["rtx-3050-8gb", "RTX 3050 8GB", ["RTX 3050"], "8GB"],
    ["rtx-3060", "RTX 3060", ["RTX 3060"]],
    ["rtx-3060-ti", "RTX 3060 Ti", ["RTX 3060 Ti"]],
    ["rtx-3070", "RTX 3070", ["RTX 3070"]],
    ["rtx-3070-ti", "RTX 3070 Ti", ["RTX 3070 Ti"]],
    ["rtx-3080-10gb", "RTX 3080 10GB", ["RTX 3080"], "10GB"],
    ["rtx-3080-12gb", "RTX 3080 12GB", ["RTX 3080"], "12GB"],
  ]),
  ...G("rx-9000", "amd", [
    ["rx-9060-xt-8gb", "RX 9060 XT 8GB", ["RX 9060 XT"], "8GB"],
    ["rx-9060-xt-16gb", "RX 9060 XT 16GB", ["RX 9060 XT"], "16GB"],
    ["rx-9070", "RX 9070", ["RX 9070"]],
    ["rx-9070-xt", "RX 9070 XT", ["RX 9070 XT"]],
  ]),
  ...G("rx-7000", "amd", [
    ["rx-7600-xt", "RX 7600 XT", ["RX 7600 XT"]],
    ["rx-7700-xt", "RX 7700 XT", ["RX 7700 XT"]],
    ["rx-7800-xt", "RX 7800 XT", ["RX 7800 XT"]],
    ["rx-7900-xt", "RX 7900 XT", ["RX 7900 XT"]],
    ["rx-7900-xtx", "RX 7900 XTX", ["RX 7900 XTX"]],
  ]),
  ...G("rx-6000", "amd", [
    ["rx-6600", "RX 6600", ["RX 6600"]],
    ["rx-6700-xt", "RX 6700 XT", ["RX 6700 XT"]],
    ["rx-6800-xt", "RX 6800 XT", ["RX 6800 XT"]],
  ]),
  ...C("ryzen-9000", "amd", [
    ["ryzen-5-9600x", "Ryzen 5 9600X", ["Ryzen 5 9600X"]],
    ["ryzen-7-9700x", "Ryzen 7 9700X", ["Ryzen 7 9700X"]],
    ["ryzen-7-9800x3d", "Ryzen 7 9800X3D", ["Ryzen 7 9800X3D"]],
    ["ryzen-9-9900x", "Ryzen 9 9900X", ["Ryzen 9 9900X"]],
    ["ryzen-9-9950x", "Ryzen 9 9950X", ["Ryzen 9 9950X"]],
    ["ryzen-9-9950x3d", "Ryzen 9 9950X3D", ["Ryzen 9 9950X3D"]],
  ]),
  ...C("ryzen-7000", "amd", [
    ["ryzen-5-7500f", "Ryzen 5 7500F", ["Ryzen 5 7500F"]],
    ["ryzen-5-7600", "Ryzen 5 7600", ["Ryzen 5 7600"]],
    ["ryzen-5-7600x", "Ryzen 5 7600X", ["Ryzen 5 7600X"]],
    ["ryzen-7-7700", "Ryzen 7 7700", ["Ryzen 7 7700"]],
    ["ryzen-7-7700x", "Ryzen 7 7700X", ["Ryzen 7 7700X"]],
    ["ryzen-7-7800x3d", "Ryzen 7 7800X3D", ["Ryzen 7 7800X3D"]],
    ["ryzen-9-7900x", "Ryzen 9 7900X", ["Ryzen 9 7900X"]],
    ["ryzen-9-7950x", "Ryzen 9 7950X", ["Ryzen 9 7950X"]],
  ]),
  ...C("ryzen-5000", "amd", [
    ["ryzen-5-5600", "Ryzen 5 5600", ["Ryzen 5 5600"]],
    ["ryzen-5-5600x", "Ryzen 5 5600X", ["Ryzen 5 5600X"]],
    ["ryzen-7-5700x", "Ryzen 7 5700X", ["Ryzen 7 5700X"]],
    ["ryzen-7-5800x", "Ryzen 7 5800X", ["Ryzen 7 5800X"]],
  ]),
  ...C("core-ultra", "intel", [
    ["core-ultra-5-245k", "Core Ultra 5 245K / KF", ["Ultra 5 245K", "Ultra 5 245KF"]],
    ["core-ultra-7-265k", "Core Ultra 7 265K / KF", ["Ultra 7 265K", "Ultra 7 265KF"]],
    ["core-ultra-9-285k", "Core Ultra 9 285K", ["Ultra 9 285K"]],
  ]),
  ...C("intel-14", "intel", [
    ["core-i3-14100f", "Core i3-14100F", ["i3-14100F"]],
    ["core-i5-14400f", "Core i5-14400F", ["i5-14400F"]],
    ["core-i5-14600k", "Core i5-14600K / KF", ["i5-14600K", "i5-14600KF"]],
    ["core-i7-14700k", "Core i7-14700K / KF", ["i7-14700K", "i7-14700KF"]],
    ["core-i9-14900k", "Core i9-14900K / KF", ["i9-14900K", "i9-14900KF"]],
  ]),
  ...C("intel-13", "intel", [
    ["core-i5-13400f", "Core i5-13400F", ["i5-13400F"]],
    ["core-i5-13600k", "Core i5-13600K / KF", ["i5-13600K", "i5-13600KF"]],
    ["core-i7-13700k", "Core i7-13700K / KF", ["i7-13700K", "i7-13700KF"]],
    ["core-i9-13900k", "Core i9-13900K / KF", ["i9-13900K", "i9-13900KF"]],
  ]),
  ...C("intel-12", "intel", [
    ["core-i3-12100f", "Core i3-12100F", ["i3-12100F"]],
    ["core-i5-12400f", "Core i5-12400F", ["i5-12400F"]],
    ["core-i5-12600k", "Core i5-12600K / KF", ["i5-12600K", "i5-12600KF"]],
    ["core-i7-12700k", "Core i7-12700K / KF", ["i7-12700K", "i7-12700KF"]],
    ["core-i9-12900k", "Core i9-12900K / KF", ["i9-12900K", "i9-12900KF"]],
  ]),
];

export function modelBySlug(category: string, slug: string): ModelEntry | undefined {
  return MODELS.find(m => m.category === category && m.slug === slug);
}

export function modelPath(e: ModelEntry): string {
  return `/${e.category}/${e.slug}`;
}

export function seriesOf(e: ModelEntry): ModelSeries {
  return MODEL_SERIES.find(s => s.key === e.series)!;
}

/** The other models in the same series, in catalog order. */
export function siblings(e: ModelEntry): ModelEntry[] {
  return MODELS.filter(m => m.series === e.series && m.slug !== e.slug);
}

/**
 * Priced listings of one model, cheapest first. Only variant pages look at
 * VRAM: some real cards carry a bogus VRAM read from their SKU ("-20G"), and
 * those still belong on their single-VRAM page.
 */
export function partsForModel(parts: Part[], e: ModelEntry): Part[] {
  return parts
    .filter(p =>
      p.price_pkr != null && p.price_pkr > 0 &&
      e.models.includes(p.specs?.model ?? "") &&
      (e.vram ? p.specs?.vram === e.vram : true)
    )
    .sort((a, b) => (a.price_pkr as number) - (b.price_pkr as number) || a.id - b.id);
}

/**
 * Thumbnail URLs for a model's box, most trustworthy first. Retailers now and
 * then reuse another card's photo, so images whose file name carries the
 * model's number ("4060", "14600") go ahead of the rest; otherwise listing
 * order (cheapest first) holds.
 */
export function thumbCandidates(parts: Part[], e: ModelEntry): string[] {
  const numbers = e.models.map(m => m.match(/\d{3,5}/)?.[0]).filter((n): n is string => !!n);
  const urls = [...new Set(parts.map(p => p.thumbnail_url).filter((u): u is string => !!u))];
  const named = (u: string) => {
    const file = u.split("?")[0].split("/").pop() ?? "";
    return numbers.some(n => file.includes(n));
  };
  return [...urls.filter(named), ...urls.filter(u => !named(u))];
}

/**
 * Local price filter for a model page. Non-digits are stripped ("90,000"),
 * an empty field is unbounded, and a min above the max just matches nothing.
 */
export function filterByPrice(parts: Part[], min: string, max: string): Part[] {
  const lo = min.replace(/\D/g, "");
  const hi = max.replace(/\D/g, "");
  const minN = lo ? Number(lo) : null;
  const maxN = hi ? Number(hi) : null;
  return parts.filter(p => {
    const price = p.price_pkr ?? 0;
    return (minN == null || price >= minN) && (maxN == null || price <= maxN);
  });
}

export interface ModelSummary {
  count: number;
  min: number | null;
  max: number | null;
  stores: string[];
}

/** Expects the output of partsForModel (priced). Stores in first-seen order. */
export function summarizeModel(parts: Part[]): ModelSummary {
  const prices = parts.map(p => p.price_pkr as number);
  return {
    count: parts.length,
    min: prices.length ? Math.min(...prices) : null,
    max: prices.length ? Math.max(...prices) : null,
    stores: [...new Set(parts.map(p => storeName(p.source)))],
  };
}

/** "A, B and C", or "A, B, C and 2 more stores" past three. */
export function storeList(stores: string[]): string {
  if (stores.length <= 3) return listJoin(stores);
  const more = stores.length - 3;
  return `${stores.slice(0, 3).join(", ")} and ${more} more store${more === 1 ? "" : "s"}`;
}

function listings(n: number): string {
  return `listing${n === 1 ? "" : "s"}`;
}

export function modelHeading(e: ModelEntry): string {
  return `${e.label} Price in Pakistan`;
}

export function modelTitle(e: ModelEntry, s: ModelSummary, date: Date): string {
  const title = `${modelHeading(e)} (${monthYear(date)})`;
  return s.min != null ? `${title} — from ${formatPkr(s.min)}` : title;
}

function priceRange(s: ModelSummary): string {
  const min = formatPkr(s.min as number);
  return s.min === s.max ? min : `${min} to ${formatPkr(s.max as number)}`;
}

export function modelDescription(e: ModelEntry, s: ModelSummary): string {
  if (s.count === 0 || s.min == null || s.max == null) {
    return `${e.label} prices from Pakistani PC stores, updated weekly.`;
  }
  return (
    `${s.count} ${e.label} ${listings(s.count)} from ${storeList(s.stores)}, ` +
    `priced ${priceRange(s)}. Compare prices, updated weekly.`
  );
}

/** Server-rendered intro paragraph for a model page, from live data. */
export function modelIntro(e: ModelEntry, s: ModelSummary): string {
  if (s.count === 0 || s.min == null || s.max == null) {
    return `No ${e.label} is in stock at the stores we track right now. Stock changes weekly, so check back soon or look at the other models below.`;
  }
  const range = s.min === s.max ? `at ${formatPkr(s.min)}` : `from ${formatPkr(s.min)} up to ${formatPkr(s.max)}`;
  return (
    `We found ${s.count} ${e.label} ${listings(s.count)} across ${storeList(s.stores)}, ${range}. ` +
    `Prices are checked every week; click a listing to buy it from the store.`
  );
}

/** FAQ entries answered from live data. Nothing listed means no FAQ. */
export function modelFaqs(e: ModelEntry, s: ModelSummary, date: Date): Faq[] {
  if (s.count === 0 || s.min == null || s.max == null) return [];
  return [
    {
      q: `What is the price of the ${e.label} in Pakistan?`,
      a:
        `As of ${monthYear(date)}, the ${e.label} starts at ${formatPkr(s.min)} in Pakistan, ` +
        `and listings go up to ${formatPkr(s.max)} across ${s.count} ${listings(s.count)}.`,
    },
    {
      q: `Where can I buy the ${e.label} in Pakistan?`,
      a: `It is listed at ${storeList(s.stores)}. Each listing links straight to the store's product page.`,
    },
  ];
}
