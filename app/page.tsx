import Navbar from "@/components/Navbar";
import HomeHero from "@/components/home/HomeHero";
import Sources from "@/components/Sources";
import ComicPage from "@/components/home/ComicPage";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getStats } from "@/lib/api";
import { getTrendGroups } from "@/lib/trends-api";
import { SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  // Same URL and revalidate as /trends, so this shares its data cache entry
  // and costs the backend nothing extra.
  const [statsResult, gpuResult] = await Promise.all([getStats(), getTrendGroups("gpu")]);
  const stats = statsResult.ok ? statsResult.data : null;
  const gpuGroups = gpuResult.ok ? gpuResult.data : null;

  return (
    <div className="flex flex-col flex-1">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "RigPK",
          url: SITE_URL,
          description: "PC part price comparison for Pakistan",
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/market?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Navbar />
      <main className="flex flex-col flex-1">
        <HomeHero stats={stats} />
        <Sources stats={stats} />
        <ComicPage gpuGroups={gpuGroups} />
      </main>
      <Footer />
    </div>
  );
}
