import type { SlotKey } from "@/lib/types";
import type { SearchIndexPayload } from "@/lib/search-index";
export type { SlotKey };

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface SourceHealth {
  /** Latest scrape of this retailer failed — its listings are from an earlier run. */
  stale: boolean;
  last_run_at: string;
  last_success_at: string | null;
  last_products: number;
  last_error: string | null;
}

export interface Stats {
  total_parts: number;
  total_price_rows: number;
  by_source: Record<string, number>;
  by_category: Record<string, number>;
  /** Keyed by source domain, e.g. "amdhouse.pk". Absent for never-scraped sources. */
  sources?: Record<string, SourceHealth>;
}

export async function getStats(): Promise<Stats | null> {
  try {
    const res = await fetch(`${API_BASE}/api/stats`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface PartSpecs {
  brand?: string;
  socket?: string;
  vram?: string;
  ddr_type?: string;
  speed?: string;
  chipset?: string;
  wattage?: string;
  rating?: string;
  form_factor?: string;
  type?: string;
  aio_size?: string;
  fan_size?: string;
  interface?: string;
  capacity?: string;
}

export interface FilterOptions {
  brand?: string[];
  socket?: string[];
  vram?: string[];
  ddr_type?: string[];
  speed?: string[];
  chipset?: string[];
  wattage?: string[];
  rating?: string[];
  form_factor?: string[];
  type?: string[];
  aio_size?: string[];
  fan_size?: string[];
  interface?: string[];
  capacity?: string[];
}

export interface Part {
  id: number;
  source: string;
  name: string;
  category: string;
  url: string;
  thumbnail_url: string | null;
  price_pkr: number | null;
  specs: PartSpecs | null;
}

export type PartsResult =
  | { ok: true; items: Part[]; total: number }
  | { ok: false; error: "network" | "http"; status?: number };

export interface PartsParams {
  category?: string;
  source?: string;
  min_price?: number;
  max_price?: number;
  sort?: "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
  q?: string;
  brand?: string;
  socket?: string;
  vram?: string;
  ddr_type?: string;
  speed?: string;
  chipset?: string;
  wattage?: string;
  rating?: string;
  form_factor?: string;
  type?: string;
  aio_size?: string;
  fan_size?: string;
  interface?: string;
  capacity?: string;
}

export async function getParts(params: PartsParams = {}): Promise<PartsResult> {
  const query = new URLSearchParams();
  const keys: (keyof PartsParams)[] = [
    "category", "source", "min_price", "max_price", "sort", "limit", "offset", "q",
    "brand", "socket", "vram", "ddr_type", "speed", "chipset", "wattage",
    "rating", "form_factor", "type", "aio_size", "fan_size", "interface", "capacity",
  ];
  for (const key of keys) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      query.set(key, String(val));
    }
  }
  try {
    // A search result must never be cached. One backend hiccup used to pin an
    // empty result to a query string for 30s, so retyping the same query kept
    // returning nothing — the "sometimes works, sometimes doesn't" report.
    const res = await fetch(
      `${API_BASE}/api/parts?${query}`,
      params.q ? { cache: "no-store" } : { next: { revalidate: 30 } },
    );
    if (!res.ok) return { ok: false, error: "http", status: res.status };
    const data = await res.json();
    return { ok: true, items: data.items, total: data.total };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function getSearchIndex(
  category: string,
): Promise<SearchIndexPayload | null> {
  try {
    const res = await fetch(`${API_BASE}/api/search-index?category=${category}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getPartsByIds(ids: number[]): Promise<PartsResult> {
  if (ids.length === 0) return { ok: true, items: [], total: 0 };
  try {
    const res = await fetch(`${API_BASE}/api/parts?ids=${ids.join(",")}`, {
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: "http", status: res.status };
    const data = await res.json();
    return { ok: true, items: data.items, total: data.total };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function getFilterOptions(category: string): Promise<FilterOptions> {
  try {
    const res = await fetch(
      `${API_BASE}/api/parts/filters?category=${category}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

export async function shareBuild(
  build: Partial<Record<SlotKey, number>>
): Promise<{ code: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/builds/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(build),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getSharedBuild(
  code: string
): Promise<Partial<Record<SlotKey, Part>> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/builds/share/${code}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
