const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export async function getPrebuilts(
  params: PrebuiltsParams = {}
): Promise<{ items: Prebuilt[]; total: number }> {
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
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export async function getPrebuilt(id: number): Promise<Prebuilt | null> {
  try {
    const res = await fetch(`${API_BASE}/api/prebuilts/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
