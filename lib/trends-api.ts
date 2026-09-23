import { API_BASE } from "@/lib/api";

export interface TrendPoint {
  scrape_date: string;
  center_price: number;
  method: string;
  min_price: number;
  max_price: number;
  sample_count: number;
  used_count: number;
  /** Real median of that date's listings; null before the first rebuild with it. */
  median_price?: number | null;
}

export interface TrendGroup {
  group_key: string;
  latest_price: number;
  min_price: number;
  max_price: number;
  sample_count: number;
  /** Real prices on the latest date; null before the first rebuild with them. */
  median_price?: number | null;
  low_price?: number | null;
  high_price?: number | null;
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
