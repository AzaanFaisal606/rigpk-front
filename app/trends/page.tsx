import { getTrendGroups } from "@/lib/trends-api";
import { failOrRender } from "@/lib/keep-stale";
import TrendListPanel from "@/components/TrendListPanel";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "PC Part Price Trends in Pakistan",
  alternates: { canonical: "/trends" },
  description: "Median market prices for popular GPUs, CPUs and RAM in Pakistan over time.",
};

export default async function TrendsPage() {
  const [gpu, cpu, ram] = await Promise.all([
    getTrendGroups("gpu"),
    getTrendGroups("cpu"),
    getTrendGroups("ram"),
  ]);
  if (!gpu.ok || !cpu.ok || !ram.ok) failOrRender("Trends page: trend groups fetch failed");

  return (
    <>
      <Navbar />
      <main className="trends-main mx-auto px-6 py-8">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="trends-h1 font-black">
          Price <span className="trends-h1-accent">Trends</span>
        </h1>
        <p className="trends-sub mt-1">
          Median market price per model over time — tap or hover the chart for exact figures &amp; range.
        </p>
      </div>

      <div className="trends-grid">
        <TrendListPanel category="gpu" result={gpu} />
        <TrendListPanel category="cpu" result={cpu} />
        <TrendListPanel category="ram" result={ram} />
      </div>
      </main>
      <Footer />
    </>
  );
}
