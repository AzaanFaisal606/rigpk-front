import type { MetadataRoute } from "next";
import { getPrebuilts } from "@/lib/prebuilts-api";
import { MARKET_ROUTE_CATEGORIES } from "@/lib/constants";
import { BUDGETS } from "@/lib/budgets";
import { allFacetRoutes, facetPath } from "@/lib/facets";
import { SITE_URL as BASE } from "@/lib/seo";

/** scraped_at as a Date, or undefined when it doesn't parse. */
function toDate(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// Static pages carry no lastModified: stamping them with the request time
// told crawlers everything changed on every fetch, which made the field useless.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ~144 active prebuilts as of the last DB snapshot — 200 covers the whole
  // catalogue in one page (backend caps `limit` at 200).
  const prebuiltsResult = await getPrebuilts({ limit: 200 });
  const prebuiltUrls: MetadataRoute.Sitemap = prebuiltsResult.ok
    ? prebuiltsResult.items.map(p => ({
        url: `${BASE}/prebuilts/${p.id}`,
        lastModified: toDate(p.scraped_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    : [];

  return [
    { url: BASE,                changeFrequency: "weekly",  priority: 1   },
    { url: `${BASE}/market`,    changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/build`,     changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/trends`,    changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/prebuilts`, changeFrequency: "daily",   priority: 0.9 },
    ...BUDGETS.map(b => ({
      url: `${BASE}/gaming-pc-under/${b.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...MARKET_ROUTE_CATEGORIES.map(c => ({
      url: `${BASE}/market/${c}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...allFacetRoutes().map(({ category, facet }) => ({
      url: `${BASE}${facetPath(category, facet)}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...prebuiltUrls,
  ];
}
