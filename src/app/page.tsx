import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">
            Photo intelligence platform
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Turn image collections into searchable visual stories.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            LensGraph ingests photos, extracts EXIF metadata, generates color
            palettes, and helps you publish polished story galleries — not just
            another photo dump.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/signin">
              <Button>Get started</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">View dashboard</Button>
            </Link>
          </div>
        </div>

        <section className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Metadata pipeline",
              body: "Extract EXIF, dimensions, timestamps, camera details, and GPS when available.",
            },
            {
              title: "Visual enrichment",
              body: "Generate dominant color palettes and prepare photos for mood-based discovery.",
            },
            {
              title: "Story publishing",
              body: "Publish curated public story pages from your collections.",
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {feature.body}
              </p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
