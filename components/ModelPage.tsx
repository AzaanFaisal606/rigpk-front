import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ModelListings from "@/components/ModelListings";
import ModelPulldown from "@/components/ModelPulldown";
import { monthYear } from "@/lib/budgets";
import { getCategoryCatalogue } from "@/lib/model-data";
import {
  CATEGORY_LABEL,
  modelBySlug,
  modelDescription,
  modelFaqs,
  modelHeading,
  modelIntro,
  modelPath,
  modelTitle,
  partsForModel,
  seriesOf,
  siblings,
  summarizeModel,
  type ModelCategory,
  type ModelEntry,
} from "@/lib/models";
import { SITE_URL } from "@/lib/seo";
import { monoFont } from "@/lib/tokens";

export async function modelMetadata(category: ModelCategory, slug: string): Promise<Metadata> {
  const e = modelBySlug(category, slug);
  if (!e) return {};
  const res = await getCategoryCatalogue(category);
  const summary = summarizeModel(res.ok ? partsForModel(res.items, e) : []);
  const title = modelTitle(e, summary, new Date());
  const description = modelDescription(e, summary);
  const url = modelPath(e);
  return {
    // Absolute: the brand suffix would push the price out of Google's
    // truncation window.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    // An out-of-stock page is thin; keep it out of the index until stock
    // returns, but let crawlers follow its sibling links.
    ...((!res.ok || summary.count === 0) && { robots: { index: false, follow: true } }),
  };
}

/**
 * A failed catalogue fetch must not be cached as this page's content. At
 * runtime, throwing makes ISR keep serving the last good render and retry on
 * the next request. During `next build` (no previous render to fall back on)
 * and in dev, render the failure state instead of breaking the build.
 */
function failOrRender(): boolean {
  const canKeepStale =
    process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD;
  if (canKeepStale) throw new Error("Model page: parts catalogue fetch failed");
  return true;
}

const labelStyle = {
  fontFamily: monoFont,
  fontSize: "10px",
  fontWeight: 800,
  color: "var(--faint)",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
};

function SiblingLinks({ current }: { current: ModelEntry }) {
  return (
    <nav
      aria-label={`Other ${seriesOf(current).label} models`}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", margin: "20px 0 28px" }}
    >
      <span style={{ ...labelStyle, fontSize: "9px", color: "var(--text-dim)", marginRight: "2px" }}>
        {seriesOf(current).label}
      </span>
      {siblings(current).map(m => (
        <Link
          key={m.slug}
          href={modelPath(m)}
          style={{
            padding: "7px 14px",
            border: "2px solid var(--ink)",
            boxShadow: "2px 2px 0 var(--shadow)",
            background: "var(--paper)",
            color: "var(--text)",
            fontFamily: monoFont,
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            textDecoration: "none",
            transform: "skewX(-8deg)",
            display: "inline-block",
          }}
        >
          <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>{m.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** One GPU or CPU model's prices across every store. Shared by /gpu/[model] and /cpu/[model]. */
export default async function ModelPage({ category, slug }: { category: ModelCategory; slug: string }) {
  const e = modelBySlug(category, slug);
  // proxy.ts and dynamicParams already keep unknown slugs out.
  if (!e) notFound();

  const res = await getCategoryCatalogue(category);
  const failed = !res.ok && failOrRender();
  const parts = res.ok ? partsForModel(res.items, e) : [];
  const summary = summarizeModel(parts);
  const now = new Date();
  const faqs = modelFaqs(e, summary, now);
  const path = modelPath(e);
  const categoryLabel = CATEGORY_LABEL[category];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "RigPK", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: categoryLabel, item: `${SITE_URL}/market/${category}` },
            { "@type": "ListItem", position: 3, name: e.label, item: `${SITE_URL}${path}` },
          ],
        }}
      />
      {summary.count > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: e.label,
            category: category === "gpu" ? "Graphics Card" : "Processor",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "PKR",
              lowPrice: summary.min,
              highPrice: summary.max,
              offerCount: summary.count,
            },
          }}
        />
      )}
      {faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(f => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }}
        />
      )}

      <Navbar />

      {/* Header strip: breadcrumb, with the model pulldown hanging off it. */}
      <div style={{ position: "relative", zIndex: 30, background: "var(--bg)", borderBottom: "2px solid var(--ink)" }}>
        <nav
          aria-label="Breadcrumb"
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            gap: "6px",
            fontFamily: monoFont,
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--faint)",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          <Link href="/" style={{ color: "var(--faint)", textDecoration: "none" }}>RIGPK</Link>
          <span>›</span>
          <Link href={`/market/${category}`} style={{ color: "var(--faint)", textDecoration: "none" }}>{categoryLabel}</Link>
          <span>›</span>
          <span style={{ color: "var(--text)" }}>{e.label}</span>
        </nav>
        <Suspense fallback={null}>
          <ModelPulldown activeSlug={`${category}/${e.slug}`} initialPath={[category, e.brand, e.series]} />
        </Suspense>
      </div>

      <main className="pb-browser-wrapper" style={{ width: "100%", maxWidth: "80rem", margin: "0 auto", padding: "40px 24px 32px" }}>
        <div style={{ ...labelStyle, marginBottom: "6px" }}>RIGPK {"//"} {category.toUpperCase()} PRICES</div>
        <h1 style={{ fontFamily: monoFont, fontWeight: 900, fontSize: "1.75rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text)", margin: 0 }}>
          {modelHeading(e)}
        </h1>
        <p style={{ ...labelStyle, color: "var(--purple-text)", marginTop: "8px" }}>
          Prices for {monthYear(now)}
        </p>

        {failed ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <p style={{ fontFamily: monoFont, fontSize: "13px", fontWeight: 900, color: "var(--purple-text)", letterSpacing: "1.5px" }}>
              {"// SEARCH FAILED"}
            </p>
            <p style={{ fontFamily: monoFont, fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.5px", marginTop: "8px" }}>
              Couldn&apos;t reach the server. Reload to try again.
            </p>
          </div>
        ) : (
          <>
            <p style={{ maxWidth: "52rem", marginTop: "18px", fontSize: "15px", lineHeight: 1.6, color: "var(--text-muted)" }}>
              {modelIntro(e, summary)}
            </p>

            <SiblingLinks current={e} />

            <ModelListings parts={parts} label={e.label} seriesLabel={seriesOf(e).label} />

            {faqs.length > 0 && (
              <section
                aria-labelledby="model-faq"
                style={{ marginTop: "48px", border: "2px solid var(--ink)", boxShadow: "10px 10px 0 var(--shadow)", background: "var(--paper)", overflow: "hidden" }}
              >
                <h2
                  id="model-faq"
                  style={{ margin: 0, background: "var(--bar)", color: "white", padding: "10px 16px", fontFamily: monoFont, fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}
                >
                  FAQ · {e.label} price
                </h2>
                <div style={{ padding: "8px 16px 16px" }}>
                  {faqs.map(f => (
                    <div key={f.q} style={{ padding: "14px 0", borderBottom: "1.5px dashed var(--border)" }}>
                      <h3 style={{ margin: 0, fontFamily: monoFont, fontSize: "12px", fontWeight: 800, color: "var(--text)", letterSpacing: "0.5px" }}>
                        {f.q}
                      </h3>
                      <p style={{ margin: "6px 0 0", fontSize: "14px", lineHeight: 1.6, color: "var(--text-muted)" }}>{f.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
