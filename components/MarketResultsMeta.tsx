"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { monoFont } from "@/lib/tokens";
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
    );
  }

  if (part === "range") {
    if (total === 0) return null;
    return (
      <span style={{ fontFamily: monoFont, fontSize: "0.65rem", color: "var(--text-dim)" }}>
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
    const p = new URLSearchParams();
    if (source) p.set("source", source);
    if (sort !== "price_asc") p.set("sort", sort);
    if (minPrice) p.set("min_price", minPrice);
    if (maxPrice) p.set("max_price", maxPrice);
    if (effectiveQ) p.set("q", effectiveQ);
    for (const [k, v] of Object.entries(specParams)) p.set(k, v);
    if (newOffset > 0) p.set("offset", String(newOffset));
    const qs = p.toString();
    return `/market/${category}${qs ? "?" + qs : ""}`;
  }

  return (
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
          href={pageUrl(offset - limit)}
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
          href={pageUrl(offset + limit)}
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
  );
}
