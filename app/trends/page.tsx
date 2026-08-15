import { getTrendGroups } from "@/lib/trends-api";
import TrendListPanel from "@/components/TrendListPanel";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Price Trends — RigPK",
  description: "Average market prices for popular GPUs, CPUs and RAM in Pakistan over time.",
};

export default async function TrendsPage() {
  const [gpu, cpu, ram] = await Promise.all([
    getTrendGroups("gpu"),
    getTrendGroups("cpu"),
    getTrendGroups("ram"),
  ]);

  return (
    <>
      <Navbar />
      <main className="mx-auto px-6 py-8" style={{ maxWidth: "1400px" }}>
      {/* Heading */}
      <div className="mb-8">
        <h1
          className="font-black"
          style={{ fontSize: "1.9rem", letterSpacing: "-0.02em", color: "#111112" }}
        >
          Price <span style={{ color: "var(--purple)" }}>Trends</span>
        </h1>
        <p
          className="mono mt-1"
          style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}
        >
          Average market price per model over time — tap or hover the chart for exact figures &amp; range.
        </p>
      </div>

      <div className="trends-grid">
        <TrendListPanel category="gpu" groups={gpu} />
        <TrendListPanel category="cpu" groups={cpu} />
        <TrendListPanel category="ram" groups={ram} />
      </div>
      </main>
    </>
  );
}
