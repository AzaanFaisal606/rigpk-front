// Server-only: pulls in thumb-check (sharp).
import { cache } from "react";
import { BUDGETS, MAX_BUDGET, prebuiltsInBudget, type Budget } from "./budgets";
import { getAllPrebuiltsUnder, type PrebuiltsResult } from "./prebuilts-api";
import { pickBackgroundlessThumb } from "./thumb-check";

/** Budget pages and the pulldown both revalidate hourly. */
export const BUDGET_REVALIDATE = 3600;

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

export async function getBudgetBuckets(): Promise<BudgetBucket[] | null> {
  const res = await getBudgetCatalogue();
  if (!res.ok) return null;
  return Promise.all(
    BUDGETS.map(async budget => {
      const items = prebuiltsInBudget(res.items, budget.max);
      return {
        budget,
        count: items.length,
        maxPrice: items.length ? (items[0].price_pkr as number) : null,
        thumb: await pickBackgroundlessThumb(items.map(p => p.thumbnail_url)),
      };
    })
  );
}
