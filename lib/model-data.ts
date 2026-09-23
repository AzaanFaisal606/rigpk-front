import { cache } from "react";
import { API_BASE, type Part } from "./api";
import type { ModelCategory } from "./models";

/** Model pages and the model pulldown both revalidate hourly. */
export const MODEL_REVALIDATE = 3600;

const PAGE_LIMIT = 100; // backend cap on `limit` for /api/parts

export type CatalogueResult = { ok: true; items: Part[] } | { ok: false };

/**
 * Every active listing in a category, specs included. Pages until `total` is
 * reached and fails (rather than returning a short list) if the pages don't
 * add up: Turso can return zero rows with no error, and a truncated reply
 * must never read as the whole catalogue.
 */
export async function fetchCatalogue(
  category: ModelCategory,
  fetcher: typeof fetch = fetch
): Promise<CatalogueResult> {
  try {
    const items: Part[] = [];
    let total = 0;
    for (let offset = 0; offset === 0 || offset < total; offset += PAGE_LIMIT) {
      const res = await fetcher(
        `${API_BASE}/api/parts?category=${category}&limit=${PAGE_LIMIT}&offset=${offset}`,
        { next: { revalidate: MODEL_REVALIDATE } }
      );
      if (!res.ok) return { ok: false };
      const data = await res.json();
      total = data.total;
      items.push(...data.items);
      if (data.items.length === 0) break;
    }
    if (items.length !== total) return { ok: false };
    return { ok: true, items };
  } catch {
    return { ok: false };
  }
}

/**
 * One fetch per category, shared by generateMetadata, the page and the
 * pulldown within a render. Across renders the hourly fetch cache holds it,
 * so traffic doesn't multiply the API calls.
 */
export const getCategoryCatalogue = cache(
  (category: ModelCategory): Promise<CatalogueResult> => fetchCatalogue(category)
);

export interface ModelCount {
  count: number;
  min: number | null;
}
