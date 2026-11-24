
// Plain — no fetching. Shown by Next.js while a route segment's data is
// still loading.
export default function Loading() {
  return (
    <div className="status-page flex items-center justify-center">
      <p className="status-loading">
        {"// LOADING"}
      </p>
    </div>
  );
}
