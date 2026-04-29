# rigpk-front

Frontend for [RigPK](https://github.com/AzaanFaisal606/rigpk) — a PCPartPicker-style site for Pakistan. Built with Next.js 16 App Router, featuring a custom techy-comic design system, a PC builder with live compatibility checking, a parts market, and a prebuilt PC browser.

---

## What It Does

- **Market** — Browse ~4,800 PC parts from 5 Pakistani retailers with filtering by category, specs, and price
- **PC Builder** — Pick components slot by slot; live compatibility checker catches socket and DDR mismatches; shareable build links
- **Prebuilts** — Browse 121 prebuilt PCs from 3 retailers with price and brand filters

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Inline styles + CSS variables |
| Animation | Framer Motion (build page wireframe) |
| Data fetching | Server components with `fetch` + `revalidate` |

## Design System

Custom "techy-comic" aesthetic — sharp corners, hard offset shadows, skewed buttons, monospace typography, purple accent. No border-radius anywhere. Every interactive element follows a consistent shadow + border + skew pattern that gives the UI a hand-drawn comic feel while staying fully functional.

Key tokens:
- Background: `#f4f4f5`
- Accent: `#7c3aed` (purple)
- Hard shadow: `Npx Npx 0 #111112`
- Font: JetBrains Mono / Fira Code for all labels, prices, and badges

## Pages

| Route | Description |
|---|---|
| `/` | Landing — hero, stat counters, retailer cards, feature highlights |
| `/market` | Parts browser — filter bar, paginated list, search |
| `/build` | PC builder — SVG wireframe hero, component slots, compatibility banner, share button |
| `/prebuilts` | Prebuilt browser — card grid, sticky filter bar with hide-on-scroll |
| `/prebuilts/[id]` | Prebuilt detail — full spec breakdown, component list, tags |

## Running Locally

Requires the [rigpk-backend](https://github.com/AzaanFaisal606/rigpk-backend) running at `localhost:8000`.

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Project Structure

```
app/
  page.tsx              # Landing (server component)
  market/page.tsx       # Parts market
  build/page.tsx        # PC builder ("use client")
  prebuilts/page.tsx    # Prebuilt browser
  prebuilts/[id]/       # Prebuilt detail page
components/
  Navbar.tsx
  FilterBar.tsx         # ComicDropdown with bucketed filter options
  PartRow.tsx
  BuildWireframe.tsx    # Animated SVG PC wireframe (Framer Motion)
  BuildCards.tsx        # 2-col component slot grid
  BuildSummary.tsx      # Sticky summary + share button
  PartPickerModal.tsx   # Floating part selector
  CompatibilityBanner.tsx
  PrebuiltCard.tsx
  PrebuiltFilterBar.tsx # Sticky + hide-on-scroll filter bar
  PrebuiltSpecPage.tsx
lib/
  api.ts                # All API calls + types
  compatibility.ts      # CPU↔Mobo socket + DDR gen checks
  prebuilts-api.ts
  prebuilt-tags.ts      # Auto-tag derivation (Gaming, Streaming, etc.)
```

## Related

- **Backend:** [rigpk-backend](https://github.com/AzaanFaisal606/rigpk-backend)
- **Project hub:** [rigpk](https://github.com/AzaanFaisal606/rigpk)
