import { describe, expect, it } from "vitest";
import robots from "../../app/robots";
import { SITE_URL } from "../seo";

const BLOCKED = [
  "GPTBot", "CCBot", "Google-Extended", "Applebot-Extended", "meta-externalagent",
  "FacebookBot", "Bytespider", "Amazonbot", "Diffbot", "omgili", "SemrushBot",
  "AhrefsBot", "MJ12bot", "DotBot",
];

const ALLOWED = [
  "Googlebot", "Bingbot", "Applebot", "DuckDuckBot", "OAI-SearchBot", "ChatGPT-User",
  "PerplexityBot", "Perplexity-User",
  "facebookexternalhit", "Twitterbot",
];

describe("robots", () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const agents = (rule: (typeof rules)[number]) =>
    Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent];

  it("pins the generated rules", () => {
    expect(r).toEqual({
      rules: [
        { userAgent: "*", allow: "/", disallow: ["/market?", "/market/*?", "/prebuilts?"] },
        { userAgent: BLOCKED, disallow: "/" },
      ],
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });

  it("never blocks Next's assets for the * group", () => {
    const star = rules.find(rule => agents(rule).includes("*"))!;
    expect([star.disallow].flat().some(d => d?.startsWith("/_next"))).toBe(false);
  });

  it("gives search, answer and preview bots no group of their own, so * applies", () => {
    const named = rules.flatMap(agents).map(a => a?.toLowerCase());
    for (const bot of ALLOWED) expect(named).not.toContain(bot.toLowerCase());
  });
});
