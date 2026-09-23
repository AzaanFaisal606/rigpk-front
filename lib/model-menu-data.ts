// Server-only: pulls in thumb-check (sharp).
import { unstable_cache } from "next/cache";
import { MODELS, MODEL_SERIES, partsForModel, summarizeModel, thumbCandidates } from "./models";
import { getCategoryCatalogue, MODEL_REVALIDATE, type ModelCount } from "./model-data";
import { isBackgroundless, pickBackgroundlessThumb } from "./thumb-check";

export interface MenuThumb {
  src: string;
  /** Transparent background, so it sits straight on the maroon well. */
  clean: boolean;
}

export interface ModelMenuData {
  /** Listing count and cheapest price, keyed `${category}/${slug}`. */
  counts: Record<string, ModelCount>;
  /** Thumbnail per model (same keys), backgroundless where one exists. */
  thumbs: Record<string, MenuThumb | null>;
  /** Thumbnail per series key: its most-listed model with a clean one, else its most-listed. */
  seriesThumbs: Record<string, MenuThumb | null>;
}

// Models are checked a few at a time, each against its first few candidate
// images, so a cold cache never fires hundreds of requests at the retailers.
const THUMB_CONCURRENCY = 6;
const THUMB_ATTEMPTS = 6;

async function build(): Promise<ModelMenuData> {
  const [gpu, cpu] = await Promise.all([getCategoryCatalogue("gpu"), getCategoryCatalogue("cpu")]);
  // Thrown, not returned: unstable_cache must not store a failed build.
  if (!gpu.ok || !cpu.ok) throw new Error("Model menu: parts catalogue fetch failed");

  const partsByKey = new Map(
    MODELS.map(e => [`${e.category}/${e.slug}`, { e, parts: partsForModel(e.category === "gpu" ? gpu.items : cpu.items, e) }])
  );

  const counts: Record<string, ModelCount> = {};
  for (const [key, { parts }] of partsByKey) {
    const s = summarizeModel(parts);
    counts[key] = { count: s.count, min: s.min };
  }

  const thumbs: Record<string, MenuThumb | null> = {};
  const keys = [...partsByKey.keys()];
  for (let i = 0; i < keys.length; i += THUMB_CONCURRENCY) {
    await Promise.all(
      keys.slice(i, i + THUMB_CONCURRENCY).map(async key => {
        const { e, parts } = partsByKey.get(key)!;
        const src = await pickBackgroundlessThumb(thumbCandidates(parts, e), THUMB_ATTEMPTS);
        // Memoised by the pick above, so this costs no second fetch.
        thumbs[key] = src ? { src, clean: await isBackgroundless(src) } : null;
      })
    );
  }

  const seriesThumbs: Record<string, MenuThumb | null> = {};
  for (const s of MODEL_SERIES) {
    const inSeries = MODELS.filter(m => m.series === s.key)
      .map(m => `${m.category}/${m.slug}`)
      .sort((a, b) => counts[b].count - counts[a].count)
      .map(k => thumbs[k])
      .filter((t): t is MenuThumb => t != null);
    seriesThumbs[s.key] = inSeries.find(t => t.clean) ?? inSeries[0] ?? null;
  }

  return { counts, thumbs, seriesThumbs };
}

// unstable_cache doesn't merge concurrent misses: during `next build` every
// page rendering at once in a worker would run its own build(). One shared
// promise per process, kept as long as the cache entry, makes that one run.
let inFlight: { at: number; promise: Promise<ModelMenuData> } | null = null;

function buildOnce(): Promise<ModelMenuData> {
  if (!inFlight || Date.now() - inFlight.at > MODEL_REVALIDATE * 1000) {
    const promise = build();
    inFlight = { at: Date.now(), promise };
    // A failure must not stick: the next caller retries.
    promise.catch(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
  }
  return inFlight.promise;
}

/**
 * Everything the model pulldown shows beyond the static catalog. Cached as one
 * entry for an hour across requests and pages: every market page carries the
 * menu, and the thumbnail checks are too slow to repeat per render.
 */
const getCachedMenuData = unstable_cache(buildOnce, ["model-menu-data-v5"], { revalidate: MODEL_REVALIDATE });

/** Null when the catalogue fetch failed; the menu then renders without counts or thumbnails. */
export async function getModelMenuData(): Promise<ModelMenuData | null> {
  try {
    return await getCachedMenuData();
  } catch {
    return null;
  }
}
