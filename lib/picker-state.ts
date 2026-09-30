/**
 * What a slot's part picker remembers between opens, so closing the modal
 * doesn't throw away the filters. Kept in memory on the /build page only;
 * a reload starts clean.
 *
 * Platform filters (socket, DDR) are not stored as values: they come from the
 * rest of the build, which can change while the picker is closed. `filters`
 * holds only what the user chose, and `dismissed` remembers a platform value
 * the user cleared or changed, so it isn't forced back on at the next open.
 * If the platform changes, the new value applies again.
 */
export interface PickerState {
  search: string;
  sort: "price_asc" | "price_desc";
  /** The user's own spec filters, platform-derived values left out. */
  filters: Record<string, string>;
  modelSlug: string;
  minPrice: string;
  maxPrice: string;
  source: string;
  /** Platform filter values the user cleared or overrode, by key. */
  dismissed: Record<string, string>;
}

/** Spec filters to open with: the saved ones, then the platform's unless dismissed. */
export function initialFilters(
  saved: PickerState | undefined,
  platform: Record<string, string>
): Record<string, string> {
  const filters = { ...(saved?.filters ?? {}) };
  for (const [key, value] of Object.entries(platform)) {
    if (saved?.dismissed[key] !== value) filters[key] = value;
  }
  return filters;
}

/** Split the picker's active filters back into the user's and the dismissed platform ones. */
export function splitFilters(
  active: Record<string, string>,
  platform: Record<string, string>
): Pick<PickerState, "filters" | "dismissed"> {
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(active)) {
    if (platform[key] !== value) filters[key] = value;
  }
  const dismissed: Record<string, string> = {};
  for (const [key, value] of Object.entries(platform)) {
    if (active[key] !== value) dismissed[key] = value;
  }
  return { filters, dismissed };
}
