import Link from "next/link";
import { type Stats } from "@/lib/api";
import DiagLines from "../DiagLines";
import HeroMeme from "./HeroMeme";

const SUB =
  "Real-time prices scraped from Pakistan's top PC retailers. Compare, build, and track, all in one place.";

/**
 * The headline sits on three copies of itself: two "aura" copies in the
 * panel colour, a fat blurred stroke and a tighter crisp one, knock the
 * moving lines out around the type. They are static, so the blur is
 * rasterised once and never repainted while the lines run underneath.
 *
 * The line breaks differ by layout: three lines on the wide panel, four on
 * the phone. `.hl-br-*` toggle which breaks count.
 */
function HeadlineText() {
  return (
    <>
      wallet<br />
      <span className="hl-accent">pyaaz</span>
      <br className="hl-br-narrow" />
      <span className="hl-sp-wide"> </span>kaat<br className="hl-br-wide" />
      <span className="hl-sp-narrow"> </span>raha<br className="hl-br-narrow" />
      <span className="hl-sp-wide"> </span>hai<span className="hl-accent">.</span>
    </>
  );
}

function Headline() {
  return (
    <div className="hero-headline fade-up" style={{ animationDelay: "0.05s" }}>
      <div className="hero-hl hero-hl--aura hero-hl--aura-blur" aria-hidden><HeadlineText /></div>
      <div className="hero-hl hero-hl--aura" aria-hidden><HeadlineText /></div>
      <h1 className="hero-hl">
        <HeadlineText />
      </h1>
    </div>
  );
}

function HeroStats({ stats }: { stats: Stats }) {
  const items = [
    { value: stats.total_parts.toLocaleString(), label: "Parts tracked" },
    { value: String(Object.keys(stats.by_source).length), label: "Retailers" },
    { value: String(Object.keys(stats.by_category).length), label: "Categories" },
  ];
  return (
    <dl className="hero-stats fade-up" style={{ animationDelay: "0.35s" }}>
      {items.map(s => (
        <div key={s.label} className="hero-stat">
          <dt className="hero-stat-label">{s.label}</dt>
          <dd className="hero-stat-value">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function HomeHero({ stats }: { stats: Stats | null }) {
  return (
    <section className="home-hero">
      <div className="hero-panel">
        <DiagLines />
        <Headline />

        <div className="hero-meme-slot fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="hero-meme-card">
            <HeroMeme />
          </div>
        </div>

        <div className="hero-pitch fade-up" style={{ animationDelay: "0.25s" }}>
          <p className="hero-pitch-text">{SUB}</p>
          <div className="hero-pitch-ctas">
            <Link href="/market" className="hero-cta hero-cta--primary">
              <span>Browse Market →</span>
            </Link>
            <Link href="/build" className="hero-cta hero-cta--secondary">
              <span>Build PC →</span>
            </Link>
          </div>
        </div>

        <div className="hero-fold" aria-hidden />
      </div>

      {stats && <HeroStats stats={stats} />}
    </section>
  );
}
