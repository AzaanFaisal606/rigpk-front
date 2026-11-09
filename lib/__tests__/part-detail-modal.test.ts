import { describe, expect, it } from "vitest";
import { fullImageUrl, nameFontPx } from "@/components/PartDetailModal";

describe("nameFontPx", () => {
  it("keeps short names at the max size", () => {
    expect(nameFontPx("Ryzen 5 7600X")).toBe(32);
  });
  it("steps long names down but never below the min", () => {
    const mid = nameFontPx("Zotac Gaming GeForce RTX 5060 Twin Edge 8GB Graphics Card");
    expect(mid).toBeLessThan(32);
    expect(mid).toBeGreaterThan(20);
    expect(nameFontPx("x".repeat(200))).toBe(20);
  });
});

describe("fullImageUrl", () => {
  it("drops the WordPress size suffix", () => {
    expect(fullImageUrl("https://rbtechngames.com/wp-content/uploads/2025/08/card-247x247.jpg"))
      .toBe("https://rbtechngames.com/wp-content/uploads/2025/08/card.jpg");
  });
  it("leaves other CDNs alone", () => {
    const u = "https://www.pakbyte.pk/cdn/shop/files/x-450x450.jpg?v=1";
    expect(fullImageUrl(u)).toBe(u);
  });
});
