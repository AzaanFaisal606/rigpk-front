/**
 * Pure decision logic for "is this thumbnail backgroundless?" — kept free of
 * sharp and network so it can be unit tested with synthetic buffers.
 */

export interface AlphaCheckOptions {
  /** Width of the sampled border strip, as a fraction of the shorter side. */
  stripFraction?: number;
  /** A pixel counts as transparent below this alpha (0-255). */
  alphaThreshold?: number;
  /** Share of sampled border pixels that must be transparent. */
  minTransparentShare?: number;
}

/**
 * True when the image's border strip is mostly transparent: at least
 * `minTransparentShare` of the pixels within `stripFraction` of any edge have
 * alpha below `alphaThreshold`. `data` is raw interleaved pixels with
 * `channels` bytes each; anything without an alpha channel (channels < 4, or
 * 2 for grey+alpha) is never backgroundless.
 */
export function isBorderTransparent(
  data: Uint8Array,
  width: number,
  height: number,
  channels: number,
  opts: AlphaCheckOptions = {}
): boolean {
  const { stripFraction = 0.04, alphaThreshold = 16, minTransparentShare = 0.9 } = opts;
  const hasAlpha = channels === 4 || channels === 2;
  if (!hasAlpha || width <= 0 || height <= 0) return false;
  if (data.length < width * height * channels) return false;

  const strip = Math.max(1, Math.round(Math.min(width, height) * stripFraction));
  const alphaOffset = channels - 1;
  let sampled = 0;
  let transparent = 0;

  for (let y = 0; y < height; y++) {
    const inYStrip = y < strip || y >= height - strip;
    for (let x = 0; x < width; x++) {
      if (!inYStrip && x >= strip && x < width - strip) {
        x = width - strip - 1; // jump straight to the right-hand strip
        continue;
      }
      sampled++;
      if (data[(y * width + x) * channels + alphaOffset] < alphaThreshold) transparent++;
    }
  }
  return sampled > 0 && transparent / sampled >= minTransparentShare;
}
