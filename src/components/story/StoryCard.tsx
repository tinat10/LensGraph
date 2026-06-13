import Image from "next/image";
import Link from "next/link";

type StoryCardProps = {
  slug: string;
  title: string;
  intro: string | null;
  photoCount: number;
  updatedAt: string;
  coverPhotoUrl?: string | null;
  authorName?: string | null;
  authorImage?: string | null;
};

export function StoryCard({
  slug,
  title,
  intro,
  photoCount,
  updatedAt,
  coverPhotoUrl,
  authorName,
  authorImage,
}: StoryCardProps) {
  return (
    <Link href={`/story/${slug}`} className="group surface-interactive overflow-hidden">
      <div className="relative aspect-[16/10] bg-paper-muted">
        {coverPhotoUrl ? (
          <Image
            src={coverPhotoUrl}
            alt={`${title} cover`}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-subtle">
            No cover photo
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-ink group-hover:text-accent-muted">
            {title}
          </h3>
          <span className="shrink-0 rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-muted">
            {photoCount} photo{photoCount === 1 ? "" : "s"}
          </span>
        </div>
        {intro ? (
          <p className="mb-4 line-clamp-2 text-sm leading-6 text-muted">{intro}</p>
        ) : (
          <p className="mb-4 text-sm text-subtle">A curated photo story</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {authorImage ? (
              <Image
                src={authorImage}
                alt={authorName ?? "Author"}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-muted">
                {(authorName ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
            <p className="truncate text-sm text-muted">
              {authorName ?? "LensGraph creator"}
            </p>
          </div>
          <p className="shrink-0 text-xs tracking-wide text-subtle uppercase">
            {new Date(updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
