"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import {
  BRAND_LABEL,
  CATEGORY_LABEL,
  MODELS,
  MODEL_SERIES,
  modelPath,
  type ModelBrand,
  type ModelCategory,
  type ModelEntry,
} from "@/lib/models";
import type { MenuThumb, ModelMenuData } from "@/lib/model-menu-data";
import { BrandLogo, CategoryIcon } from "@/components/ModelMenuArt";
import { formatPkr } from "@/lib/seo";
import { monoFont } from "@/lib/tokens";

interface Props {
  /** Null when the catalogue fetch failed — every level and link still renders. */
  data: ModelMenuData | null;
  /** `${category}/${slug}` of the model page currently shown, outlined in pale pink. */
  activeSlug?: string;
  /** Level to open on: up to [category, brand, seriesKey]. */
  initialPath?: string[];
}

const CATEGORIES: ModelCategory[] = ["gpu", "cpu"];

function brandsOf(category: ModelCategory): ModelBrand[] {
  return [...new Set(MODEL_SERIES.filter(s => s.category === category).map(s => s.brand))];
}

function modelCount(filter: (m: ModelEntry) => boolean): number {
  return MODELS.filter(filter).length;
}

function sameKeys(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((k, i) => k === b[i]);
}

/** Crumb text for each depth of a path. */
function crumbLabel(path: string[], depth: number): string {
  const key = path[depth];
  if (depth === 0) return CATEGORY_LABEL[key as ModelCategory] ?? key;
  if (depth === 1) return BRAND_LABEL[key as ModelBrand] ?? key;
  return MODEL_SERIES.find(s => s.key === key)?.label ?? key;
}

const boxStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "6px",
  padding: "10px",
  border: "2px solid var(--ink)",
  boxShadow: "4px 4px 0 var(--shadow)",
  background: "var(--purple)",
  textDecoration: "none",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
  minWidth: 0,
};

const boxLabelStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: "14px",
  fontWeight: 900,
  letterSpacing: "0.04em",
  color: "white",
};

const boxSubStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: "10px",
  fontWeight: 800,
  letterSpacing: "1px",
  textTransform: "uppercase",
};

const boxPriceStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: "9px",
  fontWeight: 700,
  color: "var(--purple-pale)",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const trailTextStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: "10px",
  fontWeight: 800,
  letterSpacing: "1px",
  textTransform: "uppercase",
};

/**
 * The darker maroon well every box has, backing its icon, logo or transparent
 * thumbnail. A photo shot on white gets a white well instead, so it reads as a
 * whole product card rather than a white square floating on maroon.
 */
function Well({ children, photo = false }: { children: ReactNode; photo?: boolean }) {
  return (
    <span
      className="pulldown-box-well"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1.5px solid var(--ink)",
        background: photo ? "white" : "var(--purple-hover)",
        overflow: "hidden",
      }}
    >
      {children}
    </span>
  );
}

function ThumbWell({ thumb, alt }: { thumb: MenuThumb | null | undefined; alt: string }) {
  // Some retailers refuse image requests they don't like; a broken-image icon
  // would look worse than the empty well.
  const [failed, setFailed] = useState(false);
  if (!thumb || failed) {
    return (
      <Well>
        <span style={{ fontFamily: monoFont, fontSize: "9px", color: "var(--purple-pale)", letterSpacing: "1px" }}>
          {"// NO IMAGE"}
        </span>
      </Well>
    );
  }
  return (
    <Well photo={!thumb.clean}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb.src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ maxHeight: "88%", maxWidth: "100%", objectFit: "contain" }}
      />
    </Well>
  );
}

function NavBox({ label, sub, art, onClick }: { label: string; sub: string; art: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="budget-box pulldown-box" onClick={onClick} style={boxStyle}>
      <span className="pulldown-box-title" style={boxLabelStyle}>{label} ›</span>
      {art}
      <span className="pulldown-box-sub" style={boxSubStyle}>{sub}</span>
    </button>
  );
}

/**
 * Drill-down menu: GPU/CPU › brand › series › model. Every level is in the
 * HTML from the first render and only the current one is shown (`hidden`),
 * so crawlers see all 70 model links while the pulldown is closed.
 */
