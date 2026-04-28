import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import PrebuiltSpecPage from "@/components/PrebuiltSpecPage";
import { getPrebuilt } from "@/lib/prebuilts-api";

const monoFont = '"JetBrains Mono", "Fira Code", monospace';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const prebuilt = await getPrebuilt(Number(id));
  if (!prebuilt) return { title: "Pre-Built — RigPK" };
  return {
    title: `${prebuilt.name} — RigPK`,
    description: `Buy the ${prebuilt.name} pre-built PC from ${prebuilt.source} in Pakistan.`,
  };
}

export default async function PrebuiltDetailPage({ params }: PageProps) {
  const { id } = await params;
  const prebuilt = await getPrebuilt(Number(id));
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
    </>
  );
}
