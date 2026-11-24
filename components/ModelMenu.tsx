"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

/**
 * The darker maroon well every box has, backing its icon, logo or transparent
 * thumbnail. A photo shot on white gets a white well instead, so it reads as a
 * whole product card rather than a white square floating on maroon.
 */
function Well({ children, photo = false }: { children: ReactNode; photo?: boolean }) {
  return (
    <span className={photo ? "pulldown-box-well pulldown-box-well--photo" : "pulldown-box-well"}>
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
        <span className="pulldown-box-noimg">
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
        className="pulldown-box-img pulldown-box-img--fit"
      />
    </Well>
  );
}

function NavBox({ label, sub, art, onClick }: { label: string; sub: string; art: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="budget-box pulldown-box" onClick={onClick}>
      <span className="pulldown-box-title">{label} ›</span>
      {art}
      <span className="pulldown-box-sub">{sub}</span>
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

  return (
    // Bleeds over the drawer's 18px padding so the header bar and the
    // halftone reach its edges.
    <div ref={rootRef} className="model-menu">
      {/* Header bar, as on every panel: title and trail on the left (each
          crumb goes back to its level), Back on the right. */}
      <div className="model-menu-bar">
        <div className="model-menu-head">
          <span className="model-menu-trail model-menu-title">
            {"// SHOP BY MODEL"}
          </span>
          <nav aria-label="Model menu level" className="model-menu-crumbs">
            {path.length === 0 ? (
              <span className="model-menu-trail model-menu-here">ALL</span>
            ) : (
              <button type="button" onClick={() => go([])} className="model-menu-trail model-menu-crumb">ALL</button>
            )}
            {path.map((_, depth) => (
              <span key={depth} className="model-menu-step">
                <span aria-hidden className="model-menu-trail model-menu-sep">›</span>
                {depth === path.length - 1 ? (
                  <span className="model-menu-trail model-menu-here">{crumbLabel(path, depth)}</span>
                ) : (
                  <button type="button" onClick={() => go(path.slice(0, depth + 1))} className="model-menu-trail model-menu-crumb">
                    {crumbLabel(path, depth)}
                  </button>
                )}
              </span>
            ))}
          </nav>
        </div>
        <div className="model-menu-actions">
          {/* Skewed maroon slashes, the same lean as the site's chips. */}
          <span aria-hidden className="model-menu-slashes">
            {/* Opacity per slash (0.35, 0.6, 1) is set by position in globals.css. */}
            {[0.35, 0.6, 1].map(o => (
              <span key={o} />
            ))}
          </span>
          {path.length > 0 && (
            <button
              type="button"
              onClick={() => go(path.slice(0, -1))}
              className="model-menu-back"
            >
              <span className="skew-label">‹ Back</span>
            </button>
          )}
        </div>
      </div>

      <div className="model-menu-body">
        {/* Black halftone, densest in the bottom-right corner and fading out
            toward the header: comic shading so the drawer isn't one flat block. */}
        <span aria-hidden className="model-menu-dots" />
        <div className="model-menu-levels">
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
                  >
                    <span className="pulldown-box-title">{m.label}</span>
                    <ThumbWell thumb={data?.thumbs[key]} alt={m.label} />
                    {count && (
                      <span className="pulldown-box-sub">
                        {count.count} listing{count.count === 1 ? "" : "s"}
                      </span>
                    )}
                    {count?.min != null && <span className="pulldown-box-meta">from {formatPkr(count.min)}</span>}
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