export default function ModelMenu({ data, activeSlug, initialPath = [] }: Props) {
  const [path, setPath] = useState<string[]>(initialPath);
  const rootRef = useRef<HTMLDivElement>(null);
  // Set by a click, so focus follows the drill-down but the first render
  // doesn't grab it.
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    rootRef.current?.querySelector<HTMLElement>(".model-box-grid:not([hidden]) .budget-box")?.focus();
  }, [path]);

  function go(next: string[]) {
    moved.current = true;
    setPath(next);
  }

  const crumbButton: CSSProperties = {
    ...trailTextStyle,
    background: "none",
    border: "none",
    padding: 0,
    color: "rgba(255,255,255,0.55)",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  };

  return (
    // Bleeds over the drawer's 18px padding so the header bar and the
    // halftone reach its edges.
    <div ref={rootRef} style={{ margin: "-18px" }}>
      {/* Header bar, as on every panel: title and trail on the left (each
          crumb goes back to its level), Back on the right. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 18px",
          minHeight: "46px",
          background: "var(--bar)",
          borderBottom: "2px solid var(--ink)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px", minWidth: 0 }}>
          <span className="model-menu-title" style={{ ...trailTextStyle, fontSize: "11px", letterSpacing: "2px", color: "white" }}>
            {"// SHOP BY MODEL"}
          </span>
          <nav aria-label="Model menu level" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
            {path.length === 0 ? (
              <span style={{ ...trailTextStyle, color: "white" }}>ALL</span>
            ) : (
              <button type="button" onClick={() => go([])} style={crumbButton}>ALL</button>
            )}
            {path.map((_, depth) => (
              <span key={depth} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span aria-hidden style={{ ...trailTextStyle, color: "rgba(255,255,255,0.35)" }}>›</span>
                {depth === path.length - 1 ? (
                  <span style={{ ...trailTextStyle, color: "white" }}>{crumbLabel(path, depth)}</span>
                ) : (
                  <button type="button" onClick={() => go(path.slice(0, depth + 1))} style={crumbButton}>
                    {crumbLabel(path, depth)}
                  </button>
                )}
              </span>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
          {/* Skewed maroon slashes, the same lean as the site's chips. */}
          <span aria-hidden className="model-menu-slashes" style={{ display: "flex", gap: "4px" }}>
            {[0.35, 0.6, 1].map(o => (
              <span key={o} style={{ width: "7px", height: "16px", background: "var(--purple-accent)", opacity: o, transform: "skewX(-20deg)" }} />
            ))}
          </span>
          {path.length > 0 && (
            <button
              type="button"
              onClick={() => go(path.slice(0, -1))}
              style={{
                padding: "4px 10px",
                border: "2px solid var(--ink)",
                boxShadow: "2px 2px 0 var(--purple)",
                background: "var(--paper)",
                color: "var(--text)",
                fontFamily: monoFont,
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "1px",
                textTransform: "uppercase",
                transform: "skewX(-8deg)",
                cursor: "pointer",
                flexShrink: 0,
                // Clear of the drawer's right border: the skew leans the top
                // corner out and the hard shadow adds 2px more.
                marginRight: "4px",
              }}
            >
              <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>‹ Back</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ position: "relative", padding: "18px" }}>
        {/* Black halftone, densest in the bottom-right corner and fading out
            toward the header: comic shading so the drawer isn't one flat block. */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.32) 1.2px, transparent 1.6px)",
            backgroundSize: "9px 9px",
            maskImage: "linear-gradient(to top left, black 0%, transparent 65%)",
            WebkitMaskImage: "linear-gradient(to top left, black 0%, transparent 65%)",
          }}
        />
        <div style={{ position: "relative" }}>
          {/* Root: GPU / CPU */}
          <div className="model-box-grid pulldown-grid" hidden={!sameKeys(path, [])}>
            {CATEGORIES.map(c => (
              <NavBox
                key={c}
                label={CATEGORY_LABEL[c]}
                sub={`${modelCount(m => m.category === c)} models`}
                art={<Well><CategoryIcon category={c} /></Well>}
                onClick={() => go([c])}
              />
            ))}
          </div>

          {/* Brands per category */}
          {CATEGORIES.map(c => (
            <div key={c} className="model-box-grid pulldown-grid" hidden={!sameKeys(path, [c])}>
              {brandsOf(c).map(b => (
                <NavBox
                  key={b}
                  label={BRAND_LABEL[b]}
                  sub={`${modelCount(m => m.category === c && m.brand === b)} models`}
                  art={<Well><BrandLogo brand={b} /></Well>}
                  onClick={() => go([c, b])}
                />
              ))}
            </div>
          ))}

          {/* Series per brand */}
          {CATEGORIES.flatMap(c =>
            brandsOf(c).map(b => (
              <div key={`${c}/${b}`} className="model-box-grid pulldown-grid" hidden={!sameKeys(path, [c, b])}>
                {MODEL_SERIES.filter(s => s.category === c && s.brand === b).map(s => (
                  <NavBox
                    key={s.key}
                    label={s.label}
                    sub={`${modelCount(m => m.series === s.key)} models`}
                    art={<ThumbWell thumb={data?.seriesThumbs[s.key]} alt={s.label} />}
                    onClick={() => go([c, b, s.key])}
                  />
                ))}
              </div>
            ))
          )}

          {/* Models per series: real links, so they are what crawlers follow. */}
          {MODEL_SERIES.map(s => (
            <div key={s.key} className="model-box-grid pulldown-grid" hidden={!sameKeys(path, [s.category, s.brand, s.key])}>
              {MODELS.filter(m => m.series === s.key).map(m => {
                const key = `${m.category}/${m.slug}`;
                const count = data?.counts[key];
                const active = key === activeSlug;
                return (
                  <Link
                    key={key}
                    href={modelPath(m)}
                    prefetch={false}
                    className="budget-box pulldown-box"
                    aria-current={active ? "page" : undefined}
                    title={`${m.label} price in Pakistan`}
                    style={{ ...boxStyle, border: active ? "2px solid var(--purple-pale)" : "2px solid var(--ink)" }}
                  >
                    <span className="pulldown-box-title" style={boxLabelStyle}>{m.label}</span>
                    <ThumbWell thumb={data?.thumbs[key]} alt={m.label} />
                    {count && (
                      <span className="pulldown-box-sub" style={boxSubStyle}>
                        {count.count} listing{count.count === 1 ? "" : "s"}
                      </span>
                    )}
                    {count?.min != null && <span className="pulldown-box-meta" style={boxPriceStyle}>from {formatPkr(count.min)}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
