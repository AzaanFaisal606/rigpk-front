# rigpk-front

Frontend for [RigPK](https://github.com/AzaanFaisal606/rigpk), a PCPartPicker-style site for
Pakistan. Built with Next.js 16 (App Router) and a custom "techy comic" design system.

---

## What It Does

- **Market:** browse ~8,000 in-stock PC parts from 9 Pakistani retailers, filtered by category,
  specs, retailer and price. Search runs in the browser against a per-category index.
- **PC Builder:** pick parts slot by slot, with quantities. A live compatibility check catches
  CPU↔motherboard socket and DDR mismatches, and builds can be shared as links.
- **Prebuilts:** browse ~250 prebuilt PCs from 3 retailers, plus "gaming PC under X" budget pages.
- **Trends:** weekly price trends per GPU/CPU model and RAM spec.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | CSS variables + inline styles, no border-radius anywhere |
| Search | MiniSearch (in-browser index) |
| Animation | Framer Motion (build page wireframe) |
| Tests | Vitest |

## Design System

Sharp corners, hard offset shadows (`Npx Npx 0 #111112`), skewed mono uppercase buttons, and a
maroon accent (`--purple: #873260`). The tokens live in `app/globals.css`.

## Pages

| Route | Description |
|---|---|
| `/` | Landing: hero, stats, retailer cards with scrape-health ribbons |
| `/market` · `/market/[category]` · `/market/[category]/[facet]` | Parts browser, category pages and SEO filter pages |
| `/build` | PC builder with compatibility banner and share links |
| `/prebuilts` · `/prebuilts/[id]` | Prebuilt browser and detail page |
| `/gaming-pc-under/[budget]` | Budget pages (100k/150k/200k/300k) |
| `/trends` | Price trend sparklines and drill-down |

`proxy.ts` (Next 16's renamed middleware) turns unknown categories, filters and budgets into
real 404s.

## Running Locally

Needs the [rigpk-backend](https://github.com/AzaanFaisal606/rigpk-backend) API on `localhost:8000`.

```bash
npm install
npm run dev      # → http://localhost:3000
npm test
```

## Project Structure

```
app/            routes above, plus sitemap.ts, robots.ts, error/loading/not-found
components/     FilterBar, PartsList/PartRow, MarketSearchResults, Build*, PartPickerModal,
                Prebuilt*, Trend*, Sources, JsonLd; ui/ (ComicDropdown, PulldownTab, …)
lib/            api.ts, types.ts, compatibility.ts, search-tokenize.ts, search-index.ts,
                search-bus.ts, trends-api.ts, prebuilts-api.ts, seo.ts, facets.ts, budgets.ts
lib/__tests__/  Vitest suites
```

`lib/search-tokenize.ts` must stay in sync with the backend's `db/tokenize.py`. Both are tested
against a shared fixture.

## Related

- **Backend:** [rigpk-backend](https://github.com/AzaanFaisal606/rigpk-backend)
- **Project hub:** [rigpk](https://github.com/AzaanFaisal606/rigpk)
