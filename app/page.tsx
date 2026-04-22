import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Sources from "@/components/Sources";
import Features from "@/components/Features";
import { getStats } from "@/lib/api";

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="flex flex-col flex-1">
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
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
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
