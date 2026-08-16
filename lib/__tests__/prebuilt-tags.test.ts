/**
 * Four of the seven tag rules were buggy, all from one root cause: they
 * matched hardcoded literals against raw scraped names, which carry real
 * spacing variance. `5060[^t]` only excluded the Ti when there was no space
 * before it, so a live row came back tagged both 1080P and 1440P at once.
 *
 * The fix routes every rule through the shared tokenizer, so "5060 Ti" and
 * "5060ti" become the identical token pair. Each rule below is therefore
 * asserted in BOTH spellings — a rule that passes only one of them is the
 * exact bug this file exists to catch.
 */
import { describe, expect, it } from "vitest";
import { derivePrebuiltTags } from "@/lib/prebuilt-tags";
import type { PrebuiltComponents } from "@/lib/prebuilts-api";

const c = (parts: Partial<PrebuiltComponents>): PrebuiltComponents =>
  parts as PrebuiltComponents;

describe("GPU tier tags", () => {
  it("tags 4K cards", () => {
    expect(derivePrebuiltTags(c({ gpu: "NVIDIA RTX 5090 32GB" }))).toContain("4K READY");
  });

  it.each(["RTX 5060 Ti 16GB", "RTX 5060ti 16GB", "RTX 5060 TI"])(
    "treats %s as 1440p and never also 1080p",
    gpu => {
      const tags = derivePrebuiltTags(c({ gpu }));
      expect(tags).toContain("1440P GAMING");
      expect(tags).not.toContain("1080P GAMING");
    }
  );

  it.each(["RTX 4060 Ti", "RTX 4060ti"])("treats %s as 1440p", gpu => {
    expect(derivePrebuiltTags(c({ gpu }))).toContain("1440P GAMING");
  });

  it("still treats a bare 5060 as 1080p", () => {
    const tags = derivePrebuiltTags(c({ gpu: "RTX 5060 8GB" }));
    expect(tags).toContain("1080P GAMING");
    expect(tags).not.toContain("1440P GAMING");
  });

  it("tags the Arc B580 as 1080p", () => {
    expect(derivePrebuiltTags(c({ gpu: "Intel Arc B580" }))).toContain("1080P GAMING");
  });
});

describe("3D V-Cache", () => {
  it.each(["Ryzen 7 9800X3D", "Ryzen 7 9800X 3D", "AMD RYZEN 9 7950x3d"])(
    "detects %s",
    cpu => {
      expect(derivePrebuiltTags(c({ cpu }))).toContain("3D V-CACHE");
    }
  );

  it("does not fire on a non-X3D chip", () => {
    expect(derivePrebuiltTags(c({ cpu: "Ryzen 7 9700X" }))).not.toContain("3D V-CACHE");
  });
});

describe("RAM capacity", () => {
  it.each(["32GB DDR5 6000MHz", "32 GB DDR5", "64GB Kit", "96GB DDR5", "192GB DDR5"])(
    "tags %s as high capacity",
    ram => {
      expect(derivePrebuiltTags(c({ ram }))).toContain("32GB+ RAM");
    }
  );

  it("does not tag a 16GB kit", () => {
    expect(derivePrebuiltTags(c({ ram: "16GB DDR5 5600" }))).not.toContain("32GB+ RAM");
  });
});

describe("DDR5", () => {
  it.each(["32GB DDR5 6000MHz", "DDR 5 6000"])("detects %s by name", ram => {
    expect(derivePrebuiltTags(c({ ram }))).toContain("DDR5");
  });

  it("falls back to the speed threshold when the name says only DDR", () => {
    expect(derivePrebuiltTags(c({ ram: "32GB 6000MHz" }))).toContain("DDR5");
  });

  it("does not tag DDR4", () => {
    expect(derivePrebuiltTags(c({ ram: "16GB DDR4 3200MHz" }))).not.toContain("DDR5");
  });
});

describe("WiFi", () => {
  it.each(["B650M WiFi", "B650M Wi-Fi 6E"])("detects %s", motherboard => {
    expect(derivePrebuiltTags(c({ motherboard }))).toContain("WIFI");
  });

  it("does not fire on a board without it", () => {
    expect(derivePrebuiltTags(c({ motherboard: "B650M DS3H" }))).not.toContain("WIFI");
  });
});

describe("output shape", () => {
  it("caps at four tags", () => {
    const tags = derivePrebuiltTags(c({
      gpu: "RTX 5090",
      cpu: "Ryzen 7 9800X3D",
      ram: "64GB DDR5 6000MHz",
      motherboard: "X670E WiFi",
    }));
    expect(tags).toHaveLength(4);
  });

  it("returns nothing for empty components", () => {
    expect(derivePrebuiltTags(c({}))).toEqual([]);
  });
});
