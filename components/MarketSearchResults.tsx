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

  // The fallback rule, applied literally: a spec filter the client index
  // cannot evaluate hands control back to the server, exactly like a
  // not-yet-loaded or failed index does.
  //
  // `ready` alone is not enough. PartsList keeps this component MOUNTED for
  // every spec-filter change (it renders on `category`, not on
  // `specFiltersActive`), so `ready` — set true once and never reset — stays
  // true across the transition. Gating on it alone froze the rendered list on
  // the last client-index match while MarketResultsMeta, which computes
  // `clientIndexActive` as `!specFiltersActive` independently, correctly
  // switched to the server's filtered total. The visible result was a row
  // list that disagreed with its own count, and stayed stuck for every later
  // interaction until the category changed or the page reloaded.
  const clientPathActive = ready && !specFiltersActive;

  // Server render is authoritative until the index exists. Derived during
  // render (not synced via effect) so a fresh SSR payload — e.g. a filter
  // change that re-renders this instance with new initialItems — is reflected
  // immediately without an extra setState-in-effect render pass.
  const displayedItems = clientPathActive ? items : initialItems;

  useEffect(() => {
    if (!clientPathActive) return;
    // The client path has no `isPending` — it never navigates — so FilterBar's
    // transition can't flag the document for it. Set the same attribute here
    // instead, so globals.css dims the list during a client query exactly as
    // it does during a server one. Without this the two paths looked like
    // different features: the unfiltered page faded while resolving, the
    // category page just snapped.
    const flagOn = () => { document.documentElement.dataset.filtering = "1"; };
    const flagOff = () => { delete document.documentElement.dataset.filtering; };
    const unsubscribe = subscribeSearch(({ q }) => {
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
      flagOn();
      getPartsByIds(ids).then((res) => {
        // A superseded response must not lift the flag — the newer one is
        // still in flight and still owns it.
        if (seq !== seqRef.current) return;
        flagOff();
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
    return () => {
      unsubscribe();
      // Unmounting mid-flight would otherwise leave the whole page dimmed.
      flagOff();
    };
  }, [clientPathActive, source, minPrice, maxPrice, sort, offset, limit]);

  // Only a live client-path failure counts. `failed` persists in state, so
  // without this gate a spec filter applied after a failed getPartsByIds
  // would keep showing SEARCH FAILED over a perfectly good server render.
  if (clientPathActive && failed) {
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
