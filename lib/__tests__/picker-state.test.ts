import { describe, expect, it } from "vitest";
import { initialFilters, splitFilters, type PickerState } from "@/lib/picker-state";

function saved(over: Partial<PickerState> = {}): PickerState {
  return {
    search: "", sort: "price_asc", filters: {}, modelSlug: "",
    minPrice: "", maxPrice: "", source: "", dismissed: {}, ...over,
  };
}

/** Close with `active` set under `platform`, reopen under `next`. */
function roundTrip(active: Record<string, string>, platform: Record<string, string>, next = platform) {
  return initialFilters(saved(splitFilters(active, platform)), next);
}

describe("picker state", () => {
  it("opens with just the platform the first time", () => {
    expect(initialFilters(undefined, { socket: "AM4" })).toEqual({ socket: "AM4" });
    expect(initialFilters(undefined, {})).toEqual({});
  });

  it("keeps the user's filters across a close and reopen", () => {
    expect(roundTrip({ socket: "AM4", brand: "AMD" }, { socket: "AM4" })).toEqual({ socket: "AM4", brand: "AMD" });
    expect(roundTrip({ vram: "16GB" }, {})).toEqual({ vram: "16GB" });
  });

  it("remembers a cleared platform filter while the platform stays the same", () => {
    expect(roundTrip({ brand: "AMD" }, { socket: "AM4" })).toEqual({ brand: "AMD" });
  });

  it("remembers a platform value the user overrode", () => {
    expect(roundTrip({ socket: "AM5" }, { socket: "AM4" })).toEqual({ socket: "AM5" });
  });

  it("applies a changed platform again, over the user's old choice", () => {
    expect(roundTrip({}, { socket: "AM4" }, { socket: "AM5" })).toEqual({ socket: "AM5" });
    expect(roundTrip({ socket: "LGA1700" }, { socket: "AM4" }, { socket: "AM5" })).toEqual({ socket: "AM5" });
  });

  it("drops a platform filter once the part that set it is removed", () => {
    expect(roundTrip({ socket: "AM4", brand: "AMD" }, { socket: "AM4" }, {})).toEqual({ brand: "AMD" });
  });
});
