// Server-only: imports sharp. Only server components and route code may use it.
import sharp from "sharp";
import { isBorderTransparent } from "./thumb-alpha";

const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 4 * 1024 * 1024;
const SAMPLE_SIZE = 96;
// Same honest-bot convention the scrapers follow — retailer bot challenges
// block clients that pretend to be a browser.
const USER_AGENT = "RigPK-ThumbCheck/1.0 (+https://github.com/AzaanFaisal606/rigpk-backend)";

// Per-process memo: a thumbnail URL's verdict never changes, and both the
// /prebuilts page and every budget page ask about the same few images.
const verdicts = new Map<string, Promise<boolean>>();

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

/** Cached verdict: does this image have a transparent (backgroundless) border? */
export function isBackgroundless(url: string): Promise<boolean> {
  let v = verdicts.get(url);
  if (!v) {
    v = analyse(url).then(result => {
      if (result === null) verdicts.delete(url);
      return result === true;
    });
    verdicts.set(url, v);
  }
  return v;
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
  const candidates = [...new Set(urls.filter((u): u is string => !!u && /^https:\/\//.test(u)))]
    .slice(0, maxAttempts);
  if (candidates.length === 0) return null;
  const verdictList = await Promise.all(candidates.map(isBackgroundless));
  const idx = verdictList.indexOf(true);
  return candidates[idx === -1 ? 0 : idx];
}
