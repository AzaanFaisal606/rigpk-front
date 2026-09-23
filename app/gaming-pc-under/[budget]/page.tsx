import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrebuiltCard from "@/components/PrebuiltCard";
import JsonLd from "@/components/JsonLd";
import BudgetBoxes from "@/components/BudgetBoxes";
import PulldownTab from "@/components/ui/PulldownTab";
import {
  BUDGETS,
  budgetBySlug,
  budgetDescription,
  budgetFaqs,
  budgetHeading,
  budgetIntro,
  budgetTitle,
  monthYear,
  prebuiltsInBudget,
  summarizeBudget,
  type Budget,
} from "@/lib/budgets";
import { getBudgetBuckets, getBudgetCatalogue } from "@/lib/budget-data";
import { cleanPrebuiltName, SITE_URL } from "@/lib/seo";
import { monoFont } from "@/lib/tokens";

// Static per budget, refreshed hourly (ISR) — the backend sits on a cold-
// starting free tier, so these landing pages must not wait on it per request.
// Kept literal: Next reads segment config statically.
export const revalidate = 3600;
// Unknown budgets 404. proxy.ts does the same before rendering, which is what
// guarantees a real 404 status (the root loading.tsx would otherwise stream
// the not-found UI with a 200).
export const dynamicParams = false;

// Past this many PCs the page links to the filtered /prebuilts browser for
// the rest rather than paginating (pagination would make the page dynamic).
const MAX_LISTED = 60;

export function generateStaticParams() {
  return BUDGETS.map(b => ({ budget: b.slug }));
}

interface PageProps {
  params: Promise<{ budget: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const budget = budgetBySlug((await params).budget);
  if (!budget) return {};
  const res = await getBudgetCatalogue();
  const summary = summarizeBudget(res.ok ? prebuiltsInBudget(res.items, budget.max) : []);
  const title = budgetTitle(budget, new Date());
  const description = budgetDescription(budget, summary);
  const url = `/gaming-pc-under/${budget.slug}`;
  return {
    // Absolute: the keyword-heavy title is already long, and the brand suffix
    // would push the month out of Google's truncation window.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
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
  if (canKeepStale) throw new Error("Budget page: prebuilt catalogue fetch failed");
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

function SiblingLinks({ current }: { current: Budget }) {
  return (
    <nav aria-label="Other budgets" style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "20px 0 28px" }}>
      {BUDGETS.map(b => {
        const active = b.slug === current.slug;
        return (
          <Link
            key={b.slug}
            href={`/gaming-pc-under/${b.slug}`}
            aria-current={active ? "page" : undefined}
            style={{
              padding: "7px 14px",
              border: "2px solid var(--ink)",
              boxShadow: active ? "var(--gloss), 2px 2px 0 var(--shadow)" : "2px 2px 0 var(--shadow)",
              background: active ? "var(--purple)" : "var(--paper)",
              color: active ? "white" : "var(--text)",
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
            <span style={{ display: "inline-block", transform: "skewX(8deg)" }}>
              Under {b.short} · {b.lakh}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default async function BudgetPage({ params }: PageProps) {
  const budget = budgetBySlug((await params).budget);
  // proxy.ts and dynamicParams already keep unknown slugs out.
  if (!budget) notFound();

  const [res, buckets] = await Promise.all([getBudgetCatalogue(), getBudgetBuckets()]);
  const failed = !res.ok && failOrRender();
  const all = res.ok ? prebuiltsInBudget(res.items, budget.max) : [];
  const listed = all.slice(0, MAX_LISTED);
  const summary = summarizeBudget(all);
  const faqs = budgetFaqs(budget, all, summary);
  const path = `/gaming-pc-under/${budget.slug}`;
  const heading = budgetHeading(budget);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "RigPK", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Pre-Built PCs", item: `${SITE_URL}/prebuilts` },
            { "@type": "ListItem", position: 3, name: `Gaming PC under ${budget.short}`, item: `${SITE_URL}${path}` },
          ],
        }}
      />
      {listed.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: heading,
            numberOfItems: listed.length,
            itemListElement: listed.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}/prebuilts/${p.id}`,
              name: cleanPrebuiltName(p.name),
            })),
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

      {/* Header strip: breadcrumb, with the budget pulldown hanging off it. */}
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
          <Link href="/prebuilts" style={{ color: "var(--faint)", textDecoration: "none" }}>PRE-BUILTS</Link>
          <span>›</span>
          <span style={{ color: "var(--text)" }}>UNDER {budget.short}</span>
        </nav>
        <PulldownTab label="PCs by budget" title="Gaming PCs by budget">
          <BudgetBoxes buckets={buckets} activeSlug={budget.slug} />
        </PulldownTab>
      </div>

      <main className="pb-browser-wrapper" style={{ maxWidth: "80rem", margin: "0 auto", padding: "40px 24px 32px" }}>
        <div style={{ ...labelStyle, marginBottom: "6px" }}>RIGPK {"//"} BUDGET GAMING PCS</div>
        <h1 style={{ fontFamily: monoFont, fontWeight: 900, fontSize: "1.75rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text)", margin: 0 }}>
          {heading}
        </h1>
        <p style={{ ...labelStyle, color: "var(--purple-text)", marginTop: "8px" }}>
          {budget.lakh} · Prices for {monthYear(new Date())}
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
              {budgetIntro(budget, summary)}
            </p>

            <SiblingLinks current={budget} />

            {listed.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center", fontFamily: monoFont, fontSize: "13px", color: "var(--faint)", letterSpacing: "1.5px" }}>
                {"// NO PREBUILTS FOUND"}
              </div>
            ) : (
              <div className="pb-browser-grid">
                {listed.map(p => <PrebuiltCard key={p.id} prebuilt={p} />)}
              </div>
            )}

            {all.length > listed.length && (
              <p style={{ marginTop: "24px", fontFamily: monoFont, fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
                <Link href={`/prebuilts?max_price=${budget.max}`} style={{ color: "var(--purple-text)" }}>
                  See all {all.length} PCs under {budget.short} →
                </Link>
              </p>
            )}

            {faqs.length > 0 && (
              <section
                aria-labelledby="budget-faq"
                style={{ marginTop: "48px", border: "2px solid var(--ink)", boxShadow: "10px 10px 0 var(--shadow)", background: "var(--paper)", overflow: "hidden" }}
              >
                <h2
                  id="budget-faq"
                  style={{ margin: 0, background: "var(--bar)", color: "white", padding: "10px 16px", fontFamily: monoFont, fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}
                >
                  FAQ · Gaming PC under {budget.lakh}
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
