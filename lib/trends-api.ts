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

export async function getTrendGroups(
  category: TrendCategory
): Promise<TrendGroup[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/trends/groups?category=${category}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.groups ?? [];
  } catch {
    return [];
  }
}
