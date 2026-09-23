import { describe, expect, it } from "vitest";
import type { Part } from "@/lib/api";
import { fetchCatalogue } from "@/lib/model-data";

function items(n: number, from = 0): Part[] {
  return Array.from({ length: n }, (_, i) => ({
    id: from + i, source: "zahcomputers.pk", name: `Card ${from + i}`, category: "gpu",
    url: `https://x/${from + i}`, thumbnail_url: null, price_pkr: 100000, specs: null,
  }));
}

/** A fetch stand-in that serves `pages` in order and records each URL. */
function fakeFetcher(pages: { items: Part[]; total: number }[], urls: string[] = []): typeof fetch {
  let i = 0;
  return (async (url: string) => {
    urls.push(String(url));
    const body = pages[i++] ?? { items: [], total: 0 };
    return new Response(JSON.stringify(body), { status: 200 });
  }) as unknown as typeof fetch;
}

describe("fetchCatalogue", () => {
  it("pages until total and returns every item", async () => {
    const res = await fetchCatalogue("gpu", fakeFetcher([
      { items: items(100), total: 137 },
      { items: items(37, 100), total: 137 },
    ]));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.items).toHaveLength(137);
  });

  it("fails on a short read instead of returning a half list", async () => {
    const res = await fetchCatalogue("gpu", fakeFetcher([
      { items: items(100), total: 137 },
      { items: [], total: 137 },
    ]));
    expect(res).toEqual({ ok: false });
  });

  it("fails on a non-2xx response or a thrown error", async () => {
    const http = (async () => new Response("nope", { status: 503 })) as unknown as typeof fetch;
    expect(await fetchCatalogue("gpu", http)).toEqual({ ok: false });
    const thrown = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    expect(await fetchCatalogue("gpu", thrown)).toEqual({ ok: false });
  });

  it("asks for the next page by offset", async () => {
    const urls: string[] = [];
    await fetchCatalogue("gpu", fakeFetcher([
      { items: items(100), total: 137 },
      { items: items(37, 100), total: 137 },
    ], urls));
    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain("category=gpu&limit=100&offset=100");
  });
});
