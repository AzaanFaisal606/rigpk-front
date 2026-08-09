/**
 * In-browser search over one category's catalogue.
 *
 * The market page is always category-scoped, so the index is 4-35 KB gzipped
 * and builds in tens of milliseconds — no Web Worker needed. Typing produces
 * zero network requests, which is what makes races and stale-cache flicker
 * structurally impossible rather than merely unlikely.
 */
import MiniSearch from "minisearch";
import { indexTokens, searchTokens } from "@/lib/search-tokenize";

export type IndexRow = [id: number, name: string, srcIdx: number, price: number];

export interface SearchIndexPayload {
  srcs: string[];
  rows: IndexRow[];
  version: string;
}

export interface QueryOpts {
  q: string;
  source?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: "price_asc" | "price_desc";
  offset: number;
  limit: number;
}

export interface SearchIndex {
  version: string;
  query(opts: QueryOpts): { ids: number[]; total: number };
}

interface Doc { id: number; name: string; source: string; price: number }

export function buildIndex(payload: SearchIndexPayload): SearchIndex {
  const docs: Doc[] = payload.rows.map(([id, name, srcIdx, price]) => ({
    id, name, source: payload.srcs[srcIdx], price,
  }));

  const mini = new MiniSearch<Doc>({
    fields: ["name"],
    storeFields: [],
    // Same tokenizer as the server's name_norm column, so "5060ti" and
    // "5060 ti" are the same query on both sides.
    tokenize: indexTokens,
    searchOptions: { prefix: true, combineWith: "AND" },
  });
  mini.addAll(docs);

  const byId = new Map(docs.map((d) => [d.id, d]));

  return {
    version: payload.version,
    query({ q, source, minPrice, maxPrice, sort, offset, limit }) {
      const tokens = searchTokens(q);

      let matched: Doc[];
      if (tokens.length === 0) {
        matched = docs;
      } else {
        // Re-tokenize through our own splitter so the query MiniSearch sees is
        // already normalised the same way the documents were.
        matched = mini
          .search(tokens.join(" "))
          .map((r) => byId.get(r.id as number))
          .filter((d): d is Doc => d !== undefined);
      }

      const filtered = matched.filter(
        (d) =>
          (source === undefined || d.source === source) &&
          (minPrice === undefined || d.price >= minPrice) &&
          (maxPrice === undefined || d.price <= maxPrice),
      );

      filtered.sort((a, b) =>
        sort === "price_asc" ? a.price - b.price : b.price - a.price,
      );

      return {
        ids: filtered.slice(offset, offset + limit).map((d) => d.id),
        total: filtered.length,
      };
    },
  };
}
