"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildPageUrl } from "@/lib/constants";
import { subscribeIndexReady, subscribeSearch, subscribeTotal } from "@/lib/search-bus";

interface Props {
  /** Which fragment of the server-rendered meta this instance replaces. */
  part: "count" | "range" | "pagination";
  serverTotal: number;
  offset: number;
  limit: number;
  /** Same gate as FilterBar's clientIndexActive — true unless a spec filter is active. */
  clientIndexActive: boolean;
  category: string;
  source?: string;
  sort: "price_asc" | "price_desc";
  minPrice?: string;
  maxPrice?: string;
  q?: string;
  specParams: Record<string, string>;
  failed: boolean;
}

/**
 * The results count, the "X-Y of N" range line, and the Prev/Next pagination
 * all derive from `total` — and once the client index takes over, the
 * server's `total` goes stale (a client-side search for "5090" would still
 * claim 832 results / 17 pages under the server's number). This subscribes
 * to the same bus MarketSearchResults publishes to, so all three pick up the
 * real client-side match count. Three instances (one per `part`) share the
 * bus subscription pattern rather than duplicating it — cheap, and keeps
 * each fragment textually where the server-rendered version used to live.
 */
export default function MarketResultsMeta({
  part, serverTotal, offset, limit, clientIndexActive, category,
  source, sort, minPrice, maxPrice, q, specParams, failed,
}: Props) {
  const [indexReady, setIndexReady] = useState(false);
  const [busTotal, setBusTotal] = useState<number | null>(null);
  const [busQuery, setBusQuery] = useState(q ?? "");

  useEffect(() => subscribeIndexReady(setIndexReady), []);
  useEffect(() => subscribeTotal(setBusTotal), []);
  useEffect(() => subscribeSearch(({ q: liveQ }) => setBusQuery(liveQ)), []);

  const total = clientIndexActive && indexReady && busTotal !== null ? busTotal : serverTotal;
  // Once the client index is driving, typing never touches the server `q`
  // prop (it only updates the address bar via history.replaceState), so
  // pagination links built from that prop would silently drop the query.
  // Read the live query off the same bus MarketSearchResults publishes to.
  const effectiveQ = clientIndexActive && indexReady ? busQuery : q;

  if (part === "count") {
    return (
      <span className="market-list-count">
        {total.toLocaleString()} results
      </span>
    );
  }

  if (part === "range") {
    if (total === 0) return null;
    return (
      <span className="market-range">
        {offset + 1}–{Math.min(offset + limit, total)} of {total.toLocaleString()}
      </span>
    );
  }

  // part === "pagination"
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  if (failed || totalPages <= 1) return null;

  function pageUrl(newOffset: number) {
    return buildPageUrl({
      basePath: `/market/${category}`,
      source,
      sort,
      min_price: minPrice,
      max_price: maxPrice,
      q: effectiveQ,
      ...specParams,
      offset: newOffset,
    });
  }

  return (
    <div className="market-pager">
      {hasPrev ? (
        <Link prefetch={false}
          href={pageUrl(offset - limit)}
          className="market-pager-btn market-pager-btn--prev"
        >
          ← Prev
        </Link>
      ) : (
        <span className="market-pager-spacer" />
      )}
      <span className="market-pager-page">
        {currentPage} / {totalPages}
      </span>
      {hasNext ? (
        <Link prefetch={false}
          href={pageUrl(offset + limit)}
          className="market-pager-btn market-pager-btn--next"
        >
          Next →
        </Link>
      ) : (
        <span className="market-pager-spacer" />
      )}
    </div>
  );
}
