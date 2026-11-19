import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Model-training and SEO-tool crawlers: they walk the whole sitemap, each page
 * costs a Vercel function render, and they send no visitors. Search engines,
 * answer-engine bots and link-preview fetchers stay under `*`.
 */
const BLOCKED_BOTS = [
  "GPTBot", "CCBot", "Google-Extended", "Applebot-Extended", "meta-externalagent",
  "FacebookBot", "Bytespider", "Amazonbot", "Diffbot", "omgili", "SemrushBot",
  "AhrefsBot", "MJ12bot", "DotBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Filtered/paginated listings are noindex duplicates of the clean
        // URLs, and every one is an uncached render.
        disallow: ["/market?", "/market/*?", "/prebuilts?"],
      },
      // A crawler obeys only its most specific matching group, so this one
      // replaces `*` for these bots rather than adding to it.
      { userAgent: BLOCKED_BOTS, disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
