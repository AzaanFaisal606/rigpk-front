import type { MetadataRoute } from "next";
import { getPrebuilts } from "@/lib/prebuilts-api";

const BASE = "https://rigpk.vercel.app";
const CATEGORIES = ["cpu", "gpu", "ram", "motherboard", "psu", "case", "ssd", "cooling"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 115 active prebuilts as of the last DB snapshot — 200 covers the whole
  // catalogue in one page (backend caps `limit` at 200).
  const prebuiltsResult = await getPrebuilts({ limit: 200 });
  const prebuiltUrls = prebuiltsResult.ok
    ? prebuiltsResult.items.map(p => ({
        url: `${BASE}/prebuilts/${p.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    : [];

  return [
    { url: BASE,               lastModified: new Date(), changeFrequency: "weekly",  priority: 1   },
    { url: `${BASE}/market`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/build`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/trends`,   lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/prebuilts`, lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
    ...CATEGORIES.map(c => ({
      url: `${BASE}/market/${c}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...prebuiltUrls,
  ];
}
