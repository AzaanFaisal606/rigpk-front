import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/api";
import type { BuildState } from "@/lib/types";
import { buildSocket, checkCompatibility, platformFilters } from "@/lib/compatibility";
import { modelDropdownOptions, MODELS, MODEL_SERIES } from "@/lib/models";
import { specDropdowns } from "@/lib/filter-options";

const EMPTY: BuildState = {
  cpu: null, gpu: null, ram: null, motherboard: null,
  psu: null, case: null, ssd: null, cooling: null,
};

let nextId = 1;
function slot(specs: Record<string, string>) {
  const part = { id: nextId++, name: "part", price_pkr: 1000, specs } as unknown as Part;
  return { part, qty: 1 };
}

function build(parts: Partial<Record<keyof BuildState, Record<string, string>>>): BuildState {
  const b = { ...EMPTY };
  for (const [k, specs] of Object.entries(parts)) b[k as keyof BuildState] = slot(specs!);
  return b;
}

describe("platformFilters", () => {
  it("is empty for an empty build", () => {
    for (const s of ["cpu", "motherboard", "ram", "gpu"] as const) {
      expect(platformFilters(EMPTY, s)).toEqual({});
    }
  });

  it("filters the CPU picker by the board's socket and the board picker by the CPU's", () => {
    expect(platformFilters(build({ motherboard: { socket: "AM4" } }), "cpu")).toEqual({ socket: "AM4" });
    expect(platformFilters(build({ cpu: { socket: "AM5" } }), "motherboard")).toEqual({ socket: "AM5" });
  });

  it("never filters a slot on its own part, so a lone CPU can still be swapped across sockets", () => {
    expect(platformFilters(build({ cpu: { socket: "AM4" } }), "cpu")).toEqual({});
    expect(platformFilters(build({ motherboard: { socket: "AM4" } }), "motherboard")).toEqual({});
  });

  it("filters RAM to the socket's DDR generation, from the CPU or else the board", () => {
    expect(platformFilters(build({ cpu: { socket: "AM4" } }), "ram")).toEqual({ ddr_type: "DDR4" });
    expect(platformFilters(build({ motherboard: { socket: "AM5" } }), "ram")).toEqual({ ddr_type: "DDR5" });
    expect(platformFilters(build({ motherboard: { socket: "LGA1851" } }), "ram")).toEqual({ ddr_type: "DDR5" });
  });

  it("leaves RAM unfiltered on LGA1700, whose boards come in both DDR types", () => {
    expect(platformFilters(build({ cpu: { socket: "LGA1700" } }), "ram")).toEqual({});
  });

  it("ignores parts with no socket", () => {
    expect(platformFilters(build({ cpu: { brand: "AMD" } }), "motherboard")).toEqual({});
    expect(platformFilters(build({ cpu: { brand: "AMD" } }), "ram")).toEqual({});
  });

  it("doesn't touch slots outside the platform", () => {
    const b = build({ cpu: { socket: "AM5" }, motherboard: { socket: "AM5" } });
    for (const s of ["gpu", "psu", "case", "ssd", "cooling"] as const) {
      expect(platformFilters(b, s)).toEqual({});
    }
  });
});

describe("buildSocket", () => {
  it("prefers the CPU and falls back to the board", () => {
    expect(buildSocket(build({ cpu: { socket: "AM5" }, motherboard: { socket: "AM4" } }))).toBe("AM5");
    expect(buildSocket(build({ motherboard: { socket: "AM4" } }))).toBe("AM4");
    expect(buildSocket(EMPTY)).toBeUndefined();
  });
});

describe("checkCompatibility", () => {
  it("flags a socket mismatch as an error", () => {
    const issues = checkCompatibility(build({ cpu: { socket: "AM5" }, motherboard: { socket: "AM4" } }));
    expect(issues).toEqual([expect.objectContaining({ category: "SOCKET", severity: "error" })]);
  });

  it("flags wrong-generation RAM against the CPU", () => {
    const issues = checkCompatibility(build({ cpu: { socket: "AM5" }, ram: { ddr_type: "DDR4" } }));
    expect(issues).toEqual([expect.objectContaining({ category: "DDR", severity: "error" })]);
  });

  it("flags wrong-generation RAM against a board when there's no CPU", () => {
    const issues = checkCompatibility(build({ motherboard: { socket: "AM4" }, ram: { ddr_type: "DDR5" } }));
    expect(issues).toEqual([expect.objectContaining({ category: "DDR", severity: "error" })]);
  });

  it("warns, never errors, on LGA1700 with RAM", () => {
    for (const ddr of ["DDR4", "DDR5"]) {
      const issues = checkCompatibility(build({ cpu: { socket: "LGA1700" }, ram: { ddr_type: ddr } }));
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ category: "DDR", severity: "warning" });
      expect(issues[0].description).toContain(ddr);
    }
  });

  it("warns on an LGA1700 board or CPU alone, before any RAM is picked", () => {
    for (const parts of [{ motherboard: { socket: "LGA1700" } }, { cpu: { socket: "LGA1700" } }]) {
      const issues = checkCompatibility(build(parts));
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ category: "DDR", severity: "warning" });
      expect(issues[0].description).toContain("matches your motherboard");
    }
  });

  it("is quiet for a matched build", () => {
    expect(checkCompatibility(build({ cpu: { socket: "AM5" }, motherboard: { socket: "AM5" }, ram: { ddr_type: "DDR5" } }))).toEqual([]);
    expect(checkCompatibility(build({ motherboard: { socket: "AM4" } }))).toEqual([]);
  });
});

describe("modelDropdownOptions", () => {
  it("lists every model of the category once, under a header per series", () => {
    for (const category of ["gpu", "cpu"] as const) {
      const opts = modelDropdownOptions(category);
      const values = opts.filter(o => !o.separator).map(o => o.value);
      expect(values).toEqual(MODELS.filter(m => m.category === category).map(m => m.slug));
      expect(opts.filter(o => o.separator)).toHaveLength(MODEL_SERIES.filter(s => s.category === category).length);
      expect(opts[0].separator).toBe(true);
    }
  });

  it("gives every CPU series a socket, and narrows CPU models to one", () => {
    for (const s of MODEL_SERIES.filter(s => s.category === "cpu")) expect(s.socket).toBeTruthy();
    const am4 = modelDropdownOptions("cpu", "AM4").filter(o => !o.separator).map(o => o.value);
    expect(am4).toContain("ryzen-5-5600");
    expect(am4).not.toContain("ryzen-5-7600");
    expect(am4).not.toContain("core-i5-14400f");
  });
});

describe("specDropdowns", () => {
  it("skips empty and excluded keys and buckets bucketed ones", () => {
    const d = specDropdowns({ brand: ["AMD"], model: ["RTX 4060"], vram: [], wattage: ["450W", "850W"] }, ["model"]);
    expect(d.map(x => x.key)).toEqual(["brand", "wattage"]);
    expect(d[1].options.filter(o => o.separator).map(o => o.label)).toEqual(["≤500W", "800–1000W"]);
  });
});
