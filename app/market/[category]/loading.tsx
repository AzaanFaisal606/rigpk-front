import Navbar from "@/components/Navbar";

// Plain — no fetching.
export default function Loading() {
  return (
    <div className="page-bg flex flex-col flex-1">
      <Navbar />
      <main className="flex flex-col flex-1 items-center justify-center">
        <p className="status-loading">
          {"// LOADING"}
        </p>
      </main>
    </div>
  );
}
