/**
 * Cache policy for everything built from scraped data: the homepage, /trends,
 * part, model and budget pages, the sitemap, and the menus they share.
 *
 * That data only changes when a scrape writes the DB, so it is cached until the
 * scrape says otherwise. After every scrape, the backend's
 * scripts/refresh_site_cache.py marks CATALOG_TAG stale through Vercel's
 * invalidate-by-tag API. Each tagged page then rebuilds once, on its next
 * visit, serving the old copy until the rebuild is done. Every rebuild is an
 * ISR write (Vercel Hobby: 200k write units a month), so a timed window only
 * adds rebuilds when nothing changed.
 *
 * Every fetch and unstable_cache entry holding scraped data carries the tag. A
 * page picks up the tags of the fetches it renders, which is how one call
 * reaches every page. During that rebuild Next waits for fresh data on stale
 * fetch entries, so the new page never holds the old data.
 *
 * CATALOG_REVALIDATE is only a backstop for a missed refresh. Route segment
 * `revalidate` exports must be literals (Next reads them statically), so the
 * pages repeat this number; keep them in step.
 */
export const CATALOG_TAG = "catalog";

/** 30 days. Vercel drops ISR entries unvisited for 31 days anyway. */
export const CATALOG_REVALIDATE = 2592000;

/** `fetch` options for scraped data. */
export const CATALOG_FETCH = { revalidate: CATALOG_REVALIDATE, tags: [CATALOG_TAG] };
