"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, Share2, X } from "lucide-react";
import { getPartDetails, type Part, type PartDetails } from "@/lib/api";
import { isSafeHref } from "@/lib/safe-url";
import { storeName } from "@/lib/seo";
import { monoFont, sansFont } from "@/lib/tokens";

type Tab = "overview" | "highlights" | "specs";

// Spec keys shown as chips under the name, in this order, when present.
const CHIP_KEYS = ["brand", "model", "vram", "socket", "chipset", "ddr_type", "speed", "capacity",
  "wattage", "rating", "form_factor", "type", "aio_size", "screen_size", "resolution", "refresh_rate", "panel"] as const;

/** Name size by length: short names stay large, long ones step down, never tiny. */
export function nameFontPx(name: string, max = 32, min = 20): number {
  const n = name.trim().length, lo = 28, hi = 85;
  if (n <= lo) return max;
  if (n >= hi) return min;
  return Math.round(max - ((max - min) * (n - lo)) / (hi - lo));
}

/** WordPress thumbnails carry a size suffix ("-247x247.jpg"); the original is the same path without it. */
export function fullImageUrl(url: string): string {
  return url.includes("/wp-content/uploads/") ? url.replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+(?:\?|$))/i, "") : url;
}

function formatPrice(p: number | null): string {
  return p === null ? "Out of stock" : "Rs " + p.toLocaleString("en-PK");
}

function Chip({ label }: { label: string }) {
  return (
    <span className="pdm-chip" style={{ fontFamily: monoFont }}>
      <span style={{ display: "inline-block", transform: "skewX(10deg)" }}>{label}</span>
    </span>
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="pdm-hl">
      {items.map((h, i) => (
        <li key={i}>
          <span aria-hidden="true" style={{ fontFamily: monoFont }}>+</span>
          <span>{h}</span>
        </li>
      ))}
    </ul>
  );
}

