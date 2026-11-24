import Navbar from "@/components/Navbar";

// Plain — no fetching.
export default function Loading() {
  return (
    <>
      <Navbar />
      <main className="status-main mx-auto px-6 py-8 flex items-center justify-center">
        <p className="status-loading">
          {"// LOADING"}
        </p>
      </main>
    </>
  );
}
