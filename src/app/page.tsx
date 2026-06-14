import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const heroCollage = [
  {
    src: "/hero/teishoku.png",
    alt: "Japanese teishoku spread photographed from above",
  },
  {
    src: "/hero/jiufen.png",
    alt: "Lantern-lined alley in Jiufen, Taiwan",
  },
  {
    src: "/hero/taipei.png",
    alt: "Friends gathered around a Taipei manhole cover",
  },
  {
    src: "/hero/teaware.png",
    alt: "Ceramic teaware displayed on wooden shelves",
  },
] as const;

const features = [
  {
    title: "Metadata pipeline",
    body: "Extract EXIF, dimensions, timestamps, camera details, and GPS when available.",
  },
  {
    title: "Visual enrichment",
    body: "AI captions, mood tags, color palettes, and semantic search across collections.",
  },
  {
    title: "Story publishing",
    body: "Publish curated public story pages — polished galleries, not photo dumps.",
  },
];

function HeroPhoto({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-paper-muted">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 50vw, 260px"
        className="object-cover"
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <main className="page-shell pb-24 pt-12 lg:pt-16">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5">Photo intelligence platform</p>
            <h1 className="font-display text-[2.75rem] leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]">
              Turn collections into searchable visual stories.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              LensGraph ingests photos, extracts metadata, enriches them with AI,
              and helps you publish gallery-quality story pages.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signin">
                <Button>Get started</Button>
              </Link>
              <Link href="/stories">
                <Button variant="secondary">Explore stories</Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-4 -top-4 hidden h-28 w-28 rounded-full bg-accent-soft lg:block" />
            <div className="surface-panel grid grid-cols-2 gap-3 p-3 sm:p-4">
              {heroCollage.map((photo, index) => (
                <HeroPhoto
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  priority={index === 0}
                />
              ))}
            </div>
            <p className="mt-4 text-right text-xs tracking-[0.18em] text-subtle uppercase">
              Collection → enrich → publish
            </p>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.title} className="surface-interactive p-6">
              <p className="mb-4 text-xs font-semibold text-accent-muted">
                0{index + 1}
              </p>
              <h2 className="font-display text-2xl text-ink">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{feature.body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
