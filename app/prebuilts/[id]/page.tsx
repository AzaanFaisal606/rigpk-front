import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrebuiltSpecPage from "@/components/PrebuiltSpecPage";
import JsonLd from "@/components/JsonLd";
import { getPrebuilt } from "@/lib/prebuilts-api";
import { monoFont } from "@/lib/tokens";
import { cleanPrebuiltName, prebuiltDescription, SITE_URL, storeName } from "@/lib/seo";
import { isSafeHref } from "@/lib/safe-url";

interface PageProps {
  params: Promise<{ id: string }>;
}

// `/prebuilts/abc` would otherwise stringify Number(id) as NaN into the API
// URL and rely on the backend 404ing it (M27).
function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const n = parseId(id);
  const prebuilt = n === null ? null : await getPrebuilt(n);
  if (!prebuilt) return { title: "Pre-Built PC" };
  const title = `${cleanPrebuiltName(prebuilt.name)} Price in Pakistan`;
  const description = prebuiltDescription(prebuilt);
  const url = `/prebuilts/${prebuilt.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      ...(prebuilt.thumbnail_url && { images: [{ url: prebuilt.thumbnail_url }] }),
    },
  };
}

export default async function PrebuiltDetailPage({ params }: PageProps) {
  const { id } = await params;
  const n = parseId(id);
  const prebuilt = n === null ? null : await getPrebuilt(n);
  if (!prebuilt) notFound();

  const name = cleanPrebuiltName(prebuilt.name);
  const pageUrl = `${SITE_URL}/prebuilts/${prebuilt.id}`;
  const store = storeName(prebuilt.source);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: prebuiltDescription(prebuilt),
          url: pageUrl,
          category: "Pre-built gaming PC",
          ...(prebuilt.thumbnail_url && { image: prebuilt.thumbnail_url }),
          ...(prebuilt.price_pkr != null && {
            offers: {
              "@type": "Offer",
              priceCurrency: "PKR",
              price: prebuilt.price_pkr,
              url: isSafeHref(prebuilt.url) ? prebuilt.url : pageUrl,
              availability: "https://schema.org/InStock",
              seller: { "@type": "Organization", name: store },
            },
          }),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "RigPK", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Pre-Built PCs", item: `${SITE_URL}/prebuilts` },
            { "@type": "ListItem", position: 3, name, item: pageUrl },
          ],
        }}
      />
      <Navbar />
      <div className="pb-spec-page-breadcrumb" style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 48px 0", overflow: "hidden", width: "100%" }}>
        <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: monoFont, fontSize: "10px", fontWeight: 700, color: "var(--faint)", letterSpacing: "1px", textTransform: "uppercase", flexWrap: "nowrap", overflow: "hidden" }}>
          <Link href="/" style={{ color: "var(--faint)", textDecoration: "none", flexShrink: 0 }}>RIGPK</Link>
          <span style={{ flexShrink: 0 }}>›</span>
          <Link href="/prebuilts" style={{ color: "var(--faint)", textDecoration: "none", flexShrink: 0 }}>PRE-BUILTS</Link>
          <span style={{ flexShrink: 0 }}>›</span>
          <span className="pb-spec-breadcrumb-name" style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{prebuilt.name}</span>
        </nav>
      </div>

      <PrebuiltSpecPage prebuilt={prebuilt} />
      <Footer />
    </>
  );
}
