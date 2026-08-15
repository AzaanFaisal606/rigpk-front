import { Suspense } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import PartRow from "@/components/PartRow";
import MarketSearchResults from "@/components/MarketSearchResults";
import MarketResultsMeta from "@/components/MarketResultsMeta";
import { getParts } from "@/lib/api";
import { str } from "@/lib/utils";
import { monoFont } from "@/lib/tokens";
import { buildPageUrl, DEFAULT_SORT, SPEC_KEYS } from "@/lib/constants";

const LIMIT = 50;

interface Props {
  /** Omitted on the all-categories route (`/market`); the `?category=` query
   *  param drives filtering there instead. Present on `/market/[category]`,
   *  where it also unlocks the client-side search index path — there is no
   *  search index for "all categories", only a per-category one
   *  (`getSearchIndex(category)`), so that path only makes sense when a
   *  single category is known. */
  category?: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function PartsList({ category, searchParams }: Props) {
  const resolvedCategory = category ?? str(searchParams.category);
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
  const specFiltersActive = Object.keys(specParams).length > 0;

  const result = await getParts({
    category: resolvedCategory,
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

  const heading = resolvedCategory ? resolvedCategory.toUpperCase() + "S" : "ALL PARTS";
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;
  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < total;

  // Only reached on the all-categories route — /market/[category] delegates
  // pagination to MarketResultsMeta instead (its links stay in sync with the
  // live client-side search total).
  function pageUrl(newOffset: number) {
    return buildPageUrl({
      basePath: "/market",
      category: resolvedCategory,
      source,
      sort,
      min_price: minPrice,
      max_price: maxPrice,
      q,
      ...specParams,
      offset: newOffset,
    });
  }

  return (
    <>
      <Suspense>
        <FilterBar
          total={total}
          activeCategory={category}
          clientIndexActive={category ? !specFiltersActive : false}
        />
      </Suspense>

      <div className="max-w-6xl mx-auto px-6 py-6 w-full market-list-wrap">
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
          {category ? (
            total > 0 && (
              <MarketResultsMeta
                part="range"
                serverTotal={total}
                offset={offset}
                limit={LIMIT}
                clientIndexActive={!specFiltersActive}
                category={category}
                source={source}
                sort={sort}
                minPrice={minPrice}
                maxPrice={maxPrice}
                q={q}
                specParams={specParams}
                failed={failed}
              />
            )
          ) : (
            total > 0 && (
              <span style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--text-dim)" }}>
                {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()}
              </span>
            )
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
            {category ? (
              <MarketResultsMeta
                part="count"
                serverTotal={total}
                offset={offset}
                limit={LIMIT}
                clientIndexActive={!specFiltersActive}
                category={category}
                source={source}
                sort={sort}
                minPrice={minPrice}
                maxPrice={maxPrice}
                q={q}
                specParams={specParams}
                failed={failed}
              />
            ) : (
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
            )}
          </div>

          {failed ? (
            // SSR-level failure (e.g. the backend is unreachable on first
            // paint). MarketSearchResults has no way to know about this — its
            // own `failed` state only tracks client-side getPartsByIds
            // failures — so this stays a server-rendered branch rather than
            // folding into the client component. Typing while this is up
            // still server-navigates (FilterBar's clientPathActive is false
            // until the index actually loads), and a failed re-fetch lands
            // right back here.
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
          ) : category ? (
            <MarketSearchResults
              category={category}
              initialItems={items}
              initialQ={q}
              specFiltersActive={specFiltersActive}
              source={source}
              minPrice={minPrice ? Number(minPrice) : undefined}
              maxPrice={maxPrice ? Number(maxPrice) : undefined}
              sort={sort}
              limit={LIMIT}
              offset={offset}
            />
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
        {category ? (
          <MarketResultsMeta
            part="pagination"
            serverTotal={total}
            offset={offset}
            limit={LIMIT}
            clientIndexActive={!specFiltersActive}
            category={category}
            source={source}
            sort={sort}
            minPrice={minPrice}
            maxPrice={maxPrice}
            q={q}
            specParams={specParams}
            failed={failed}
          />
        ) : (
          !failed && totalPages > 1 && (
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
          )
        )}
      </div>
    </>
  );
}
