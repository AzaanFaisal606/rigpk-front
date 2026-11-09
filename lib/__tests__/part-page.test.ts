import { describe, expect, it } from "vitest";
import type { Part, PartDetails } from "@/lib/api";
import {
  hasContent, modelForPart, parsePartParam, partDescription, partIsIndexable, partPath, partSlug, type PartPage,
} from "@/lib/part-page";
import { partCachePath } from "@/lib/part-slug";

const empty: PartDetails = { overview: null, highlights: [], specs: [] };

function page(over: Partial<PartPage> = {}): PartPage {
  return {
    id: 7, source: "czone", name: "X", category: "gpu", url: "https://czone.com.pk/x",
    thumbnail_url: null, price_pkr: 100, specs: null, condition: null,
    is_active: true, last_seen_at: null, details: { ...empty, overview: "Real text." }, ...over,
  };
}

describe("partSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(partSlug("MSI GeForce RTX 4060 Ti Ventus 2X Black 8GB OC"))
      .toBe("msi-geforce-rtx-4060-ti-ventus-2x-black-8gb-oc");
  });
  it("folds accents and drops symbols", () => {
    expect(partSlug("Corsair® RM850e — 850W (Café)")).toBe("corsair-rm850e-850w-cafe");
  });
  it("falls back when nothing survives", () => {
    expect(partSlug("® ✓ ★ پاکستان")).toBe("part");
  });
  it("caps at 80 chars without a trailing hyphen", () => {
    const s = partSlug("word ".repeat(60));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith("-")).toBe(false);
    expect(s.startsWith("word-word")).toBe(true);
  });
});

describe("partPath / parsePartParam", () => {
  it("builds /part/<id>-<slug>", () => {
    expect(partPath({ id: 123, name: "AMD Ryzen 5 7600" })).toBe("/part/123-amd-ryzen-5-7600");
  });
  it("reads the leading id", () => {
    expect(parsePartParam("123-amd-ryzen")).toBe(123);
    expect(parsePartParam("123")).toBe(123);
  });
  it("rejects junk", () => {
    expect(parsePartParam("abc")).toBeNull();
    expect(parsePartParam("0-x")).toBeNull();
    expect(parsePartParam("12abc")).toBeNull();
  });
});

describe("modelForPart", () => {
  const p = (category: string, specs: Part["specs"]) => ({ category, specs });
  it("picks the VRAM variant page", () => {
    expect(modelForPart(p("gpu", { model: "RTX 4060 Ti", vram: "16GB" }))?.slug).toBe("rtx-4060-ti-16gb");
  });
  it("uses the single-VRAM page whatever the VRAM", () => {
    expect(modelForPart(p("gpu", { model: "RTX 4060", vram: "20GB" }))?.slug).toBe("rtx-4060");
  });
  it("gives no link when a variant-only model has an unknown VRAM", () => {
    expect(modelForPart(p("gpu", { model: "RTX 4060 Ti", vram: "20GB" }))).toBeUndefined();
  });
  it("maps KF to the shared K page", () => {
    expect(modelForPart(p("cpu", { model: "i5-14600KF" }))?.slug).toBe("core-i5-14600k");
  });
  it("only for GPU and CPU", () => {
    expect(modelForPart(p("ram", { model: "RTX 4060" }))).toBeUndefined();
    expect(modelForPart(p("gpu", null))).toBeUndefined();
  });
});

describe("index rules", () => {
  it("hasContent", () => {
    expect(hasContent(empty)).toBe(false);
    expect(hasContent(null)).toBe(false);
    expect(hasContent({ ...empty, specs: [[null, "a", "b"]] })).toBe(true);
    expect(hasContent({ ...empty, highlights: ["x"] })).toBe(true);
  });
  it("partIsIndexable", () => {
    expect(partIsIndexable(page())).toBe(true);
    expect(partIsIndexable(page({ price_pkr: null }))).toBe(false);
    expect(partIsIndexable(page({ is_active: false }))).toBe(false);
    expect(partIsIndexable(page({ details: empty }))).toBe(false);
  });
});

describe("partDescription", () => {
  const base = page({
    name: "MSI GeForce RTX 4060 Ventus 2X Black 8GB OC", source: "czone.com.pk", price_pkr: 89500,
    specs: { brand: "MSI", model: "RTX 4060", vram: "8GB" }, last_seen_at: "2026-11-08T10:00:00Z",
  });
  it("carries price, store, month and chips", () => {
    const d = partDescription(base);
    expect(d).toContain("Rs 89,500");
    expect(d).toContain("CZone");
    expect(d).toContain("November 2026");
    expect(d).toContain("MSI · RTX 4060 · 8GB");
  });
  it("says out of stock when unpriced", () => {
    expect(partDescription({ ...base, price_pkr: null })).toContain("out of stock");
  });
  it("stays within 160 chars", () => {
    const d = partDescription({ ...base, name: "Very Long Name ".repeat(20) });
    expect(d.length).toBeLessThanOrEqual(160);
  });
});

describe("partCachePath", () => {
  it("collapses every slug variant of an id to one path", () => {
    expect(partCachePath("123-msi-rtx")).toBe("/part/123");
    expect(partCachePath("0123-x")).toBe("/part/123");
    expect(partCachePath("123")).toBe("/part/123");
  });
  it("rejects malformed and oversized ids", () => {
    expect(partCachePath("abc")).toBeNull();
    expect(partCachePath("12345678901-x")).toBeNull();
    expect(partCachePath("0-x")).toBeNull();
  });
});
