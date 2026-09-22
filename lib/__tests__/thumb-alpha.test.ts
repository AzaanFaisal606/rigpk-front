import { describe, expect, it } from "vitest";
import { isBorderTransparent } from "../thumb-alpha";

const W = 50;
const H = 40;

/** RGBA buffer where `inside(x, y)` pixels are opaque and the rest use `bgAlpha`. */
function rgba(inside: (x: number, y: number) => boolean, bgAlpha: number): Uint8Array {
  const buf = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      buf[i] = 200; buf[i + 1] = 100; buf[i + 2] = 50;
      buf[i + 3] = inside(x, y) ? 255 : bgAlpha;
    }
  }
  return buf;
}

const centred = (x: number, y: number) => x > 10 && x < 40 && y > 8 && y < 32;

describe("isBorderTransparent", () => {
  it("accepts a subject on a transparent background", () => {
    expect(isBorderTransparent(rgba(centred, 0), W, H, 4)).toBe(true);
  });

  it("rejects an opaque background box", () => {
    expect(isBorderTransparent(rgba(centred, 255), W, H, 4)).toBe(false);
  });

  it("treats near-transparent alpha as transparent", () => {
    expect(isBorderTransparent(rgba(centred, 10), W, H, 4)).toBe(true);
    expect(isBorderTransparent(rgba(centred, 40), W, H, 4)).toBe(false);
  });

  it("tolerates a subject touching a small part of the edge", () => {
    // Subject bleeds off the bottom edge across a fifth of the width.
    const touching = (x: number, y: number) => centred(x, y) || (y >= 30 && x >= 20 && x < 30);
    expect(isBorderTransparent(rgba(touching, 0), W, H, 4)).toBe(true);
  });

  it("rejects a subject spanning a whole side", () => {
    const fullBottom = (x: number, y: number) => centred(x, y) || y >= 30;
    expect(isBorderTransparent(rgba(fullBottom, 0), W, H, 4, { stripFraction: 0.25 })).toBe(false);
  });

  it("never passes images without an alpha channel", () => {
    expect(isBorderTransparent(new Uint8Array(W * H * 3), W, H, 3)).toBe(false);
  });

  it("rejects truncated buffers and empty sizes", () => {
    expect(isBorderTransparent(new Uint8Array(10), W, H, 4)).toBe(false);
    expect(isBorderTransparent(new Uint8Array(0), 0, 0, 4)).toBe(false);
  });

  it("supports grey+alpha buffers", () => {
    const buf = new Uint8Array(W * H * 2); // alpha 0 everywhere
    expect(isBorderTransparent(buf, W, H, 2)).toBe(true);
  });
});
