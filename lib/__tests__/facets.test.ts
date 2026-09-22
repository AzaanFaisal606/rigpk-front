import { describe, expect, it } from "vitest";
import { MARKET_ROUTE_CATEGORIES, SPEC_KEYS } from "../constants";
import {
  FACETS,
  allFacetRoutes,
  facetBySlug,
  facetForQuery,
  facetPath,
  facetTitle,
} from "../facets";

describe("facet definitions", () => {
  it("only use real categories and filterable spec keys", () => {
    for (const [category, list] of Object.entries(FACETS)) {
      expect(MARKET_ROUTE_CATEGORIES).toContain(category);
      for (const f of list ?? []) expect(SPEC_KEYS).toContain(f.key);
    }
  });

  it("have URL-safe slugs, unique within their category", () => {
    for (const list of Object.values(FACETS)) {
      const slugs = (list ?? []).map(f => f.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("never map two facets in a category to the same filter", () => {
    for (const list of Object.values(FACETS)) {
      const filters = (list ?? []).map(f => `${f.key}=${f.value.toLowerCase()}`);
      expect(new Set(filters).size).toBe(filters.length);
    }
  });
});

describe("facetBySlug / facetPath / allFacetRoutes", () => {
  it("round-trips a slug to its path", () => {
    const f = facetBySlug("ram", "ddr5")!;
    expect(f).toMatchObject({ key: "ddr_type", value: "DDR5" });
    expect(facetPath("ram", f)).toBe("/market/ram/ddr5");
  });

  it("scopes slugs to their category", () => {
    expect(facetBySlug("cpu", "am5")?.name).toBe("AM5 Processor");
    expect(facetBySlug("motherboard", "am5")?.name).toBe("AM5 Motherboard");
    expect(facetBySlug("ram", "am5")).toBeUndefined();
    expect(facetBySlug("banana", "am5")).toBeUndefined();
  });

  it("lists every facet once", () => {
    const total = Object.values(FACETS).reduce((n, l) => n + (l?.length ?? 0), 0);
    expect(allFacetRoutes()).toHaveLength(total);
  });
});

describe("facetForQuery", () => {
  const q = (s: string) => new URLSearchParams(s);

  it("matches a query that is exactly one facet's filter", () => {
    expect(facetForQuery("ram", q("ddr_type=DDR5"))?.slug).toBe("ddr5");
    expect(facetForQuery("psu", q("rating=80%2B+Gold"))?.slug).toBe("80-plus-gold");
  });

  it("compares values case-insensitively", () => {
    expect(facetForQuery("ram", q("ddr_type=ddr5"))?.slug).toBe("ddr5");
  });

  it("rejects anything the clean URL can't carry", () => {
    expect(facetForQuery("ram", q(""))).toBeUndefined();
    expect(facetForQuery("ram", q("ddr_type=DDR5&sort=price_desc"))).toBeUndefined();
    expect(facetForQuery("ram", q("ddr_type=DDR5&ddr_type=DDR4"))).toBeUndefined();
    expect(facetForQuery("ram", q("ddr_type=DDR3"))).toBeUndefined();
    expect(facetForQuery("gpu", q("ddr_type=DDR5"))).toBeUndefined();
  });
});

describe("facetTitle", () => {
  it("reads as a search phrase", () => {
    expect(facetTitle(facetBySlug("ssd", "nvme")!)).toBe("NVMe SSD Prices in Pakistan");
  });
});