function SpecTable({ rows }: { rows: PartDetails["specs"] }) {
  return (
    <dl className="pdm-specs">
      {rows.map(([group, label, value], i) => (
        <div key={i} className="pdm-spec-row">
          <dt style={{ fontFamily: monoFont }}>{group ? `${group} · ${label}` : label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function PartDetailModal({ part, onClose }: { part: Part; onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [details, setDetails] = useState<PartDetails | null>(null);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<Tab | null>(null);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState(part.thumbnail_url ? fullImageUrl(part.thumbnail_url) : null);

  const href = isSafeHref(part.url) ? part.url : undefined;
  const store = storeName(part.source);
  const chips = CHIP_KEYS.map(k => part.specs?.[k]).filter((v): v is string => !!v).slice(0, 4);

  useEffect(() => {
    const ctrl = new AbortController();
    getPartDetails(part.id, ctrl.signal).then(d => {
      if (ctrl.signal.aborted) return;
      if (d) setDetails(d); else setFailed(true);
    });
    return () => ctrl.abort();
  }, [part.id]);

  // Esc closes; focus moves in and back out.
  //
  // Desktop: a fixed overlay, the page behind locked, only the tab panel scrolls.
  // Phone: the sheet becomes the page itself. The rest of the page is hidden
  // and the document scrolls, because mobile Chrome only hides its toolbars on
  // a document scroll, never on an inner scroll box or a fixed overlay. The
  // list's scroll position is restored on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const pageMode = window.matchMedia("(max-width: 760px)").matches;
    const scrollY = window.scrollY;
    const overflow = document.body.style.overflow;
    if (pageMode) {
      root.classList.add("pdm-page-mode");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      document.body.style.overflow = "hidden";
    }
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (pageMode) {
        root.classList.remove("pdm-page-mode");
        // Instant: the site sets scroll-behavior: smooth, which would animate this jump.
        window.scrollTo({ top: scrollY, behavior: "instant" });
      } else {
        document.body.style.overflow = overflow;
      }
      prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  const counts = {
    overview: details?.overview ? 1 : 0,
    highlights: details?.highlights.length ?? 0,
    specs: details?.specs.length ?? 0,
  };
  const tabs: [Tab, string][] = ([
    ["overview", "Overview"],
    ["highlights", `Highlights · ${counts.highlights}`],
    ["specs", `Full specs · ${counts.specs}`],
  ] as [Tab, string][]).filter(([k]) => counts[k] > 0);
  const active: Tab | null = tab && counts[tab] > 0 ? tab : tabs[0]?.[0] ?? null;

  async function handleShare() {
    if (!href) return;
    try {
      if (navigator.share) await navigator.share({ title: part.name, url: href });
      else {
        await navigator.clipboard.writeText(href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* dismissed share sheet */ }
  }

  const words = part.name.trim().split(" ");
  const last = words.pop();

  return createPortal(
    <div className="pdm-backdrop" onClick={onClose}>
      <div
        className="pdm"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
      >
        {/* Head: picture flush to the tabs, name + compact buy on the right */}
        <div className="pdm-head">
          <div className="pdm-pic">
            {imgSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgSrc}
                alt={part.name}
                referrerPolicy="no-referrer"
                decoding="async"
                onError={() => { if (part.thumbnail_url && imgSrc !== part.thumbnail_url) setImgSrc(part.thumbnail_url); else setImgSrc(null); }}
              />
            ) : (
              <span style={{ fontFamily: monoFont, fontSize: 11, color: "var(--text-dim)" }}>NO IMAGE</span>
            )}
            <span className="pdm-pic-tag" style={{ fontFamily: monoFont }}>{part.source}</span>
          </div>

          <div className="pdm-info">
            <div className="pdm-info-top">
              <span style={{ fontFamily: monoFont, fontSize: 12, color: "var(--text-2)" }}>
                {part.source} {"//"} {part.category.toUpperCase()}
                {part.condition ? ` · ${part.condition.toUpperCase()}` : ""}
              </span>
              <button ref={closeRef} className="pdm-close" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <h2 id={titleId} className="pdm-name" style={{ fontFamily: sansFont, fontSize: nameFontPx(part.name) }}>
              {words.join(" ")}{words.length ? " " : ""}<span style={{ fontStyle: "italic" }}>{last}</span>
            </h2>
            {chips.length > 0 && <div className="pdm-chips">{chips.map(c => <Chip key={c} label={c} />)}</div>}

            <div className="pdm-buy">
              <div className="pdm-buy-bar" style={{ fontFamily: monoFont }}>◼ PRICE · {store.toUpperCase()}</div>
              <div className="pdm-buy-body">
                <div className="pdm-price" style={{ fontFamily: monoFont, color: part.price_pkr === null ? "var(--text-dim)" : "var(--purple-text)" }}>
                  {formatPrice(part.price_pkr)}
                </div>
                <div className="pdm-buy-row">
                  <a
                    href={href}
                    target={href ? "_blank" : undefined}
                    rel={href ? "noopener noreferrer" : undefined}
                    className="pdm-buy-btn"
                    style={{ fontFamily: sansFont }}
                  >
                    <span style={{ display: "inline-block", transform: "skewX(6deg)" }}>Buy at {store} ↗</span>
                  </a>
                  <button
                    className="pdm-icon-btn"
                    onClick={() => setLiked(l => !l)}
                    aria-label="Like"
                    aria-pressed={liked}
                    style={{ background: liked ? "var(--danger-pale)" : "var(--paper)" }}
                  >
                    <Heart size={16} color={liked ? "#dc2626" : "var(--text)"} fill={liked ? "#dc2626" : "none"} />
                  </button>
                  <button
                    className="pdm-icon-btn"
                    onClick={handleShare}
                    aria-label={copied ? "Link copied" : "Share"}
                    style={{ background: copied ? "#16a34a" : "var(--paper)" }}
                  >
                    <Share2 size={16} color={copied ? "white" : "var(--text)"} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="pdm-tabs" role="tablist">
            {tabs.map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={active === k}
                className="pdm-tab"
                onClick={() => setTab(k)}
                style={{ fontFamily: monoFont }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="pdm-panel" role={active ? "tabpanel" : undefined}>
          {!details && !failed && (
            <p className="pdm-note" style={{ fontFamily: monoFont }}>Loading details…</p>
          )}
          {(failed || (details && tabs.length === 0)) && (
            <p className="pdm-note" style={{ fontFamily: monoFont }}>
              {failed ? "Couldn't load details right now." : "No details from this retailer."}
              {href && <> See the full listing on <a href={href} target="_blank" rel="noopener noreferrer">{store} ↗</a></>}
            </p>
          )}
          {details && active === "overview" && (
            <div className="pdm-overview">
              <div>
                <div className="pdm-kicker" style={{ fontFamily: monoFont }}>— From the retailer</div>
                <h3 style={{ fontFamily: sansFont }}>
                  What it <span style={{ color: "var(--purple-text)", fontStyle: "italic" }}>is.</span>
                </h3>
                <p>{details.overview}</p>
              </div>
              {counts.highlights > 0 && (
                <div className="pdm-glance">
                  <div className="pdm-glance-bar" style={{ fontFamily: monoFont }}>◼ AT A GLANCE</div>
                  <div style={{ padding: "4px 14px" }}><Highlights items={details.highlights.slice(0, 4)} /></div>
                  {counts.highlights > 4 && (
                    <button className="pdm-glance-more" onClick={() => setTab("highlights")} style={{ fontFamily: monoFont }}>
                      All {counts.highlights} highlights →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {details && active === "highlights" && <div style={{ maxWidth: 720 }}><Highlights items={details.highlights} /></div>}
          {details && active === "specs" && (
            <>
              <SpecTable rows={details.specs} />
              <p className="pdm-note" style={{ fontFamily: monoFont, marginTop: 14 }}>Specs as listed by {store}.</p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
