// lib/__tests__/trends-api.test.ts
/**
 * A failed fetch must be distinguishable from "no data exists".
 *
 * /trends is statically prerendered; at build time it fires three parallel
 * getTrendGroups calls. Against a cold Render dyno those fail, the failure was
 * swallowed into [], and Next baked an empty page with a 300s stale window —
 * so an outage rendered as a confident "No trend data available".
 */
import { describe, expect, it, vi } from "vitest";
import { getTrendGroups } from "@/lib/trends-api";

describe("getTrendGroups", () => {
  it("returns ok:false when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    const r = await getTrendGroups("gpu");
    expect(r.ok).toBe(false);
  });

  it("returns ok:false on a non-200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    const r = await getTrendGroups("gpu");
    expect(r.ok).toBe(false);
  });

  it("returns ok:true with data on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ groups: [] }),
    }));
    const r = await getTrendGroups("gpu");
    expect(r.ok).toBe(true);
  });
});
