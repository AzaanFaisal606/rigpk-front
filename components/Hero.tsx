import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type Stats } from "@/lib/api";
import { monoFont } from "@/lib/tokens";
import DiagLines from "./DiagLines";

interface HeroProps {
  stats: Stats | null;
}

export default function Hero({ stats }: HeroProps) {
  const totalParts = stats?.total_parts ?? null;
  const totalSources = stats ? Object.keys(stats.by_source).length : null;
  const categories = stats ? Object.keys(stats.by_category).length : null;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "var(--bg)",
        minHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderBottom: "2px solid #111112",
      }}
    >
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "100% 80px",
        }}
      />

      <DiagLines />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: "4px",
          background: "var(--purple)",
          borderRight: "1px solid #111112",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 w-full">
        {/* Top mono label */}
        <div className="fade-left flex items-center gap-3 mb-8">
          <div style={{ width: "8px", height: "2px", background: "var(--purple)" }} />
          <span className="mono" style={{ color: "var(--purple)" }}>
            RIGPK // PC PARTS IN PAKISTAN
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="fade-up"
          style={{
            animationDelay: "0.1s",
            fontFamily: monoFont,
            fontSize: "clamp(2.3rem, 7vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: "#111112",
            maxWidth: "720px",
          }}
        >
          Yahan <span style={{ color: "var(--purple)", fontStyle: "italic" }}>sab kuch</span>
          <br />
          milay ga.
        </h1>

        {/* Subtext */}
        <p
          className="fade-up mt-6 max-w-lg leading-relaxed"
          style={{ animationDelay: "0.2s", color: "#71717a", fontSize: "clamp(0.88rem, 3vw, 1.05rem)" }}
        >
          Real-time prices scraped from Pakistan&apos;s top PC retailers.
          Compare, build, and track — all in one place.
        </p>

        {/* CTA row */}
        <div
          className="fade-up mt-10 flex flex-wrap items-center gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <CTAButton href="/market" primary>
            Browse Market <ArrowRight size={14} />
          </CTAButton>
          <CTAButton href="/build" primary={false}>
            Build PC →
          </CTAButton>
        </div>

        {/* Stats row */}
        {totalParts !== null && (
          <div
            className="fade-up"
            style={{ animationDelay: "0.5s", marginTop: "56px", display: "flex", maxWidth: "480px", flexWrap: "wrap" }}
          >
            {[
              { value: totalParts.toLocaleString(), label: "Parts Tracked" },
              { value: String(totalSources), label: "Retailers" },
              { value: String(categories), label: "Categories" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  padding: "16px 20px",
                  border: "2px solid #111112",
                  borderLeft: i === 0 ? "2px solid #111112" : "none",
                  background: "var(--bg-card)",
                  boxShadow: "4px 4px 0 #111112",
                }}
              >
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 900,
                    color: "#111112",
                    lineHeight: 1,
                    fontFamily: monoFont,
                  }}
                >
                  {stat.value}
                </div>
                <div className="section-label" style={{ marginTop: "4px" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CTAButton({
  href,
  primary,
  children,
}: {
  href: string;
  primary: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`hero-cta ${primary ? "hero-cta--primary" : "hero-cta--secondary"}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 28px",
        fontFamily: monoFont,
        fontSize: "0.78rem",
        fontWeight: 800,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
