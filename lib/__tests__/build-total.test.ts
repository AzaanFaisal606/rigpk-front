/**
 * Two sticks of RAM cost twice as much as one. The builder's headline number
 * was wrong for essentially every real build.
 */
import { describe, expect, it } from "vitest";
import { buildTotal } from "@/lib/build-total";

const part = (price: number) => ({ id: 1, price_pkr: price } as never);

describe("buildTotal", () => {
  it("multiplies by quantity", () => {
    expect(buildTotal({ ram: { part: part(10000), qty: 2 } } as never)).toBe(20000);
  });

  it("treats a missing qty as 1", () => {
    expect(buildTotal({ cpu: { part: part(50000), qty: 1 } } as never)).toBe(50000);
  });

  it("ignores empty slots", () => {
    expect(buildTotal({ cpu: null, ram: { part: part(10000), qty: 3 } } as never)).toBe(30000);
  });
});
