import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG_FETCH, CATALOG_REVALIDATE, CATALOG_TAG } from "../catalog-cache";

const root = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

// Segment config must be a literal, so these pages repeat CATALOG_REVALIDATE.
const ISR_ROUTES = [
  "app/part/[slug]/page.tsx",
  "app/gpu/[model]/page.tsx",
  "app/cpu/[model]/page.tsx",
  "app/gaming-pc-under/[budget]/page.tsx",
  "app/sitemap.ts",
];

describe("catalog cache", () => {
  it("pins the tag the backend refreshes", () => {
    // scripts/refresh_site_cache.py (backend repo) sends this exact tag.
    expect(CATALOG_TAG).toBe("catalog");
    expect(CATALOG_FETCH).toEqual({ revalidate: CATALOG_REVALIDATE, tags: [CATALOG_TAG] });
  });

  it.each(ISR_ROUTES)("%s keeps its revalidate literal in step", route => {
    const m = read(route).match(/^export const revalidate = (\d+);$/m);
    expect(m?.[1]).toBe(String(CATALOG_REVALIDATE));
  });
});
