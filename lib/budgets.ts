import type { Prebuilt } from "./prebuilts-api";
import { cleanPrebuiltName, formatPkr, prebuiltCpu, prebuiltGpu, storeName } from "./seo";

export interface Budget {
  /** URL segment: /gaming-pc-under/<slug> */
  slug: string;
  /** Inclusive upper bound in PKR. */
  max: number;
  /** "1.5 Lakh" — how Pakistani buyers actually phrase the budget. */
  lakh: string;
  /** "150K" — box label on the pulldown. */
  short: string;
}

export const BUDGETS: readonly Budget[] = [
  { slug: "100k", max: 100_000, lakh: "1 Lakh",   short: "100K" },
  { slug: "150k", max: 150_000, lakh: "1.5 Lakh", short: "150K" },
  { slug: "200k", max: 200_000, lakh: "2 Lakh",   short: "200K" },
  { slug: "300k", max: 300_000, lakh: "3 Lakh",   short: "300K" },
];

export const MAX_BUDGET = BUDGETS[BUDGETS.length - 1].max;

export function budgetBySlug(slug: string): Budget | undefined {
  return BUDGETS.find(b => b.slug === slug);
}

/** Every priced prebuilt at or under the budget, most expensive first. */
export function prebuiltsInBudget(items: Prebuilt[], max: number): Prebuilt[] {
  return items
    .filter(p => p.price_pkr != null && p.price_pkr > 0 && p.price_pkr <= max)
    .sort((a, b) => (b.price_pkr ?? 0) - (a.price_pkr ?? 0));
}

/** The `n` most frequent non-null values, most frequent first (ties: first seen). */
export function topValues(values: (string | null)[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([v]) => v);
}

export interface BudgetSummary {
  count: number;
  min: number | null;
  max: number | null;
  stores: string[];
  topGpus: string[];
  topCpus: string[];
}

/** Expects the output of prebuiltsInBudget (priced, most expensive first). */
export function summarizeBudget(items: Prebuilt[]): BudgetSummary {
  const prices = items.map(p => p.price_pkr as number);
  return {
    count: items.length,
    min: prices.length ? Math.min(...prices) : null,
    max: prices.length ? Math.max(...prices) : null,
    stores: [...new Set(items.map(p => storeName(p.source)))],
    topGpus: topValues(items.map(prebuiltGpu), 4),
    topCpus: topValues(items.map(prebuiltCpu), 3),
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "September 2026", in Pakistan time so a UTC render near midnight agrees. */
export function monthYear(date: Date): string {
  const pk = new Date(date.getTime() + 5 * 60 * 60 * 1000);
  return `${MONTHS[pk.getUTCMonth()]} ${pk.getUTCFullYear()}`;
}

export function budgetHeading(b: Budget): string {
  return `Best Gaming PC Under ${b.short.toLowerCase()} in Pakistan`;
}

export function budgetTitle(b: Budget, date: Date): string {
  return `${budgetHeading(b)} (${b.lakh}) — ${monthYear(date)} Prices`;
}

/** "A, B and C" */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function budgetDescription(b: Budget, s: BudgetSummary): string {
  if (s.count === 0 || s.min == null || s.max == null) {
    return `Pre-built gaming PCs under ${formatPkr(b.max)} (${b.lakh}) from Pakistani stores, updated weekly on RigPK.`;
  }
  return (
    `${s.count} pre-built gaming PC${s.count === 1 ? "" : "s"} under ${b.lakh} (${formatPkr(b.max)}) ` +
    `from ${listJoin(s.stores)}, priced ${formatPkr(s.min)} to ${formatPkr(s.max)}. ` +
    `Compare CPU, GPU and price, updated weekly.`
  );
}

/** Server-rendered intro paragraph for a budget page, from live data. */
export function budgetIntro(b: Budget, s: BudgetSummary): string {
  if (s.count === 0 || s.min == null || s.max == null) {
    return `No pre-built gaming PCs are listed under ${formatPkr(b.max)} right now. Stock changes weekly, so check back soon or try a higher budget.`;
  }
  const parts = [
    `We found ${s.count} pre-built gaming PC${s.count === 1 ? "" : "s"} under ${b.lakh} (${formatPkr(b.max)}) ` +
      `across ${listJoin(s.stores)}, from ${formatPkr(s.min)} up to ${formatPkr(s.max)}.`,
  ];
  if (s.topGpus.length) {
    parts.push(`At this budget the most common graphics cards are the ${listJoin(s.topGpus)}.`);
  }
  if (s.topCpus.length) {
    parts.push(`Typical processors include the ${listJoin(s.topCpus)}.`);
  }
  parts.push("Listed most expensive first, so the strongest build within budget is at the top.");
  return parts.join(" ");
}

export interface Faq {
  q: string;
  a: string;
}

/** FAQ entries answered from live data. Empty budgets get no FAQ. */
export function budgetFaqs(b: Budget, items: Prebuilt[], s: BudgetSummary): Faq[] {
  if (items.length === 0 || s.min == null) return [];
  const top = items[0];
  const topGpu = prebuiltGpu(top);
  const topCpu = prebuiltCpu(top);
  const specs = [topCpu, topGpu].filter(Boolean).join(" and ");
  const faqs: Faq[] = [
    {
      q: `What is the best gaming PC under ${b.short.toLowerCase()} in Pakistan?`,
      a:
        `The most powerful pre-built we track under ${b.lakh} is the ${cleanPrebuiltName(top.name)}` +
        (specs ? `, with a ${specs}` : "") +
        `, at ${formatPkr(top.price_pkr as number)} from ${storeName(top.source)}.`,
    },
  ];
  if (s.topGpus.length) {
    faqs.push({
      q: `Which GPU can I get in a PC under ${b.lakh}?`,
      a: `Pre-builts under ${formatPkr(b.max)} currently ship with the ${listJoin(s.topGpus)}` +
        (topGpu ? `. The most expensive build at this budget uses the ${topGpu}.` : "."),
    });
  }
  faqs.push({
    q: `What is the cheapest gaming PC under ${b.lakh} in Pakistan?`,
    a: `The cheapest listed right now starts at ${formatPkr(s.min)}` +
      (s.count > 1 ? `, and ${s.count} PCs fit the budget in total.` : "."),
  });
  return faqs;
}
