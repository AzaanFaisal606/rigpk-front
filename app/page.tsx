import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Sources from "@/components/Sources";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getStats } from "@/lib/api";

export default async function Home() {
  const statsResult = await getStats();
  const stats = statsResult.ok ? statsResult.data : null;

  return (
    <div className="flex flex-col flex-1">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "RigPK",
          url: "https://rigpk.vercel.app",
          description: "PC part price comparison for Pakistan",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://rigpk.vercel.app/market?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <Navbar />
      <main className="flex flex-col flex-1">
        <Hero stats={stats} />
        <Sources stats={stats} />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
