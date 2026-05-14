import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Sources from "@/components/Sources";
import Features from "@/components/Features";
import JsonLd from "@/components/JsonLd";
import { getStats } from "@/lib/api";
import { monoFont } from "@/lib/tokens";

export default async function Home() {
  const stats = await getStats();

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
      <footer
        className="px-6 py-5 text-center"
        style={{
          background: "var(--bg)",
          borderTop: "2px solid #111112",
          color: "var(--text-dim)",
          fontFamily: monoFont,
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        RigPK — prices updated regularly from Pakistani retailers
      </footer>
    </div>
  );
}
