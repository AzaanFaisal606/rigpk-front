import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import PartRow from "@/components/PartRow";
import { getParts } from "@/lib/api";
import { str } from "@/lib/utils";
import { monoFont } from "@/lib/tokens";
import { buildPageUrl, DEFAULT_SORT, SPEC_KEYS } from "@/lib/constants";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "PC Parts Market — RigPK",
  description:
    "Browse all PC parts with live prices from Pakistani retailers. Filter by category, brand, price, and specs.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const LIMIT = 50;

async function PartsList({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const category = str(searchParams.category);
  const source   = str(searchParams.source);
  const sort     = (str(searchParams.sort) as "price_asc" | "price_desc") ?? DEFAULT_SORT;
  const minPrice = str(searchParams.min_price);
  const maxPrice = str(searchParams.max_price);
  const offset   = Number(str(searchParams.offset) ?? "0");
  const q        = str(searchParams.q);

  const specParams: Record<string, string> = {};
  for (const key of SPEC_KEYS) {
    const val = str(searchParams[key]);
    if (val) specParams[key] = val;
  }

  const result = await getParts({
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
  const failed = !result.ok;
  const items  = result.ok ? result.items : [];
  const total  = result.ok ? result.total : 0;

  const heading = category ? category.toUpperCase() + "S" : "ALL PARTS";
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  // Build a URL with updated offset, preserving all other params
  function pageUrl(newOffset: number) {
    return buildPageUrl({
      basePath: "/market",
      category,
      source,
      sort,
      min_price: minPrice,
      max_price: maxPrice,
      q,
      ...specParams,
      offset: newOffset,
    });
  }

  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < total;

  return (
    <>
      <Suspense>
        <FilterBar total={total} />
      </Suspense>

      <div className="max-w-6xl mx-auto px-6 py-6 w-full">
        {/* Section header */}
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

        {/* Parts list card — bigger shadow like PartPickerModal */}
        <div
          style={{
            border: "2px solid #111112",
            boxShadow: "10px 10px 0 #111112",
            overflow: "hidden",
          }}
        >
          {/* Black header bar */}
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

          {failed ? (
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
                  color: "var(--purple)",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                {"// SEARCH FAILED"}
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
                Couldn&apos;t reach the server. Reload to try again.
              </p>
            </div>
          ) : items.length === 0 ? (
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
                {"// NO PARTS FOUND"}
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
                Try adjusting your filters
              </p>
            </div>
          ) : (
            items.map((part) => <PartRow key={part.id} part={part} />)
          )}
        </div>

        {/* Pagination */}
        {!failed && totalPages > 1 && (
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Prev */}
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

            {/* Page indicator */}
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

            {/* Next */}
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

export default async function MarketPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="flex flex-col flex-1">
        <Suspense
          fallback={
            <div className="py-20 text-center mono" style={{ color: "var(--text-dim)" }}>
              Loading…
            </div>
          }
        >
          <PartsList searchParams={resolvedParams} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
