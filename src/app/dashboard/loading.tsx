export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 animate-pulse space-y-3">
        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
          />
        ))}
      </div>
    </main>
  );
}
