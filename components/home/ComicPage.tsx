import Link from "next/link";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { BUDGETS } from "@/lib/budgets";
import { MODELS, modelPath } from "@/lib/models";
import { formatPkr } from "@/lib/seo";
import type { TrendGroup } from "@/lib/trends-api";
import BuildSketch from "./BuildSketch";

/**
 * The homepage's "comic page": four panels cut apart by slanted gutters.
 *
 * Every panel is three stacked layers with the same polygon: a hard shadow
 * (offset), an ink layer, and the body inset by the border width, so the
 * ink shows as the outline. The polygons live in globals.css (`.cp--*`),
 * one set per layout, because the slants are built from `calc()` lengths
 * that an SVG outline can't follow. All of it is static: nothing here moves.
 */

function Panel({
  kind,
  tone,
  children,
}: {
  kind: "market" | "build" | "trends" | "pre";
  tone: "paper" | "maroon" | "plain";
  children: React.ReactNode;
}) {
  return (
    <div className={`cp cp--${kind}`}>
      <div className="cp-shadow" aria-hidden />
      <div className="cp-ink" aria-hidden />
      <div className={`cp-body cp-body--${tone}`}>{children}</div>
    </div>
  );
}

function PanelLabel({ label, caption, dark }: { label: string; caption: string; dark?: boolean }) {
  return (
    <div className="cp-label">
      <h3 className={`cp-label-tag${dark ? " cp-label-tag--dark" : ""}`}>
        <span>{label}</span>
      </h3>
      <p className="cp-label-caption">
        <span>{caption}</span>
      </p>
    </div>
  );
}

function modelHref(groupKey: string): string {
  const m = MODELS.find(e => e.category === "gpu" && e.models.includes(groupKey));
  return m ? modelPath(m) : `/market/gpu?q=${encodeURIComponent(groupKey)}`;
}

function MarketRows({ groups }: { groups: TrendGroup[] }) {
  return (
    <ul className="cp-market-list">
      {groups.map(g => (
        <li key={g.group_key}>
          <Link href={modelHref(g.group_key)} className="cp-market-row">
            <span className="cp-market-name">{g.group_key}</span>
            <span className="cp-market-count">{g.sample_count} listings</span>
            <span className="cp-market-price">
              <span className="cp-market-from">from</span> {formatPkr(g.low_price ?? g.min_price)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const FALLBACK_CATEGORIES = [
  { href: "/market/gpu", label: "Graphics cards" },
  { href: "/market/cpu", label: "Processors" },
  { href: "/market/ram", label: "Memory" },
  { href: "/market/ssd", label: "Storage" },
];

function MarketFallback() {
  return (
    <ul className="cp-market-list">
      {FALLBACK_CATEGORIES.map(c => (
        <li key={c.href}>
          <Link href={c.href} className="cp-market-row">
            <span className="cp-market-name">{c.label}</span>
            <span className="cp-market-price">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A static sparkline of one trend group: server-rendered, scales to its box. */
function TrendMini({ group }: { group: TrendGroup }) {
  const pts = group.series;
  const vals = pts.map(p => p.center_price);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.25, hi * 0.01, 1);
  const t = pts.map(p => Date.parse(p.scrape_date));
  const tSpan = t[t.length - 1] - t[0] || 1;
  const x = (i: number) => (pts.length === 1 ? 50 : ((t[i] - t[0]) / tSpan) * 100);
  const y = (v: number) => 36 - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * 36;
  const line = pts.map((p, i) => `${x(i).toFixed(2)},${y(p.center_price).toFixed(2)}`).join(" ");
  const first = vals[0];
  const last = vals[vals.length - 1];
  const change = first ? ((last - first) / first) * 100 : 0;
  const up = change > 0.05;
  const down = change < -0.05;
  const since = new Date(pts[0].scrape_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <Link href="/trends" className="cp-trend">
      <span className="cp-trend-head">
        <span className="cp-trend-name">{group.group_key}</span>
        <span className={`cp-trend-change${up ? " is-up" : down ? " is-down" : ""}`}>
          {up ? <TrendingUp size={13} aria-hidden /> : down ? <TrendingDown size={13} aria-hidden /> : <Minus size={13} aria-hidden />}
          {up ? "up" : down ? "down" : "flat"} {Math.abs(change).toFixed(1)}% since {since}
        </span>
      </span>
      <svg className="cp-trend-chart" viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden>
        <polyline points={line} fill="none" stroke="var(--purple-text)" strokeWidth="2.5" strokeLinejoin="bevel" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="cp-trend-foot">
        <span>typical price now</span>
        <span className="cp-trend-price">{formatPkr(group.median_price ?? group.latest_price)}</span>
      </span>
    </Link>
  );
}

export default function ComicPage({ gpuGroups }: { gpuGroups: TrendGroup[] | null }) {
  const byListings = gpuGroups
    ? [...gpuGroups].filter(g => g.series.length > 0).sort((a, b) => b.sample_count - a.sample_count)
    : [];
  const marketRows = byListings.slice(0, 4);
  const trendGroup = byListings[0] ?? null;

  return (
    <section className="home-comic" aria-label="What RigPK does">
      <div className="comic">
        <Panel kind="market" tone="paper">
          <div className="cp-content cp-content--market">
            <div className="cp-market-copy">
              <PanelLabel label="Market" caption="live prices from every PK shop. no more calling 14 uncles." />
              <Link href="/market" className="cp-arrow-link">Browse market →</Link>
            </div>
            <div className="cp-market-card">
              <p className="cp-card-head">Most listed GPUs right now</p>
              {marketRows.length > 0 ? <MarketRows groups={marketRows} /> : <MarketFallback />}
            </div>
          </div>
        </Panel>

        <Panel kind="build" tone="maroon">
          <div className="cp-build-lines" aria-hidden />
          <div className="cp-content cp-content--build">
            <PanelLabel dark label="Build a PC" caption="pick parts. check compatibility. cry at the total." />
            <BuildSketch />
            <Link href="/build" className="hero-cta hero-cta--invert cp-build-cta">
              <span>Build now →</span>
            </Link>
          </div>
        </Panel>

        <Panel kind="trends" tone="paper">
          <div className="cp-content cp-content--trends">
            <PanelLabel label="Trends" caption="watch prices go up. and up. and up." />
            {trendGroup ? (
              <TrendMini group={trendGroup} />
            ) : (
              <Link href="/trends" className="cp-arrow-link">See price trends →</Link>
            )}
          </div>
        </Panel>

        <Panel kind="pre" tone="plain">
          <div className="cp-content cp-content--pre">
            <PanelLabel label="Pre-builts" caption="already built. just add rupees." />
            <nav className="cp-budgets" aria-label="Gaming PCs by budget">
              {BUDGETS.map(b => (
                <Link key={b.slug} href={`/gaming-pc-under/${b.slug}`} className="cp-budget">
                  <span className="cp-budget-under">Under</span>
                  <span className="cp-budget-amount">{b.short}</span>
                </Link>
              ))}
            </nav>
            <Link href="/prebuilts" className="cp-arrow-link">All pre-builts →</Link>
          </div>
        </Panel>
      </div>
    </section>
  );
}
