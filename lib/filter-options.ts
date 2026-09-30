import type { FilterOptions } from "@/lib/api";
import type { DropdownOption } from "@/components/ui/ComicDropdown";
import { SPEC_LABELS } from "@/lib/constants";

// Bucketing: group raw spec values into labelled options
// Returns { label, values[] } where values are the raw strings that match
type Bucket = { label: string; values: string[] };

export function bucketValues(key: string, rawValues: string[]): Bucket[] | null {
  const parse = (s: string) => parseFloat(s.replace(/[^\d.]/g, "")) || 0;

  if (key === "capacity") {
    // Group by TB/GB tiers
    const gb: string[] = [], sml: string[] = [], mid: string[] = [], big: string[] = [], huge: string[] = [];
    for (const v of rawValues) {
      const n = parse(v);
      const isTB = v.toUpperCase().includes("TB");
      const numGB = isTB ? n * 1000 : n;
      if (numGB <= 256) sml.push(v);
      else if (numGB <= 1000) gb.push(v);
      else if (numGB <= 4000) mid.push(v);
      else if (numGB <= 8000) big.push(v);
      else huge.push(v);
    }
    const out: Bucket[] = [];
    if (sml.length) out.push({ label: "≤256GB", values: sml });
    if (gb.length) out.push({ label: "512GB–1TB", values: gb });
    if (mid.length) out.push({ label: "2TB–4TB", values: mid });
    if (big.length) out.push({ label: "5TB–8TB", values: big });
    if (huge.length) out.push({ label: "10TB+", values: huge });
    return out.length > 1 ? out : null;
  }

  if (key === "refresh_rate") {
    const tiers: [string, (n: number) => boolean][] = [
      ["≤100Hz", n => n <= 100],
      ["120–180Hz", n => n > 100 && n <= 180],
      ["200–280Hz", n => n > 180 && n <= 280],
      ["300Hz+", n => n > 280],
    ];
    const out = tiers
      .map(([label, test]) => ({ label, values: rawValues.filter(v => test(parse(v))) }))
      .filter(b => b.values.length);
    return out.length > 1 ? out : null;
  }

  if (key === "speed") {
    // RAM speeds in MHz
    const ddr4slow: string[] = [], ddr4fast: string[] = [], ddr5base: string[] = [], ddr5fast: string[] = [];
    for (const v of rawValues) {
      const n = parse(v);
      if (n <= 2666) ddr4slow.push(v);
      else if (n <= 4000) ddr4fast.push(v);
      else if (n <= 5600) ddr5base.push(v);
      else ddr5fast.push(v);
    }
    const out: Bucket[] = [];
    if (ddr4slow.length) out.push({ label: "≤2666MHz", values: ddr4slow });
    if (ddr4fast.length) out.push({ label: "3000–4000MHz", values: ddr4fast });
    if (ddr5base.length) out.push({ label: "4800–5600MHz", values: ddr5base });
    if (ddr5fast.length) out.push({ label: "6000MHz+", values: ddr5fast });
    return out.length > 1 ? out : null;
  }

  if (key === "wattage") {
    const low: string[] = [], mid: string[] = [], high: string[] = [], ultra: string[] = [];
    for (const v of rawValues) {
      const n = parse(v);
      if (n <= 500) low.push(v);
      else if (n <= 750) mid.push(v);
      else if (n <= 1000) high.push(v);
      else ultra.push(v);
    }
    const out: Bucket[] = [];
    if (low.length) out.push({ label: "≤500W", values: low });
    if (mid.length) out.push({ label: "550–750W", values: mid });
    if (high.length) out.push({ label: "800–1000W", values: high });
    if (ultra.length) out.push({ label: "1050W+", values: ultra });
    return out.length > 1 ? out : null;
  }

  return null;
}

export interface SpecDropdown {
  key: string;
  label: string;
  options: DropdownOption[];
}

/**
 * One dropdown per spec key that has values, in the order /api/parts/filters
 * returns them. Bucketed specs get a separator header per bucket. Shared by
 * the market FilterBar and the /build part picker so both offer the same
 * filters; `exclude` drops keys a caller replaces with its own control.
 */
export function specDropdowns(filterOptions: FilterOptions, exclude: readonly string[] = []): SpecDropdown[] {
  return Object.entries(filterOptions)
    .filter(([key, values]) => values && values.length > 0 && !exclude.includes(key))
    .map(([key, rawValues]) => {
      const vals = rawValues as string[];
      const label = SPEC_LABELS[key] ?? key;
      const buckets = bucketValues(key, vals);
      if (!buckets) return { key, label, options: vals.map(v => ({ value: v, label: v })) };
      const options: DropdownOption[] = [];
      for (const b of buckets) {
        options.push({ value: `__sep__${b.label}`, label: b.label, separator: true });
        for (const v of b.values) options.push({ value: v, label: v });
      }
      return { key, label, options };
    });
}
