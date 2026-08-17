import { cache } from "react";
import { API_BASE } from "@/lib/api";

export interface PrebuiltComponents {
  cpu?: string;
  gpu?: string;
  ram?: string;
  storage?: string;
  motherboard?: string;
  psu?: string;
  case?: string;
  cpu_cooler?: string;
}

export interface Prebuilt {
  id: number;
  name: string;
  source: string;
  url: string;
  thumbnail_url: string | null;
  price_pkr: number | null;
  components: PrebuiltComponents | null;
  scraped_at: string;
}

export interface PrebuiltsParams {
  source?: string;
  min_price?: number;
  max_price?: number;
  q?: string;
  cpu_brand?: string;
  gpu_brand?: string;
  sort?: "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
}

export type PrebuiltsResult =
  | { ok: true; items: Prebuilt[]; total: number }
  | { ok: false; error: "network" | "http"; status?: number };

export async function getPrebuilts(
  params: PrebuiltsParams = {}
): Promise<PrebuiltsResult> {
  const qs = new URLSearchParams();
  if (params.source)                qs.set("source", params.source);
  if (params.min_price != null)     qs.set("min_price", String(params.min_price));
  if (params.max_price != null)     qs.set("max_price", String(params.max_price));
  if (params.q)                     qs.set("q", params.q);
  if (params.cpu_brand)             qs.set("cpu_brand", params.cpu_brand);
  if (params.gpu_brand)             qs.set("gpu_brand", params.gpu_brand);
  if (params.sort)                  qs.set("sort", params.sort);
  if (params.limit != null)         qs.set("limit", String(params.limit));
  if (params.offset != null)        qs.set("offset", String(params.offset));

  try {
    const res = await fetch(`${API_BASE}/api/prebuilts?${qs}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return { ok: false, error: "http", status: res.status };
    const data = await res.json();
    return { ok: true, items: data.items, total: data.total };
  } catch {
    return { ok: false, error: "network" };
  }
}

// Wrapped in React `cache()` so `generateMetadata` and the page component —
// which both need the same prebuilt during one render pass — share a single
// network call explicitly, rather than relying on Next's fetch-option-match
// dedup (fragile: any future divergence in options silently doubles load on
// the most-linked page type) (M27).
export const getPrebuilt = cache(async function getPrebuilt(
  id: number
): Promise<Prebuilt | null> {
  try {
    const res = await fetch(`${API_BASE}/api/prebuilts/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
});
