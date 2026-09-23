import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/api";
import {
  MODELS, MODEL_SERIES, modelBySlug, modelPath, partsForModel, siblings, summarizeModel, thumbCandidates,
  modelTitle, modelDescription, modelFaqs, storeList,
} from "@/lib/models";

// Copy of scrapers/spec_extractor.py _GPU_MODELS ∪ _CPU_MODELS values used by the catalog.
// If a catalog value is missing here, the backend will never emit it and the page stays empty.
const BACKEND_MODELS = new Set([
  "RTX 5090","RTX 5080","RTX 5070 Ti","RTX 5070","RTX 5060 Ti","RTX 5060","RTX 5050",
  "RTX 4090","RTX 4080 Super","RTX 4080","RTX 4070 Ti Super","RTX 4070 Ti","RTX 4070 Super",
  "RTX 4070","RTX 4060 Ti","RTX 4060","RTX 3090 Ti","RTX 3090","RTX 3080 Ti","RTX 3080",
  "RTX 3070 Ti","RTX 3070","RTX 3060 Ti","RTX 3060","RTX 3050",
  "RX 9070 XT","RX 9070 GRE","RX 9070","RX 9060 XT","RX 9060","RX 7900 XTX","RX 7900 XT",
  "RX 7900 GRE","RX 7800 XT","RX 7700 XT","RX 7650 GRE","RX 7600 XT","RX 7600","RX 6950 XT",
  "RX 6900 XT","RX 6800 XT","RX 6800","RX 6750 XT","RX 6700 XT","RX 6650 XT","RX 6600 XT",
  "RX 6600","RX 6500 XT","RX 6400",
  "Ryzen 9 9950X3D","Ryzen 9 9950X","Ryzen 9 9900X3D","Ryzen 9 9900X","Ryzen 7 9800X3D",
  "Ryzen 7 9700X","Ryzen 5 9600X","Ryzen 9 7950X","Ryzen 9 7900X","Ryzen 7 7800X3D",
  "Ryzen 7 7700X","Ryzen 7 7700","Ryzen 5 7600X","Ryzen 5 7600","Ryzen 5 7500F",
  "Ryzen 7 5800X","Ryzen 7 5700X","Ryzen 5 5600X","Ryzen 5 5600",
  "Ultra 9 285K","Ultra 7 265K","Ultra 7 265KF","Ultra 5 245K","Ultra 5 245KF",
  "i9-14900K","i9-14900KF","i7-14700K","i7-14700KF","i5-14600K","i5-14600KF","i5-14400F","i3-14100F",
  "i9-13900K","i9-13900KF","i7-13700K","i7-13700KF","i5-13600K","i5-13600KF","i5-13400F",
  "i9-12900K","i9-12900KF","i7-12700K","i7-12700KF","i5-12600K","i5-12600KF","i5-12400F","i3-12100F",
]);

function part(id: number, model: string | null, vram: string | null, price: number | null, source = "zahcomputers.pk"): Part {
  return { id, source, name: `${model} card`, category: "gpu", url: `https://x/${id}`,
    thumbnail_url: null, price_pkr: price, specs: { model, vram } as never };
}

