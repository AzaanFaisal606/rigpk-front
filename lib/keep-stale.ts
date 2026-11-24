import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * A failed backend fetch must not be cached as an ISR page's content: the page
 * would show the failure until the next scrape refreshes it (lib/catalog-cache.ts).
 * At runtime this throws, so ISR keeps serving the last good render and retries
 * on the next request. During `next build` (no previous render to fall back on)
 * and in dev it returns true, and the page renders its failure state instead of
 * breaking the build.
 *
 *   const failed = !res.ok && failOrRender("Model page: parts catalogue fetch failed");
 */
export function failOrRender(reason: string): true {
  const canKeepStale =
    process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD;
  if (canKeepStale) throw new Error(reason);
  return true;
}
