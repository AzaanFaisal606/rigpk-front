import { API_BASE } from "@/lib/api";

export interface TrendPoint {
  scrape_date: string;
  center_price: number;
  method: string;
  min_price: number;
  max_price: number;
  sample_count: number;
  used_count: number;
}

export interface TrendGroup {
  group_key: string;
  latest_price: number;
  min_price: number;
  max_price: number;
  sample_count: number;
  thumbnail_url: string | null;
  series: TrendPoint[];
}

export type TrendCategory = "gpu" | "cpu" | "ram";

export type TrendGroupsResult =
  | { ok: true; data: TrendGroup[] }
  | { ok: false; error: "network" | "http"; status?: number };

export async function getTrendGroups(
  category: TrendCategory
): Promise<TrendGroupsResult> {
  try {
    const res = await fetch(
      `${API_BASE}/api/trends/groups?category=${category}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return { ok: false, error: "http", status: res.status };
    const data = await res.json();
    return { ok: true, data: data.groups ?? [] };
  } catch {
    return { ok: false, error: "network" };
  }
}
