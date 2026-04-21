import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Sources from "@/components/Sources";
import Features from "@/components/Features";
import { getStats } from "@/lib/api";

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="flex flex-col flex-1" style={{ background: "#ffffff" }}>
      <Navbar />
      <main className="flex flex-col flex-1">
        <Hero stats={stats} />
        <Sources stats={stats} />
        <Features />
      </main>
      <footer
        className="border-t px-6 py-6 text-center text-xs"
        style={{
          background: "#ffffff",
          borderColor: "#e5e7eb",
          color: "#9ca3af",
        }}
      >
        PakPC — prices updated regularly from Pakistani retailers
      </footer>
    </div>
  );
}
