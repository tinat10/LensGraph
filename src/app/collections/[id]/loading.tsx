export default function CollectionLoading() {
  return (
    <main className="page-shell py-10">
      <div className="mb-8 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-paper-muted" />
        <div className="h-10 w-72 animate-pulse rounded bg-paper-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-paper-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/3] animate-pulse rounded-2xl bg-paper-muted"
          />
        ))}
      </div>
    </main>
  );
}
