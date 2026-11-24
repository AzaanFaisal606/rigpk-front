"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Heart, Share2 } from "lucide-react";
import type { Part, PartDetails } from "@/lib/api";
import { fullImageUrl, modelForPart, partChips, partPath } from "@/lib/part-page";
import { isSafeHref } from "@/lib/safe-url";
import { SITE_URL, storeName } from "@/lib/seo";

type Tab = "overview" | "highlights" | "specs";

/** Name size by length: short names stay large, long ones step down, never tiny. */
export function nameFontPx(name: string, max = 32, min = 20): number {
  const n = name.trim().length, lo = 28, hi = 85;
  if (n <= lo) return max;
  if (n >= hi) return min;
  return Math.round(max - ((max - min) * (n - lo)) / (hi - lo));
}

function formatPrice(p: number | null): string {
  return p === null ? "Out of stock" : "Rs " + p.toLocaleString("en-PK");
}

function Chip({ label }: { label: string }) {
  return (
    <span className="pdm-chip">
      <span className="skew-label-10">{label}</span>
    </span>
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="pdm-hl">
      {items.map((h, i) => (
        <li key={i}>
          <span aria-hidden="true">+</span>
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
          <dt>{group ? `${group} · ${label}` : label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface Props {
  part: Part;
  /** null while the popup is still fetching. */
  details: PartDetails | null;
  failed?: boolean;
  /** "page": the server-rendered /part page (h1, freshness line, no close). */
  variant: "modal" | "page";
  titleId?: string;
  /** Page only: "Price checked" date, formatted on the server so hydration can't differ by ICU version. */
  checked?: string | null;
  /** Modal only: the close button, placed top right. */
  closeButton?: ReactNode;
  /** Modal only: called before a link inside the detail navigates away. */
  onLeave?: () => void;
}

/**
 * The part's detail content, shared by the market popup and the /part page.
 * Every non-empty panel stays in the HTML and the inactive ones are `hidden`,
 * so crawlers get the overview, highlights and specs whichever tab is open.
 */
export default function PartDetail({ part, details, failed, variant, titleId, checked, closeButton, onLeave }: Props) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState(part.thumbnail_url ? fullImageUrl(part.thumbnail_url) : null);

  const href = isSafeHref(part.url) ? part.url : undefined;
  const store = storeName(part.source);
  const chips = partChips(part);
  const model = modelForPart(part);

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

  // Our own page, not the retailer's: shared links land on RigPK.
  async function handleShare() {
    const url = SITE_URL + partPath(part);
    try {
      if (navigator.share) await navigator.share({ title: part.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* dismissed share sheet */ }
  }

  const words = part.name.trim().split(" ");
  const last = words.pop();
  const Heading = variant === "page" ? "h1" : "h2";
  const SubHeading = variant === "page" ? "h2" : "h3";

  return (
    <>
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
            <span className="pdm-pic-empty">NO IMAGE</span>
          )}
          <span className="pdm-pic-tag">{part.source}</span>
        </div>

        <div className="pdm-info">
          <div className="pdm-info-top">
            <span className="pdm-meta">
              {part.source} {"//"} {part.category.toUpperCase()}
              {part.condition ? ` · ${part.condition.toUpperCase()}` : ""}
            </span>
            {closeButton}
          </div>
          <Heading id={titleId} className="pdm-name" style={{ fontSize: nameFontPx(part.name) }}>
            {words.join(" ")}{words.length ? " " : ""}<span className="pdm-name-last">{last}</span>
          </Heading>
          {chips.length > 0 && <div className="pdm-chips">{chips.map(c => <Chip key={c} label={c} />)}</div>}
          {model && (
            <Link
              href={`/${model.category}/${model.slug}`}
              prefetch={false}
              onClick={e => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) onLeave?.(); }}
              className="pdm-model-link"
            >
              All {model.label} prices in Pakistan →
            </Link>
          )}

          <div className="pdm-buy">
            <div className="pdm-buy-bar">◼ PRICE · {store.toUpperCase()}</div>
            <div className="pdm-buy-body">
              <div className={part.price_pkr === null ? "pdm-price pdm-price--oos" : "pdm-price"}>
                {formatPrice(part.price_pkr)}
              </div>
              <div className="pdm-buy-row">
                <a
                  href={href}
                  target={href ? "_blank" : undefined}
                  rel={href ? "noopener noreferrer" : undefined}
                  className="pdm-buy-btn"
                >
                  <span className="skew-label-6">Buy at {store} ↗</span>
                </a>
                <button
                  className="pdm-icon-btn"
                  onClick={() => setLiked(l => !l)}
                  aria-label="Like"
                  aria-pressed={liked}
                >
                  <Heart size={16} color={liked ? "#dc2626" : "var(--text)"} fill={liked ? "#dc2626" : "none"} />
                </button>
                <button
                  className={copied ? "pdm-icon-btn pdm-icon-btn--copied" : "pdm-icon-btn"}
                  onClick={handleShare}
                  aria-label={copied ? "Link copied" : "Share"}
                >
                  <Share2 size={16} color={copied ? "white" : "var(--text)"} />
                </button>
              </div>
              {checked && (
                <div className="pdm-checked">Price checked {checked}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {tabs.length > 0 && (
        <div className="pdm-tabs" role="tablist">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              role="tab"
              aria-selected={active === k}
              className="pdm-tab"
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="pdm-panel">
        {!details && !failed && (
          <p className="pdm-note">Loading details…</p>
        )}
        {(failed || (details && tabs.length === 0)) && (
          <p className="pdm-note">
            {failed ? "Couldn't load details right now." : "No details from this retailer."}
            {href && <> See the full listing on <a href={href} target="_blank" rel="noopener noreferrer">{store} ↗</a></>}
          </p>
        )}
        {details && counts.overview > 0 && (
          <div role="tabpanel" hidden={active !== "overview"} className="pdm-overview">
            <div>
              <div className="pdm-kicker">— From the retailer</div>
              <SubHeading className="pdm-sub">
                What it <span className="pdm-sub-accent">is.</span>
              </SubHeading>
              <p>{details.overview}</p>
            </div>
            {counts.highlights > 0 && (
              <div className="pdm-glance">
                <div className="pdm-glance-bar">◼ AT A GLANCE</div>
                <div className="pdm-glance-list"><Highlights items={details.highlights.slice(0, 4)} /></div>
                {counts.highlights > 4 && (
                  <button className="pdm-glance-more" onClick={() => setTab("highlights")}>
                    All {counts.highlights} highlights →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {details && counts.highlights > 0 && (
          <div role="tabpanel" hidden={active !== "highlights"} className="pdm-hl-panel">
            <Highlights items={details.highlights} />
          </div>
        )}
        {details && counts.specs > 0 && (
          <div role="tabpanel" hidden={active !== "specs"}>
            <SpecTable rows={details.specs} />
            <p className="pdm-note pdm-note--specs">Specs as listed by {store}.</p>
          </div>
        )}
      </div>
    </>
  );
}
