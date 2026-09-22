import { describe, expect, it } from "vitest";
import type { Prebuilt } from "../prebuilts-api";
import {
  BUDGETS,
  budgetBySlug,
  budgetDescription,
  budgetFaqs,
  budgetIntro,
  budgetTitle,
  listJoin,
  monthYear,
  prebuiltsInBudget,
  summarizeBudget,
  topValues,
} from "../budgets";

function pb(id: number, price: number | null, gpu: string, cpu: string, source = "techmatched.pk"): Prebuilt {
  return {
    id,
    name: `PC ${id}`,
    source,
    url: `https://example.pk/${id}`,
    thumbnail_url: null,
    price_pkr: price,
    components: { gpu, cpu },
    scraped_at: "2026-09-01T00:00:00",
  };
}

const items = [
  pb(1, 95_000, "RX 580 8GB", "Ryzen 5 2600", "redtech.pk"),
  pb(2, 150_000, "GTX 1660 Super", "Core i5-12400F"),
  pb(3, 149_000, "GTX 1660 Super", "Ryzen 5 5600"),
  pb(4, 150_001, "RTX 3060", "Ryzen 5 5600"),
  pb(5, null, "RTX 4060", "Ryzen 5 7500F"),
];

describe("budget selection", () => {
  it("is cumulative, inclusive and most-expensive first", () => {
    expect(prebuiltsInBudget(items, 150_000).map(p => p.id)).toEqual([2, 3, 1]);
    expect(prebuiltsInBudget(items, 100_000).map(p => p.id)).toEqual([1]);
  });

  it("looks budgets up by slug", () => {
    expect(budgetBySlug("150k")?.max).toBe(150_000);
    expect(budgetBySlug("999k")).toBeUndefined();
    expect(BUDGETS.map(b => b.slug)).toEqual(["100k", "150k", "200k", "300k"]);
  });
});

describe("summaries and copy", () => {
  const b = budgetBySlug("150k")!;
  const inBudget = prebuiltsInBudget(items, b.max);
  const s = summarizeBudget(inBudget);

  it("summarises count, range, stores and common parts", () => {
    expect(s.count).toBe(3);
    expect(s.min).toBe(95_000);
    expect(s.max).toBe(150_000);
    expect(s.stores).toEqual(["TechMatched", "Red Tech"]);
    expect(s.topGpus[0]).toBe("GTX 1660 Super");
  });

  it("writes a title with lakh and month", () => {
    expect(budgetTitle(b, new Date("2026-09-15T12:00:00Z")))
      .toBe("Best Gaming PC Under 150k in Pakistan (1.5 Lakh) — September 2026 Prices");
  });

  it("uses Pakistan time for the month", () => {
    expect(monthYear(new Date("2026-09-30T20:00:00Z"))).toBe("October 2026");
  });

  it("mentions count, range and stores in description and intro", () => {
    const d = budgetDescription(b, s);
    expect(d).toContain("3 pre-built gaming PCs under 1.5 Lakh");
    expect(d).toContain("TechMatched and Red Tech");
    expect(budgetIntro(b, s)).toContain("GTX 1660 Super");
  });

  it("answers FAQs from the top pick", () => {
    const faqs = budgetFaqs(b, inBudget, s);
    expect(faqs[0].a).toContain("PC 2");
    expect(faqs[0].a).toContain("Core i5-12400F and GTX 1660 Super");
    expect(faqs.length).toBe(3);
  });

  it("handles an empty bucket", () => {
    const empty = summarizeBudget([]);
    expect(empty.min).toBeNull();
    expect(budgetFaqs(b, [], empty)).toEqual([]);
    expect(budgetIntro(b, empty)).toContain("No pre-built gaming PCs");
  });
});

describe("helpers", () => {
  it("ranks values by frequency", () => {
    expect(topValues(["a", "b", "b", null, "c", "c", "c"], 2)).toEqual(["c", "b"]);
  });

  it("joins lists in prose", () => {
    expect(listJoin([])).toBe("");
    expect(listJoin(["a"])).toBe("a");
    expect(listJoin(["a", "b", "c"])).toBe("a, b and c");
  });
});
