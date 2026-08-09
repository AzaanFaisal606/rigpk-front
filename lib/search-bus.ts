/**
 * FilterBar and MarketSearchResults are siblings rendered by a server
 * component, so neither can lift state to a common client ancestor without
 * making the whole page client-rendered. This module-level bus is the minimal
 * connection between them.
 */
export interface SearchState { q: string }

type Listener = (s: SearchState) => void;
const listeners = new Set<Listener>();
let current: SearchState = { q: "" };

export function publishSearch(s: SearchState) {
  current = s;
  for (const fn of listeners) fn(s);
}

export function subscribeSearch(fn: Listener): () => void {
  listeners.add(fn);
  fn(current);               // fire immediately with current state — lets a
                              // subscriber that mounts/resubscribes after the
                              // query already changed (e.g. MarketSearchResults
                              // resubscribing because `offset` changed under
                              // pagination) pick up the latest query without
                              // waiting for the next keystroke.
  return () => { listeners.delete(fn); };
}

export function currentSearch(): SearchState {
  return current;
}

/**
 * Whether the in-browser index finished loading. FilterBar must not stop
 * server-navigating until this is true — otherwise a failed index fetch
 * leaves typing updating the URL with nothing listening, and search silently
 * stops working.
 */
let indexReady = false;
const readyListeners = new Set<(r: boolean) => void>();

export function setIndexReady(v: boolean) {
  indexReady = v;
  for (const fn of readyListeners) fn(v);
}

export function subscribeIndexReady(fn: (r: boolean) => void): () => void {
  readyListeners.add(fn);
  fn(indexReady);            // fire immediately with current state
  return () => { readyListeners.delete(fn); };
}

/**
 * The client index's current result count for the in-flight/most recent
 * query, published by MarketSearchResults. The count/range/pagination meta
 * (MarketResultsMeta) subscribes to this so it reflects the real client-side
 * match count instead of the server's stale `total` once the index takes
 * over. `null` means "no client query has resolved yet" — meta should keep
 * showing the server's total.
 */
let currentTotal: number | null = null;
const totalListeners = new Set<(t: number | null) => void>();

export function publishTotal(t: number | null) {
  currentTotal = t;
  for (const fn of totalListeners) fn(t);
}

export function subscribeTotal(fn: (t: number | null) => void): () => void {
  totalListeners.add(fn);
  fn(currentTotal);           // fire immediately with current state
  return () => { totalListeners.delete(fn); };
}
