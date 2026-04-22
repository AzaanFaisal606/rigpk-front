import type { MetadataRoute } from "next";

const BASE = "https://rigpk.vercel.app";
const CATEGORIES = ["cpu", "gpu", "ram", "motherboard", "psu", "case", "ssd", "cooling"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,             lastModified: new Date(), changeFrequency: "weekly",  priority: 1   },
    { url: `${BASE}/market`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/build`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...CATEGORIES.map(c => ({
      url: `${BASE}/market/${c}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
