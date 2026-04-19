const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Stats {
  total_parts: number;
  total_price_rows: number;
  by_source: Record<string, number>;
  by_category: Record<string, number>;
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

export interface PartsResult {
  items: Part[];
  total: number;
}

export interface PartsParams {
  category?: string;
  source?: string;
  min_price?: number;
  max_price?: number;
  sort?: "price_asc" | "price_desc";
  limit?: number;
  offset?: number;
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
    "category", "source", "min_price", "max_price", "sort", "limit", "offset",
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
    const res = await fetch(`${API_BASE}/api/parts?${query}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return { items: [], total: 0 };
    return res.json();
  } catch {
    return { items: [], total: 0 };
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
