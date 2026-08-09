import { describe, expect, it } from "vitest";
import { buildIndex } from "@/lib/search-index";

const payload = {
  srcs: ["czone.com.pk", "pakbyte.pk"],
  version: "v1",
  rows: [
    [1, "MSI GeForce RTX 5060 Ti Ventus 2X White 16GB", 0, 120000],
    [2, "Asus RTX 5060 OC Edition 8GB", 1, 90000],
    [3, "Gigabyte RTX5090 Windforce OC", 0, 900000],
    [4, "AMD Ryzen 7 9800X3D", 1, 150000],
  ] as [number, string, number, number][],
};

const base = { sort: "price_asc" as const, offset: 0, limit: 50 };

describe("client search index", () => {
  it("matches multi-word queries in any order", () => {
    expect(buildIndex(payload).query({ ...base, q: "5060 ti white" }).ids).toEqual([1]);
  });

  it("matches a merged token against a spaced name", () => {
    expect(buildIndex(payload).query({ ...base, q: "5060ti" }).ids).toEqual([1]);
  });

  it("matches a spaced query against a merged name", () => {
    expect(buildIndex(payload).query({ ...base, q: "5090" }).ids).toEqual([3]);
  });

  it("does not match a short token inside a longer word", () => {
    // "ti" must not match the "ti" in "Edition".
    expect(buildIndex(payload).query({ ...base, q: "5060 ti" }).ids).toEqual([1]);
  });

  it("sorts by price ascending and descending", () => {
    const idx = buildIndex(payload);
    expect(idx.query({ ...base, q: "rtx" }).ids).toEqual([2, 1, 3]);
    expect(idx.query({ ...base, q: "rtx", sort: "price_desc" }).ids).toEqual([3, 1, 2]);
  });

  it("filters by source and price range", () => {
    const idx = buildIndex(payload);
    expect(idx.query({ ...base, q: "rtx", source: "pakbyte.pk" }).ids).toEqual([2]);
    expect(idx.query({ ...base, q: "rtx", minPrice: 100000 }).ids).toEqual([1, 3]);
  });

  it("returns the full total alongside a paged slice", () => {
    const r = buildIndex(payload).query({ ...base, q: "rtx", limit: 2 });
    expect(r.ids).toHaveLength(2);
    expect(r.total).toBe(3);
  });

  it("total is the match count, not the page length, when more rows match than fit", () => {
    // Regression: a caller once published the *response*'s total (which is
    // just the page slice's length) instead of this one, silently pinning
    // every client-side result count to `limit` and hiding pagination past
    // page 1. Pin explicitly that `total` is never confused with `ids.length`.
    const r = buildIndex(payload).query({ ...base, q: "rtx", limit: 2 });
    expect(r.ids.length).toBe(2);
    expect(r.total).toBe(3);
    expect(r.total).not.toBe(r.ids.length);
  });

  it("returns everything for an empty query", () => {
    expect(buildIndex(payload).query({ ...base, q: "" }).total).toBe(4);
  });
});
