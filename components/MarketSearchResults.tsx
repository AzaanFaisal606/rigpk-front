"use client";

import { useEffect, useRef, useState } from "react";
import PartRow from "@/components/PartRow";
import { getPartsByIds, getSearchIndex, type Part } from "@/lib/api";
import { buildIndex, type SearchIndex } from "@/lib/search-index";
import { publishSearch, publishTotal, setIndexReady, subscribeSearch } from "@/lib/search-bus";
import { monoFont } from "@/lib/tokens";

interface Props {
  category: string;
  initialItems: Part[];
  /** The URL's `q` at the time of this SSR render — seeds the bus once the
   *  index loads, so the first client query (and MarketResultsMeta's
   *  pagination hrefs) start from what's already in the address bar rather
   *  than an empty string. */
  initialQ?: string;
  /** Server-side filters the client index cannot evaluate. */
  specFiltersActive: boolean;
  source?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: "price_asc" | "price_desc";
  limit: number;
  offset: number;
}

export default function MarketSearchResults({
  category, initialItems, initialQ, specFiltersActive,
  source, minPrice, maxPrice, sort, limit, offset,
}: Props) {
  const indexRef = useRef<SearchIndex | null>(null);
  const seqRef = useRef(0);

  const [items, setItems] = useState<Part[]>(initialItems);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  // Load the category index once. A null payload is not a user-facing error —
  // it just means the server path stays in charge. `setIndexReady` mirrors
  // readiness onto the shared bus so FilterBar — which cannot see this
  // component's local state — knows whether it's safe to stop
  // server-navigating on every keystroke.
  useEffect(() => {
    if (specFiltersActive) return;
    let cancelled = false;
    getSearchIndex(category).then((payload) => {
      if (cancelled) return;
      if (!payload) { setIndexReady(false); return; }
      indexRef.current = buildIndex(payload);
      // Seed the bus from the URL's own `q` before anything subscribes to
      // it. Without this, the bus still holds its default `{q: ""}` the
      // moment the query-subscribing effect below fires its immediate
      // resubscribe callback, which would wipe a correct direct-load render
      // (e.g. /market/gpu?q=rtx&offset=50) with an unfiltered query.
      publishSearch({ q: initialQ ?? "" });
      setReady(true);
      setIndexReady(true);
    });
    return () => {
      cancelled = true;
      setIndexReady(false);
      publishTotal(null);
    };
  }, [category, specFiltersActive, initialQ]);

  // Server render is authoritative until the index exists. Derived during
  // render (not synced via effect) so a fresh SSR payload — e.g. a filter
  // change that remounts this instance with new initialItems — is reflected
  // immediately without an extra setState-in-effect render pass.
  const displayedItems = ready ? items : initialItems;

  useEffect(() => {
    if (!ready) return;
    return subscribeSearch(({ q }) => {
      const index = indexRef.current;
      if (!index) return;

      // `total` here is the true match count across the whole filtered set,
      // computed by the index itself — NOT the same number as the eventual
      // getPartsByIds response's `total`, which is just `ids.length` (the
      // page slice, capped at `limit`). Publishing the response's total
      // instead of this one silently pinned every result count to the page
      // size and hid the Next link past page 1.
      const { ids, total } = index.query({
        q, source, minPrice, maxPrice, sort, offset, limit,
      });

      // Monotonic sequence: a slow response for an earlier query must never
      // overwrite a newer one. This is the flip-flop the user reported.
      const seq = ++seqRef.current;
      getPartsByIds(ids).then((res) => {
        if (seq !== seqRef.current) return;   // superseded, discard
        if (!res.ok) { setFailed(true); return; }
        setFailed(false);
        // Only commit non-empty results, or a genuinely empty match. Never
        // blank the list mid-flight — that is the visible flicker.
        setItems(res.items);
        // Let the count/range/pagination meta (MarketResultsMeta) show the
        // real client-side match count instead of the server's stale total.
        publishTotal(total);
      });
    });
  }, [ready, source, minPrice, maxPrice, sort, offset, limit]);

  if (failed) {
    return (
      <div style={{ padding: "64px 24px", textAlign: "center",
                    background: "var(--bg-card)", borderTop: "1px solid #111112" }}>
        <p style={{ fontFamily: monoFont, fontSize: "0.9rem", fontWeight: 900,
                    color: "var(--purple)", letterSpacing: "3px",
                    textTransform: "uppercase" }}>
          {"// SEARCH FAILED"}
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
          Couldn&apos;t reach the server. Reload to try again.
        </p>
      </div>
    );
  }

  if (displayedItems.length === 0) {
    return (
      <div style={{ padding: "64px 24px", textAlign: "center",
                    background: "var(--bg-card)", borderTop: "1px solid #111112" }}>
        <p style={{ fontFamily: monoFont, fontSize: "0.9rem", fontWeight: 900,
                    color: "var(--text-dim)", letterSpacing: "3px",
                    textTransform: "uppercase" }}>
          {"// NO PARTS FOUND"}
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "8px" }}>
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return <>{displayedItems.map((part) => <PartRow key={part.id} part={part} />)}</>;
}
