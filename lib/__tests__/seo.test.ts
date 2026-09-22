import { describe, expect, it } from "vitest";
import {
  cleanComponent,
  cleanPrebuiltName,
  cpuModel,
  gpuModel,
  hasQueryParams,
  prebuiltDescription,
  storeName,
} from "../seo";

describe("cleanPrebuiltName", () => {
  it("strips the Buy prefix, the in-Pakistan suffix and keeps the model code", () => {
    expect(
      cleanPrebuiltName("G-2.1.8 | Buy Intel i5 12400F with RTX 2070 Gaming PC Build in Pakistan")
    ).toBe("Intel i5 12400F with RTX 2070 Gaming PC Build (G-2.1.8)");
  });

  it("leaves an already-clean name alone", () => {
    expect(cleanPrebuiltName("Hela 1.4 – Ryzen 5 7500F & RTX 5060 8GB Twin Edge"))
      .toBe("Hela 1.4 – Ryzen 5 7500F & RTX 5060 8GB Twin Edge");
  });

  it("collapses doubled words and whitespace", () => {
    expect(cleanPrebuiltName("Buy  Gaming PC PC  Build   in Pakistan")).toBe("Gaming PC Build");
  });

  it("drops long secondary segments instead of bracketing them", () => {
    expect(cleanPrebuiltName("Ryzen 5 5600 RTX 4060 Gaming PC | TechMatched Official Store"))
      .toBe("Ryzen 5 5600 RTX 4060 Gaming PC");
  });

  it("strips a trailing 'Price in Pakistan'", () => {
    expect(cleanPrebuiltName("Starter 1.0 Price in Pakistan")).toBe("Starter 1.0");
  });
});

describe("cleanComponent", () => {
  it("drops vendor lists and core counts but keeps notes like (Used)", () => {
    expect(cleanComponent("AMD Ryzen 5 5600 (6 Cores / 12 Threads)")).toBe("AMD Ryzen 5 5600");
    expect(cleanComponent("RTX 3060 12GB Graphics Card (Used)")).toBe("RTX 3060 12GB (Used)");
    expect(cleanComponent("128GB SSD (Adata / HIKSEMI / Lexar)")).toBe("128GB SSD");
  });

  it("returns null for empty input", () => {
    expect(cleanComponent(undefined)).toBeNull();
    expect(cleanComponent("  ")).toBeNull();
  });
});

describe("gpuModel / cpuModel", () => {
  it("extracts short GPU models", () => {
    expect(gpuModel("NVIDIA GeForce RTX 4060 Ti 8GB")).toBe("RTX 4060 Ti");
    expect(gpuModel("GTX 1660 Super 6GB Graphics Card Used")).toBe("GTX 1660 Super");
    expect(gpuModel("Sapphire Pulse AMD Radeon RX 6700 XT 12G")).toBe("RX 6700 XT");
    expect(gpuModel("AMD RX580 8GB Graphic Card")).toBe("RX 580");
    expect(gpuModel("Integrated graphics")).toBeNull();
  });

  it("extracts short CPU models", () => {
    expect(cpuModel("AMD Ryzen 5 7500F (6 Cores / 12 Threads)")).toBe("Ryzen 5 7500F");
    expect(cpuModel("Intel Core i5-12400F")).toBe("Core i5-12400F");
    expect(cpuModel("Core i5 12400f")).toBe("Core i5-12400F");
    expect(cpuModel("Core i5 4th Gen")).toBe("Core i5 4th Gen");
    expect(cpuModel("Intel Core Ultra 7 265K")).toBe("Core Ultra 7 265K");
    expect(cpuModel(null)).toBeNull();
  });
});

describe("prebuiltDescription", () => {
  it("builds a spec line with price and store", () => {
    const d = prebuiltDescription({
      name: "G-2.5.9 | Buy Ryzen 5 7500F with RTX 4060 Gaming PC Build in Pakistan",
      source: "techmatched.pk",
      price_pkr: 259500,
      components: {
        cpu: "AMD Ryzen 5 7500F (6 Cores / 12 Threads)",
        gpu: "NVIDIA GeForce RTX 4060 8GB",
        ram: "16GB DDR5 5600MHz",
        storage: "512GB Gen3 NVMe SSD",
      },
    });
    expect(d).toContain("AMD Ryzen 5 7500F, NVIDIA GeForce RTX 4060 8GB, 16GB DDR5 5600MHz RAM, 512GB Gen3 NVMe SSD.");
    expect(d).toContain(`Rs ${(259500).toLocaleString("en-PK")} at TechMatched.`);
  });

  it("falls back to name-derived parts when components are missing", () => {
    const d = prebuiltDescription({
      name: "Starter 6.0 – Ryzen 5 2600 & GTX 1660 Super 6GB",
      source: "zestrogaming.com",
      price_pkr: null,
      components: null,
    });
    expect(d).toContain("Ryzen 5 2600, GTX 1660 Super.");
    expect(d).toContain("Sold by Zestro Gaming.");
  });
});

describe("storeName / hasQueryParams", () => {
  it("maps known sources and falls back to the domain", () => {
    expect(storeName("redtech.pk")).toBe("Red Tech");
    expect(storeName("zestrogaming.com")).toBe("Zestro Gaming");
    expect(storeName("example.pk")).toBe("example.pk");
  });

  it("detects any query param", () => {
    expect(hasQueryParams({})).toBe(false);
    expect(hasQueryParams({ sort: "price_desc" })).toBe(true);
    expect(hasQueryParams({ q: "" })).toBe(true);
  });
});
