import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import PartRow from "@/components/PartRow";
import JsonLd from "@/components/JsonLd";
import { getParts } from "@/lib/api";
import { str } from "@/lib/utils";
import { monoFont } from "@/lib/tokens";
import { SPEC_KEYS } from "@/lib/constants";
import Footer from "@/components/Footer";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rigpk.vercel.app";

// Subset of lib/constants.ts CATEGORIES — hdd/monitor excluded as they lack CATEGORY_META entries
const CATEGORIES = ["cpu", "gpu", "ram", "motherboard", "psu", "case", "ssd", "cooling"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_META: Record<Category, { title: string; description: string }> = {
  gpu:         { title: "GPU Prices in Pakistan | RigPK",         description: "Compare graphics card prices from Pakistani retailers. RTX, RX, and more." },
  cpu:         { title: "CPU Prices in Pakistan | RigPK",         description: "Compare processor prices from CZone, Junaid Tech, Zah Computers and more." },
  ram:         { title: "RAM Prices in Pakistan | RigPK",         description: "DDR4 and DDR5 RAM prices from top Pakistani PC retailers." },
  motherboard: { title: "Motherboard Prices in Pakistan | RigPK", description: "Compare motherboard prices by socket and chipset from Pakistani stores." },
  psu:         { title: "PSU Prices in Pakistan | RigPK",         description: "Power supply unit prices from Pakistani retailers. Modular and non-modular." },
  case:        { title: "PC Case Prices in Pakistan | RigPK",     description: "PC cabinet prices from Pakistani retailers. ATX, mATX, ITX." },
  ssd:         { title: "SSD Prices in Pakistan | RigPK",         description: "NVMe and SATA SSD prices from Pakistani PC stores." },
  cooling:     { title: "CPU Cooler Prices in Pakistan | RigPK",  description: "Air and AIO liquid cooler prices from Pakistani retailers." },
};

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORY_META[category as Category];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE}/market/${category}`,
    },
  };
}

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const LIMIT = 50;

async function PartsList({
  category,
  searchParams,
}: {
  category: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const source   = str(searchParams.source);
  const sort     = (str(searchParams.sort) as "price_asc" | "price_desc") ?? "price_asc";
  const minPrice = str(searchParams.min_price);
  const maxPrice = str(searchParams.max_price);
  const offset   = Number(str(searchParams.offset) ?? "0");
  const q        = str(searchParams.q);

  const specParams: Record<string, string> = {};
  for (const key of SPEC_KEYS) {
    const val = str(searchParams[key]);
    if (val) specParams[key] = val;
  }

  const { items, total } = await getParts({
    category,
    source,
    min_price: minPrice ? Number(minPrice) : undefined,
    max_price: maxPrice ? Number(maxPrice) : undefined,
    sort,
    limit: LIMIT,
    offset,
    q,
    ...specParams,
  });

  const heading = category.toUpperCase() + "S";
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  function pageUrl(newOffset: number) {
    const p = new URLSearchParams();
    if (source) p.set("source", source);
    if (sort !== "price_asc") p.set("sort", sort);
    if (minPrice) p.set("min_price", minPrice);
    if (maxPrice) p.set("max_price", maxPrice);
    if (q) p.set("q", q);
    for (const [k, v] of Object.entries(specParams)) p.set(k, v);
    if (newOffset > 0) p.set("offset", String(newOffset));
    const qs = p.toString();
    return `/market/${category}${qs ? "?" + qs : ""}`;
  }

  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < total;

  return (
    <>
      <Suspense>
        <FilterBar total={total} activeCategory={category} />
      </Suspense>

      <div className="max-w-6xl mx-auto px-6 py-6 w-full">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="section-label mb-1">Browse Parts</p>
            <h1
              style={{
                fontFamily: monoFont,
                fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {heading}
            </h1>
          </div>
          {total > 0 && (
            <span style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--text-dim)" }}>
              {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()}
            </span>
          )}
        </div>

        <div
          style={{
            border: "2px solid #111112",
            boxShadow: "10px 10px 0 #111112",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#111112",
              color: "white",
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {heading} — Parts List
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "10px",
                color: "rgba(255,255,255,0.45)",
                fontWeight: 600,
              }}
            >
              {total.toLocaleString()} results
            </span>
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: "64px 24px",
                textAlign: "center",
                background: "var(--bg-card)",
                borderTop: "1px solid #111112",
              }}
            >
              <p
                style={{
                  fontFamily: monoFont,
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  color: "var(--text-dim)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                // NO PARTS FOUND
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
                Try adjusting your filters
              </p>
            </div>
          ) : (
            items.map((part) => <PartRow key={part.id} part={part} />)
          )}
        </div>

        {totalPages > 1 && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {hasPrev ? (
              <Link
                href={pageUrl(offset - LIMIT)}
                style={{
                  padding: "7px 18px",
                  border: "2px solid #111112",
                  boxShadow: "3px 3px 0 #111112",
                  background: "white",
                  color: "#111112",
                  fontFamily: monoFont,
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transform: "skewX(-8deg)",
                  display: "inline-block",
                }}
              >
                ← Prev
              </Link>
            ) : (
              <span style={{ width: 80 }} />
            )}
            <span
              style={{
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--text-dim)",
                letterSpacing: "1px",
                border: "1.5px solid var(--border)",
                padding: "5px 14px",
                transform: "skewX(-6deg)",
                display: "inline-block",
              }}
            >
              {currentPage} / {totalPages}
            </span>
            {hasNext ? (
              <Link
                href={pageUrl(offset + LIMIT)}
                style={{
                  padding: "7px 18px",
                  border: "2px solid #111112",
                  boxShadow: "3px 3px 0 #111112",
                  background: "var(--purple)",
                  color: "white",
                  fontFamily: monoFont,
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transform: "skewX(-8deg)",
                  display: "inline-block",
                }}
              >
                Next →
              </Link>
            ) : (
              <span style={{ width: 80 }} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const resolvedParams = await searchParams;
  const meta = CATEGORY_META[category as Category];

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      {meta && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: meta.title,
            description: meta.description,
            url: `${BASE}/market/${category}`,
          }}
        />
      )}
      <Navbar />
      <main className="flex flex-col flex-1">
        <Suspense
          fallback={
            <div className="py-20 text-center mono" style={{ color: "var(--text-dim)" }}>
              Loading…
            </div>
          }
        >
          <PartsList category={category} searchParams={resolvedParams} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
