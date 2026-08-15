import Navbar from "@/components/Navbar";
import { monoFont } from "@/lib/tokens";

// Plain — no fetching.
export default function Loading() {
  return (
    <>
      <Navbar />
      <main
        className="mx-auto px-6 py-8 flex items-center justify-center"
        style={{ maxWidth: "1400px", minHeight: "50vh" }}
      >
        <p
          style={{
            fontFamily: monoFont,
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "var(--text-dim)",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          {"// LOADING"}
        </p>
      </main>
    </>
  );
}
