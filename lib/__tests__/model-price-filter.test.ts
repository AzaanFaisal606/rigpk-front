import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/api";
import { filterByPrice } from "@/lib/models";

function part(id: number, price: number): Part {
  return { id, source: "czone.com.pk", name: `Part ${id}`, category: "gpu", url: `https://x/${id}`,
    thumbnail_url: null, price_pkr: price, specs: null };
}

const parts = [part(1, 80000), part(2, 90000), part(3, 100000), part(4, 120000)];
const ids = (ps: Part[]) => ps.map(p => p.id);

describe("filterByPrice", () => {
  it("empty fields are unbounded", () => {
    expect(ids(filterByPrice(parts, "", ""))).toEqual([1, 2, 3, 4]);
  });
  it("min only", () => {
    expect(ids(filterByPrice(parts, "100000", ""))).toEqual([3, 4]);
  });
  it("strips non-digits from the max", () => {
    expect(ids(filterByPrice(parts, "", "90,000"))).toEqual([1, 2]);
  });
  it("a field with no digits counts as empty", () => {
    expect(ids(filterByPrice(parts, "abc", ""))).toEqual([1, 2, 3, 4]);
  });
  it("min above max matches nothing without throwing", () => {
    expect(filterByPrice(parts, "120000", "90000")).toEqual([]);
  });
});
