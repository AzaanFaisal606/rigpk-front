/**
 * Three pagination helpers encoded the old default as an omission rule:
 *   if (sort !== "price_asc") params.set("sort", sort)
 * Flip the default without fixing those and Next/Prev drop the param, so
 * page 2 silently re-sorts the other way.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_SORT, buildPageUrl } from "@/lib/constants";

describe("sort default", () => {
  it("is descending", () => {
    expect(DEFAULT_SORT).toBe("price_desc");
  });

  it("keeps the sort param across pagination", () => {
    const url = buildPageUrl({ category: "gpu", sort: DEFAULT_SORT, offset: 50 });
    expect(url).toContain("sort=price_desc");
  });

  it("keeps a non-default sort across pagination", () => {
    const url = buildPageUrl({ category: "gpu", sort: "price_asc", offset: 50 });
    expect(url).toContain("sort=price_asc");
  });
});
