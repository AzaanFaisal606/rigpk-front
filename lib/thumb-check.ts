// Server-only: imports sharp. Only server components and route code may use it.
import { unstable_cache } from "next/cache";
import sharp from "sharp";
import { isBorderTransparent } from "./thumb-alpha";

const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 4 * 1024 * 1024;
const SAMPLE_SIZE = 96;
// Same honest-bot convention the scrapers follow — retailer bot challenges
// block clients that pretend to be a browser.
const USER_AGENT = "RigPK-ThumbCheck/1.0 (+https://github.com/AzaanFaisal606/rigpk-backend)";

// A URL's verdict never changes; the window only bounds how long a retailer
// re-uploading an image under the same URL can go unnoticed.
const VERDICT_REVALIDATE = 30 * 86400;

// Per-process memo in front of the shared cache: both the /prebuilts page and
// every budget page ask about the same few images.
const verdicts = new Map<string, Promise<boolean | null>>();

// Resolves null when the image couldn't be fetched (timeout, network, 5xx):
// that says nothing about the image, so it must not be memoised as a "no".
async function analyse(url: string): Promise<boolean | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return res.status >= 500 ? null : false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_BYTES) return false;

    const img = sharp(buf, { failOn: "none" });
    const meta = await img.metadata();
    if (!meta.hasAlpha) return false;

    const { data, info } = await img
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    return isBorderTransparent(data, info.width, info.height, info.channels);
  } catch (err) {
    const name = (err as Error)?.name;
    // Timeouts and dropped connections are transient; a decode failure is not.
    return name === "TimeoutError" || name === "AbortError" || name === "TypeError" ? null : false;
  }
}

/** Thrown inside the cached function so unstable_cache never stores an unknown verdict. */
class TransientThumbError extends Error {}

/**
 * The verdict per URL (the argument is part of the cache key), shared across
 * Fluid instances. The in-process memo alone meant every fresh instance
 * re-downloaded and re-decoded every thumbnail it was asked about.
 */
const cachedVerdict = unstable_cache(
  async (url: string): Promise<boolean> => {
    const result = await analyse(url);
    if (result === null) throw new TransientThumbError(url);
    return result;
  },
  ["thumb-verdict-v1"],
  { revalidate: VERDICT_REVALIDATE }
);

/**
 * Verdict for one URL, or null when the image couldn't be fetched this time.
 * Null is never cached, in process or across instances: the next call retries.
 */
export function checkBackgroundless(url: string): Promise<boolean | null> {
  let v = verdicts.get(url);
  if (!v) {
    v = cachedVerdict(url).catch(() => {
      verdicts.delete(url);
      return null;
    });
    verdicts.set(url, v);
  }
  return v;
}

/** Cached verdict: does this image have a transparent (backgroundless) border? */
export async function isBackgroundless(url: string): Promise<boolean> {
  return (await checkBackgroundless(url)) === true;
}

export interface ThumbPick {
  src: string | null;
  /**
   * False when a candidate ranked before the pick couldn't be checked: a
   * better thumbnail may exist, so a caller caching the pick should not.
   */
  settled: boolean;
}

/** pickBackgroundlessThumb, also saying whether every verdict that mattered was known. */
export async function pickBackgroundlessThumbSettled(
  urls: (string | null | undefined)[],
  maxAttempts = 8
): Promise<ThumbPick> {
  const candidates = [...new Set(urls.filter((u): u is string => !!u && /^https:\/\//.test(u)))]
    .slice(0, maxAttempts);
  if (candidates.length === 0) return { src: null, settled: true };
  const verdictList = await Promise.all(candidates.map(checkBackgroundless));
  const idx = verdictList.indexOf(true);
  const ahead = idx === -1 ? verdictList : verdictList.slice(0, idx);
  return { src: candidates[idx === -1 ? 0 : idx], settled: !ahead.includes(null) };
}

/**
 * Thumbnail for a list sorted most-relevant first: the first of the leading
 * `maxAttempts` thumbnails that is backgroundless, else the first thumbnail.
 * Candidates are checked in parallel; order decides the winner.
 */
export async function pickBackgroundlessThumb(
  urls: (string | null | undefined)[],
  maxAttempts = 8
): Promise<string | null> {
  return (await pickBackgroundlessThumbSettled(urls, maxAttempts)).src;
}
