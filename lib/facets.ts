import type { MARKET_ROUTE_CATEGORIES } from "./constants";

type Category = (typeof MARKET_ROUTE_CATEGORIES)[number];

/**
 * A clean, indexable URL for one spec filter: /market/<category>/<slug>
 * stands in for /market/<category>?<key>=<value>. Curated rather than
 * generated — each one matches a phrase people actually search ("ddr5 ram
 * price in pakistan", "am5 motherboard price") and had a healthy number of
 * active listings when added, so none of them is a thin page.
 */
export interface Facet {
  slug: string;
  /** Spec filter key, as /api/parts takes it. */
  key: string;
  /** Exact spec value, as /api/parts/filters returns it. */
  value: string;
  /** Short chip label: "DDR5". */
  label: string;
  /** Noun phrase for headings: "DDR5 RAM" -> "DDR5 RAM Prices in Pakistan". */
  name: string;
}

const f = (slug: string, key: string, value: string, label: string, name: string): Facet =>
  ({ slug, key, value, label, name });

export const FACETS: Partial<Record<Category, readonly Facet[]>> = {
  cpu: [
    f("amd",     "brand",  "AMD",     "AMD",     "AMD Ryzen Processor"),
    f("intel",   "brand",  "Intel",   "Intel",   "Intel Processor"),
    f("am4",     "socket", "AM4",     "AM4",     "AM4 Processor"),
    f("am5",     "socket", "AM5",     "AM5",     "AM5 Processor"),
    f("lga1700", "socket", "LGA1700", "LGA1700", "LGA1700 Processor"),
    f("lga1851", "socket", "LGA1851", "LGA1851", "LGA1851 Processor"),
  ],
  gpu: [
    f("8gb",      "vram",  "8GB",      "8GB",      "8GB Graphics Card"),
    f("12gb",     "vram",  "12GB",     "12GB",     "12GB Graphics Card"),
    f("16gb",     "vram",  "16GB",     "16GB",     "16GB Graphics Card"),
    f("asus",     "brand", "ASUS",     "ASUS",     "ASUS Graphics Card"),
    f("msi",      "brand", "MSI",      "MSI",      "MSI Graphics Card"),
    f("gigabyte", "brand", "Gigabyte", "Gigabyte", "Gigabyte Graphics Card"),
    f("zotac",    "brand", "Zotac",    "Zotac",    "Zotac Graphics Card"),
    f("sapphire", "brand", "Sapphire", "Sapphire", "Sapphire Graphics Card"),
  ],
  ram: [
    f("ddr4", "ddr_type", "DDR4", "DDR4", "DDR4 RAM"),
    f("ddr5", "ddr_type", "DDR5", "DDR5", "DDR5 RAM"),
    f("16gb", "capacity", "16GB", "16GB", "16GB RAM"),
    f("32gb", "capacity", "32GB", "32GB", "32GB RAM"),
  ],
  motherboard: [
    f("am4",       "socket",      "AM4",       "AM4",       "AM4 Motherboard"),
    f("am5",       "socket",      "AM5",       "AM5",       "AM5 Motherboard"),
    f("lga1700",   "socket",      "LGA1700",   "LGA1700",   "LGA1700 Motherboard"),
    f("lga1851",   "socket",      "LGA1851",   "LGA1851",   "LGA1851 Motherboard"),
    f("atx",       "form_factor", "ATX",       "ATX",       "ATX Motherboard"),
    f("micro-atx", "form_factor", "Micro-ATX", "Micro-ATX", "Micro-ATX Motherboard"),
  ],
  psu: [
    f("650w",           "wattage", "650W",       "650W",       "650W Power Supply"),
    f("750w",           "wattage", "750W",       "750W",       "750W Power Supply"),
    f("850w",           "wattage", "850W",       "850W",       "850W Power Supply"),
    f("1000w",          "wattage", "1000W",      "1000W",      "1000W Power Supply"),
    f("80-plus-gold",   "rating",  "80+ Gold",   "80+ Gold",   "80+ Gold Power Supply"),
    f("80-plus-bronze", "rating",  "80+ Bronze", "80+ Bronze", "80+ Bronze Power Supply"),
  ],
  ssd: [
    f("nvme",  "interface", "NVMe",  "NVMe",  "NVMe SSD"),
    f("sata",  "interface", "SATA",  "SATA",  "SATA SSD"),
    f("512gb", "capacity",  "512GB", "512GB", "512GB SSD"),
    f("1tb",   "capacity",  "1TB",   "1TB",   "1TB SSD"),
    f("2tb",   "capacity",  "2TB",   "2TB",   "2TB SSD"),
  ],
  cooling: [
    f("aio",       "type",     "AIO",   "AIO",       "AIO Liquid Cooler"),
    f("air",       "type",     "Air",   "Air",       "Air CPU Cooler"),
    f("240mm-aio", "aio_size", "240mm", "240mm AIO", "240mm AIO Cooler"),
    f("360mm-aio", "aio_size", "360mm", "360mm AIO", "360mm AIO Cooler"),
  ],
  case: [
    f("atx",       "form_factor", "ATX",       "ATX",       "ATX PC Case"),
    f("micro-atx", "form_factor", "Micro-ATX", "Micro-ATX", "Micro-ATX PC Case"),
  ],
};

export function facetsFor(category: string): readonly Facet[] {
  return FACETS[category as Category] ?? [];
}

export function facetBySlug(category: string, slug: string): Facet | undefined {
  return facetsFor(category).find(x => x.slug === slug);
}

/** Every (category, facet) pair, for generateStaticParams and the sitemap. */
export function allFacetRoutes(): { category: string; facet: Facet }[] {
  return Object.entries(FACETS).flatMap(([category, list]) =>
    (list ?? []).map(facet => ({ category, facet }))
  );
}

export function facetPath(category: string, facet: Facet): string {
  return `/market/${category}/${facet.slug}`;
}

/**
 * The facet a query string is exactly equivalent to — one parameter, naming
 * a facet's key and value (value compared case-insensitively) — else
 * undefined. `/market/ram?ddr_type=DDR5` maps to the ddr5 facet;
 * `?ddr_type=DDR5&sort=price_desc` maps to nothing, since the clean URL
 * can't carry the sort.
 */
export function facetForQuery(category: string, params: URLSearchParams): Facet | undefined {
  const keys = [...new Set(params.keys())];
  if (keys.length !== 1) return undefined;
  const values = params.getAll(keys[0]);
  if (values.length !== 1) return undefined;
  const value = values[0].toLowerCase();
  return facetsFor(category).find(x => x.key === keys[0] && x.value.toLowerCase() === value);
}

export function facetTitle(facet: Facet): string {
  return `${facet.name} Prices in Pakistan`;
}

export function facetDescription(facet: Facet): string {
  return (
    `Compare ${facet.name} prices from CZone, PakByte, Zah Computers and more Pakistani ` +
    `retailers. Live prices, updated weekly.`
  );
}
