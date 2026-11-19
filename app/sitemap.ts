import type { MetadataRoute } from "next";
import { getPrebuilts } from "@/lib/prebuilts-api";
import { MARKET_ROUTE_CATEGORIES } from "@/lib/constants";
import { BUDGETS } from "@/lib/budgets";
import { allFacetRoutes, facetPath } from "@/lib/facets";
import { MODELS, modelPath } from "@/lib/models";
import { SITE_URL as BASE } from "@/lib/seo";
import { getIndexableParts, PART_REVALIDATE, partPath } from "@/lib/part-page";

/** scraped_at as a Date, or undefined when it doesn't parse. */
function toDate(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// Rebuilt once a week (PART_REVALIDATE; segment config must be a literal):
// part pages are the bulk of it and only change on the weekly scrape, and each
// build is one full read of the indexable parts.
export const revalidate = 604800;

// Static pages carry no lastModified: stamping them with the request time
// told crawlers everything changed on every fetch, which made the field useless.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ~144 active prebuilts as of the last DB snapshot — 200 covers the whole
  // catalogue in one page (backend caps `limit` at 200).
  // Week-long fetch, same as the route: the default 30s window set the whole
  // sitemap's revalidate to 30s (a route revalidates at its shortest fetch),
  // rebuilding it — and re-reading every indexable part — on nearly every
  // crawler hit.
  const prebuiltsResult = await getPrebuilts({ limit: 200 }, { revalidate: PART_REVALIDATE });
  const prebuiltUrls: MetadataRoute.Sitemap = prebuiltsResult.ok
    ? prebuiltsResult.items.map(p => ({
        url: `${BASE}/prebuilts/${p.id}`,
        lastModified: toDate(p.scraped_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    : [];

  // Only indexable part pages (active, priced, with retailer content): the
  // rest are noindex, and a sitemap must not list pages it asks to drop.
  // At runtime a failed fetch throws, so ISR keeps serving the last good
  // sitemap instead of caching one with every part missing for a week. At
  // build time (Render may be cold) it leaves them out rather than failing
  // the deploy. No lastModified: last_seen_at moves on every scrape, which
  // would make the field meaningless to crawlers.
  const parts = await getIndexableParts();
  if (!parts && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("sitemap: indexable parts unavailable");
  }
  const partUrls: MetadataRoute.Sitemap = (parts ?? []).map(p => ({
    url: `${BASE}${partPath(p)}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

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
    ...MODELS.map(m => ({
      url: `${BASE}${modelPath(m)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...prebuiltUrls,
    ...partUrls,
  ];
}
