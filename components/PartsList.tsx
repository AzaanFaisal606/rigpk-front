import { Suspense } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import PartRow from "@/components/PartRow";
import MarketSearchResults from "@/components/MarketSearchResults";
import MarketResultsMeta from "@/components/MarketResultsMeta";
import FacetLinks from "@/components/FacetLinks";
import ModelPulldown from "@/components/ModelPulldown";
import { getParts } from "@/lib/api";
import { str } from "@/lib/utils";
import { buildPageUrl, CATEGORY_NAMES, DEFAULT_SORT, SPEC_KEYS } from "@/lib/constants";

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
  /** Filters implied by a clean facet path (/market/ram/ddr5), already merged
   *  into `searchParams`; FilterBar needs them separately to show them as
   *  set and to carry them into query-string URLs when they change. */
  baseParams?: Record<string, string>;
  /** H1 override for facet pages. */
  heading?: string;
  /** Slug of the facet page being shown, highlighted in the popular chips. */
  activeFacet?: string;
}

export default async function PartsList({ category, searchParams, baseParams, heading: headingOverride, activeFacet }: Props) {
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

  const shortLabel = resolvedCategory ? resolvedCategory.toUpperCase() + "S" : "ALL PARTS";
  // Keyword-bearing H1 ("GPU Prices in Pakistan"); the short label stays for
  // the compact list header below.
  const categoryName = resolvedCategory
    ? CATEGORY_NAMES[resolvedCategory as keyof typeof CATEGORY_NAMES] ?? resolvedCategory.toUpperCase()
    : null;
  const heading = headingOverride
    ?? (categoryName ? `${categoryName} Prices in Pakistan` : "PC Part Prices in Pakistan");
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
          baseParams={baseParams}
          pulldown={
            <Suspense fallback={null}>
              <ModelPulldown
                initialPath={resolvedCategory === "gpu" || resolvedCategory === "cpu" ? [resolvedCategory] : []}
                rowMaxWidth="72rem"
              />
            </Suspense>
          }
        />
      </Suspense>

      {/* Top padding clears the "Shop by model" lip hanging off the bar. */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6 w-full market-list-wrap">
        {/* Section header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="market-h1">
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
              <span className="market-range">
                {offset + 1}–{Math.min(offset + LIMIT, total)} of {total.toLocaleString()}
              </span>
            )
          )}
        </div>

        {category && <FacetLinks category={category} activeFacet={activeFacet} />}

        {/* Parts list card — bigger shadow like PartPickerModal */}
        <div className="market-list-card">
          {/* Black header bar */}
          <div className="market-list-bar">
            <span className="market-list-bar-title">
              {shortLabel} — Parts List
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
              <span className="market-list-count">
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
            <div className="market-empty">
              <p className="status-title status-title--error">
                {"// SEARCH FAILED"}
              </p>
              <p className="status-text">
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
            <div className="market-empty">
              <p className="status-title status-title--empty">
                {"// NO PARTS FOUND"}
              </p>
              <p className="status-text">
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
            <div className="market-pager">
              {/* Prev */}
              {hasPrev ? (
                <Link prefetch={false}
                  href={pageUrl(offset - LIMIT)}
                  className="market-pager-btn market-pager-btn--prev"
                >
                  ← Prev
                </Link>
              ) : (
                <span className="market-pager-spacer" />
              )}

              {/* Page indicator */}
              <span className="market-pager-page">
                {currentPage} / {totalPages}
              </span>

              {/* Next */}
              {hasNext ? (
                <Link prefetch={false}
                  href={pageUrl(offset + LIMIT)}
                  className="market-pager-btn market-pager-btn--next"
                >
                  Next →
                </Link>
              ) : (
                <span className="market-pager-spacer" />
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}
