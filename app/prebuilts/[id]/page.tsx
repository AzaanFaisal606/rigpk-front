import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrebuiltSpecPage from "@/components/PrebuiltSpecPage";
import { getPrebuilt } from "@/lib/prebuilts-api";
import { monoFont } from "@/lib/tokens";

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
  if (!prebuilt) return { title: "Pre-Built — RigPK" };
  return {
    title: `${prebuilt.name} — RigPK`,
    description: `Buy the ${prebuilt.name} pre-built PC from ${prebuilt.source} in Pakistan.`,
  };
}

export default async function PrebuiltDetailPage({ params }: PageProps) {
  const { id } = await params;
  const n = parseId(id);
  const prebuilt = n === null ? null : await getPrebuilt(n);
  if (!prebuilt) notFound();

  return (
    <>
      <Navbar />
      <div className="pb-spec-page-breadcrumb" style={{ maxWidth: "1280px", margin: "0 auto", padding: "16px 48px 0", overflow: "hidden", width: "100%" }}>
        <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: monoFont, fontSize: "10px", fontWeight: 700, color: "#a1a1aa", letterSpacing: "1px", textTransform: "uppercase", flexWrap: "nowrap", overflow: "hidden" }}>
          <Link href="/" style={{ color: "#a1a1aa", textDecoration: "none", flexShrink: 0 }}>RIGPK</Link>
          <span style={{ flexShrink: 0 }}>›</span>
          <Link href="/prebuilts" style={{ color: "#a1a1aa", textDecoration: "none", flexShrink: 0 }}>PRE-BUILTS</Link>
          <span style={{ flexShrink: 0 }}>›</span>
          <span className="pb-spec-breadcrumb-name" style={{ color: "#111112", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{prebuilt.name}</span>
        </nav>
      </div>

      <PrebuiltSpecPage prebuilt={prebuilt} />
      <Footer />
    </>
  );
}
