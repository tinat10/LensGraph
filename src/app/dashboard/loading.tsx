export default function DashboardLoading() {
  return (
    <main className="page-shell py-10">
      <div className="mb-10 space-y-3 border-b border-line pb-8">
        <div className="h-3 w-24 animate-pulse rounded bg-paper-muted" />
        <div className="h-10 w-64 animate-pulse rounded bg-paper-muted" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-2xl bg-paper-muted"
          />
        ))}
      </div>
    </main>
  );
}
