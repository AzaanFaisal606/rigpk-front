/**
 * Screenshot every key route at mobile and desktop, and report horizontal
 * overflow. Run against a PRODUCTION build — `next dev` with Turbopack does not
 * hydrate in this environment, so hover state and isMobile hooks are dead there
 * and any check against dev is meaningless.
 *
 *   npm run build && npm start &
 *   node scripts/shots.mjs before
 *   ...make changes...
 *   node scripts/shots.mjs after
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const LABEL = process.argv[2] ?? "run";
const OUT = `.shots/${LABEL}`;

const ROUTES = [
  ["home", "/"],
  ["market", "/market"],
  ["market-gpu", "/market/gpu"],
  ["market-gpu-search", "/market/gpu?q=5090"],
  ["build", "/build"],
  ["prebuilts", "/prebuilts"],
  ["trends", "/trends"],
];

const VIEWPORTS = [
  ["mobile", { width: 390, height: 844 }, true],
  ["desktop", { width: 1440, height: 900 }, false],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let failures = 0;

for (const [vpName, viewport, isMobile] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport,
    isMobile,
    hasTouch: isMobile,
    deviceScaleFactor: isMobile ? 2 : 1,
  });
  for (const [name, path] of ROUTES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
    await page.screenshot({ path: `${OUT}/${vpName}-${name}.png`, fullPage: false });

    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    const overflow = sw > cw;
    if (overflow || errors.length) failures++;
    console.log(
      `${vpName.padEnd(8)} ${name.padEnd(18)} scrollWidth=${sw} clientWidth=${cw}` +
      `${overflow ? "  ← OVERFLOW" : ""}${errors.length ? `  ← ${errors.length} JS ERROR` : ""}`
    );
    for (const e of errors) console.log(`    ${e}`);
    await page.close();
  }
  await ctx.close();
}

await browser.close();
process.exit(failures ? 1 : 0);
