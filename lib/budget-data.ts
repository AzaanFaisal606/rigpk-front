// Server-only: pulls in thumb-check (sharp).
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { BUDGETS, MAX_BUDGET, prebuiltsInBudget, type Budget } from "./budgets";
import { getAllPrebuiltsUnder, type PrebuiltsResult } from "./prebuilts-api";
import { pickBackgroundlessThumbSettled } from "./thumb-check";

/**
 * Budget pages and the pulldown revalidate daily. Prebuilt data only changes
 * on the weekly scrape; the page title carries the month, which a day's lag
 * can't get wrong for long. The literal `revalidate` in
 * app/gaming-pc-under/[budget]/page.tsx must match.
 */
export const BUDGET_REVALIDATE = 86400;

/**
 * One fetch covers every bucket: all prebuilts under the largest budget,
 * filtered per bucket in memory. React `cache` shares it between
 * generateMetadata and the page within a render.
 */
export const getBudgetCatalogue = cache(
  (): Promise<PrebuiltsResult> => getAllPrebuiltsUnder(MAX_BUDGET, BUDGET_REVALIDATE)
);

export interface BudgetBucket {
  budget: Budget;
  count: number;
  maxPrice: number | null;
  thumb: string | null;
}

/**
 * Thrown out of the cached build when a thumbnail couldn't be checked: the
 * buckets are still usable for this render, but must not be stored for a day.
 */
class UnsettledBuckets extends Error {
  constructor(readonly buckets: BudgetBucket[]) {
    super("Budget buckets: a thumbnail check failed transiently");
  }
}

export async function buildBudgetBuckets(): Promise<BudgetBucket[]> {
  const res = await getBudgetCatalogue();
  // Thrown, not returned: unstable_cache must not store a failed build.
  if (!res.ok) throw new Error("Budget buckets: prebuilt catalogue fetch failed");
  let settled = true;
  const buckets = await Promise.all(
    BUDGETS.map(async budget => {
      const items = prebuiltsInBudget(res.items, budget.max);
      const pick = await pickBackgroundlessThumbSettled(items.map(p => p.thumbnail_url));
      settled &&= pick.settled;
      return {
        budget,
        count: items.length,
        maxPrice: items.length ? (items[0].price_pkr as number) : null,
        thumb: pick.src,
      };
    })
  );
  if (!settled) throw new UnsettledBuckets(buckets);
  return buckets;
}

/**
 * Cached as one entry across requests and instances, so a budget page or
 * /prebuilts render does no thumbnail work at all on a hit.
 */
const getCachedBuckets = unstable_cache(buildBudgetBuckets, ["budget-buckets-v1"], {
  revalidate: BUDGET_REVALIDATE,
});

/** Null when the catalogue fetch failed; the boxes then render without data. */
export async function getBudgetBuckets(): Promise<BudgetBucket[] | null> {
  try {
    return await getCachedBuckets();
  } catch (err) {
    return err instanceof UnsettledBuckets ? err.buckets : null;
  }
}