describe("catalog", () => {
  it("has 70 entries, 35 per category, unique slugs", () => {
    expect(MODELS).toHaveLength(70);
    expect(MODELS.filter(m => m.category === "gpu")).toHaveLength(35);
    expect(new Set(MODELS.map(m => `${m.category}/${m.slug}`)).size).toBe(70);
  });
  it("only uses model values the backend emits", () => {
    for (const m of MODELS) for (const v of m.models) expect(BACKEND_MODELS.has(v), v).toBe(true);
  });
  it("every entry's series exists and matches its category and brand", () => {
    for (const m of MODELS) {
      const s = MODEL_SERIES.find(x => x.key === m.series);
      expect(s, m.slug).toBeDefined();
      expect(s!.category).toBe(m.category);
      expect(s!.brand).toBe(m.brand);
    }
  });
  it("slugs are lowercase url-safe", () => {
    for (const m of MODELS) expect(m.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it("looks up by category and slug only", () => {
    expect(modelBySlug("gpu", "rtx-4060")?.label).toBe("RTX 4060");
    expect(modelBySlug("cpu", "rtx-4060")).toBeUndefined();
    expect(modelPath(modelBySlug("cpu", "core-i5-14600k")!)).toBe("/cpu/core-i5-14600k");
  });
  it("siblings are the rest of the series", () => {
    const e = modelBySlug("gpu", "rtx-4060")!;
    const sib = siblings(e);
    expect(sib.map(s => s.slug)).not.toContain("rtx-4060");
    expect(sib.every(s => s.series === "rtx-40")).toBe(true);
    expect(sib).toHaveLength(6);
  });
});

describe("partsForModel", () => {
  const parts = [
    part(1, "RTX 4060 Ti", "8GB", 120000),
    part(2, "RTX 4060 Ti", "16GB", 150000),
    part(3, "RTX 4060 Ti", null, 130000),
    part(4, "RX 9070", "20GB", 200000),   // bogus VRAM from a Sapphire SKU
    part(5, "RX 9070", "16GB", 190000),
    part(6, "RTX 4060", "8GB", null),     // no price → dropped
  ];
  it("variant entries match VRAM exactly and drop null VRAM", () => {
    expect(partsForModel(parts, modelBySlug("gpu", "rtx-4060-ti-8gb")!).map(p => p.id)).toEqual([1]);
    expect(partsForModel(parts, modelBySlug("gpu", "rtx-4060-ti-16gb")!).map(p => p.id)).toEqual([2]);
  });
  it("single-VRAM entries ignore VRAM, sort cheapest first", () => {
    expect(partsForModel(parts, modelBySlug("gpu", "rx-9070")!).map(p => p.id)).toEqual([5, 4]);
  });
  it("drops unpriced rows", () => {
    expect(partsForModel(parts, modelBySlug("gpu", "rtx-4060")!)).toEqual([]);
  });
  it("K/KF entries match both", () => {
    const cpu = [
      { ...part(7, "i5-14600K", null, 70000), category: "cpu" },
      { ...part(8, "i5-14600KF", null, 65000), category: "cpu" },
    ];
    expect(partsForModel(cpu, modelBySlug("cpu", "core-i5-14600k")!).map(p => p.id)).toEqual([8, 7]);
  });
});

describe("text", () => {
  const e = modelBySlug("gpu", "rtx-4060")!;
  const date = new Date("2026-09-15T12:00:00Z");
  it("title with and without listings", () => {
    const s = summarizeModel([part(1, "RTX 4060", "8GB", 89500), part(2, "RTX 4060", "8GB", 112000, "czone.com.pk")]);
    expect(modelTitle(e, s, date)).toBe("RTX 4060 Price in Pakistan (September 2026) — from Rs 89,500");
    expect(modelTitle(e, summarizeModel([]), date)).toBe("RTX 4060 Price in Pakistan (September 2026)");
    expect(modelDescription(e, s)).toContain("2 RTX 4060 listings");
    expect(modelDescription(e, s)).toContain("Rs 89,500 to Rs 112,000");
    expect(modelDescription(e, s)).not.toContain("RigPK");
  });
  it("no FAQ when nothing is listed", () => {
    expect(modelFaqs(e, summarizeModel([]), date)).toEqual([]);
  });
  it("storeList caps at three", () => {
    expect(storeList(["A", "B"])).toBe("A and B");
    expect(storeList(["A", "B", "C", "D", "E"])).toBe("A, B, C and 2 more stores");
  });
});

describe("thumbCandidates", () => {
  const withThumb = (id: number, url: string | null): Part => ({ ...part(id, "RTX 4060 Ti", "8GB", 100000 + id), thumbnail_url: url });
  it("puts thumbnails naming the model's number first, keeping order otherwise", () => {
    const parts = [
      withThumb(1, "https://x/MSI-RTX-4070-Super-Ventus.jpg"),   // retailer reused another card's photo
      withThumb(2, "https://x/files/19643/abc.png"),
      withThumb(3, "https://x/zotac-rtx-4060-ti-8gb.webp"),
      withThumb(4, "https://x/Asus-Dual-RTX-4060Ti.webp"),
    ];
    expect(thumbCandidates(parts, modelBySlug("gpu", "rtx-4060-ti-8gb")!)).toEqual([
      "https://x/zotac-rtx-4060-ti-8gb.webp",
      "https://x/Asus-Dual-RTX-4060Ti.webp",
      "https://x/MSI-RTX-4070-Super-Ventus.jpg",
      "https://x/files/19643/abc.png",
    ]);
  });
  it("matches CPU numbers and drops missing and duplicate thumbnails", () => {
    const cpu = [
      { ...withThumb(1, null), specs: { model: "i5-14600KF" } as never },
      { ...withThumb(2, "https://x/Intel-Core-i5-14600KF.jpg"), specs: { model: "i5-14600KF" } as never },
      { ...withThumb(3, "https://x/Intel-Core-i5-14600KF.jpg"), specs: { model: "i5-14600K" } as never },
    ];
    expect(thumbCandidates(cpu, modelBySlug("cpu", "core-i5-14600k")!)).toEqual(["https://x/Intel-Core-i5-14600KF.jpg"]);
  });
});
