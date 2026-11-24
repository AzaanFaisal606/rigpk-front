import Link from "next/link";

// Plain — no fetching. Handles notFound() calls and any unmatched URL.
export default function NotFound() {
  return (
    <div className="status-page flex flex-col items-center justify-center text-center px-6">
      <div className="status-card">
        <p className="status-title status-title--empty">
          {"// 404 NOT FOUND"}
        </p>
        <p className="status-text status-text--loose">
          Couldn&apos;t find that page.
        </p>
        <Link
          href="/"
          className="status-btn status-btn--primary status-btn--spaced"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
