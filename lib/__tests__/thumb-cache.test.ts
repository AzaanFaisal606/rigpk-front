import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

// A stand-in for Next's data cache: one store shared by every "instance"
// (module reload), keyed by key parts + args, storing only resolved values —
// unstable_cache never stores a rejection.
const store = new Map<string, unknown>();
vi.mock("next/cache", () => ({
  unstable_cache:
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>, keyParts: string[]) =>
    async (...args: A): Promise<R> => {
      const key = `${keyParts.join(",")}|${JSON.stringify(args)}`;
      if (store.has(key)) return store.get(key) as R;
      const value = await fn(...args);
      store.set(key, value);
      return value;
    },
}));

const TRANSPARENT = "https://img.test/transparent.png";
const SOLID = "https://img.test/solid.png";
const DOWN = "https://img.test/down.png";
const GONE = "https://img.test/gone.png";

async function png(alpha: number): Promise<ArrayBuffer> {
  const buf = await sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 200, g: 0, b: 0, alpha } },
  }).png().toBuffer();
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

let calls: string[];
let downStatus: number;

beforeEach(async () => {
  store.clear();
  calls = [];
  downStatus = 503;
  const bodies: Record<string, ArrayBuffer> = { [TRANSPARENT]: await png(0), [SOLID]: await png(1) };
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    calls.push(url);
    if (url === DOWN) return new Response(null, { status: downStatus });
    if (url === GONE) return new Response(null, { status: 404 });
    return new Response(bodies[url], { status: 200 });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/** A fresh module = a fresh Fluid instance: empty in-process memo, same shared cache. */
async function freshInstance() {
  vi.resetModules();
  return import("../thumb-check");
}

describe("thumbnail verdict cache", () => {
  it("decides transparent and solid images", async () => {
    const tc = await freshInstance();
    expect(await tc.isBackgroundless(TRANSPARENT)).toBe(true);
    expect(await tc.isBackgroundless(SOLID)).toBe(false);
  });

  it("memoises within one instance", async () => {
    const tc = await freshInstance();
    await tc.isBackgroundless(TRANSPARENT);
    await tc.isBackgroundless(TRANSPARENT);
    expect(calls).toEqual([TRANSPARENT]);
  });

  it("shares verdicts across instances, so a new instance downloads nothing", async () => {
    await (await freshInstance()).isBackgroundless(TRANSPARENT);
    await (await freshInstance()).isBackgroundless(GONE);
    const later = await freshInstance();
    expect(await later.isBackgroundless(TRANSPARENT)).toBe(true);
    expect(await later.isBackgroundless(GONE)).toBe(false);
    expect(calls).toEqual([TRANSPARENT, GONE]);
  });

  it("never caches a transient failure, in process or shared", async () => {
    const tc = await freshInstance();
    expect(await tc.checkBackgroundless(DOWN)).toBeNull();
    expect(await tc.isBackgroundless(DOWN)).toBe(false);
    expect(calls).toEqual([DOWN, DOWN]);
    expect([...store.keys()].some(k => k.includes("down.png"))).toBe(false);

    downStatus = 404;
    expect(await tc.checkBackgroundless(DOWN)).toBe(false);
    expect(await (await freshInstance()).checkBackgroundless(DOWN)).toBe(false);
    expect(calls).toEqual([DOWN, DOWN, DOWN]);
  });

  it("treats timeouts as transient", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
    }));
    const tc = await freshInstance();
    expect(await tc.checkBackgroundless(TRANSPARENT)).toBeNull();
    expect(store.size).toBe(0);
  });

  it("marks a pick unsettled only when an unchecked candidate ranks ahead of it", async () => {
    const tc = await freshInstance();
    expect(await tc.pickBackgroundlessThumbSettled([SOLID, TRANSPARENT, DOWN]))
      .toEqual({ src: TRANSPARENT, settled: true });
    expect(await tc.pickBackgroundlessThumbSettled([DOWN, TRANSPARENT]))
      .toEqual({ src: TRANSPARENT, settled: false });
    expect(await tc.pickBackgroundlessThumbSettled([SOLID, DOWN]))
      .toEqual({ src: SOLID, settled: false });
    expect(await tc.pickBackgroundlessThumb([SOLID, GONE])).toBe(SOLID);
  });
});

describe("budget buckets cache", () => {
  function prebuilt(id: number, price: number, thumb: string) {
    return { id, name: `PC ${id}`, price_pkr: price, thumbnail_url: thumb };
  }

  async function freshBudgetData(items: ReturnType<typeof prebuilt>[] | null) {
    vi.resetModules();
    vi.doMock("../prebuilts-api", () => ({
      getAllPrebuiltsUnder: vi.fn(async () =>
        items ? { ok: true, items, total: items.length } : { ok: false, error: "http" }),
    }));
    return import("../budget-data");
  }

  afterEach(() => vi.doUnmock("../prebuilts-api"));

  it("caches settled buckets so the next instance does no thumbnail work", async () => {
    const items = [prebuilt(1, 90_000, TRANSPARENT)];
    const first = await (await freshBudgetData(items)).getBudgetBuckets();
    expect(first?.[0]).toMatchObject({ count: 1, maxPrice: 90_000, thumb: TRANSPARENT });
    calls = [];
    expect(await (await freshBudgetData(items)).getBudgetBuckets()).toEqual(first);
    expect(calls).toEqual([]);
  });

  it("returns but does not cache buckets with an unchecked thumbnail", async () => {
    const items = [prebuilt(1, 90_000, DOWN), prebuilt(2, 80_000, SOLID)];
    const buckets = await (await freshBudgetData(items)).getBudgetBuckets();
    expect(buckets?.[0]).toMatchObject({ count: 2, thumb: DOWN });
    expect([...store.keys()].some(k => k.startsWith("budget-buckets"))).toBe(false);
  });

  it("returns null without caching when the catalogue fetch fails", async () => {
    expect(await (await freshBudgetData(null)).getBudgetBuckets()).toBeNull();
    expect([...store.keys()].some(k => k.startsWith("budget-buckets"))).toBe(false);
  });
});
