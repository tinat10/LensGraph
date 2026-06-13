import Image from "next/image";
import Link from "next/link";

type CollectionCardProps = {
  id: string;
  title: string;
  description: string | null;
  photoCount: number;
  updatedAt: string;
  coverPhotoUrl?: string | null;
  isPublished?: boolean;
};

export function CollectionCard({
  id,
  title,
  description,
  photoCount,
  updatedAt,
  coverPhotoUrl,
  isPublished = false,
}: CollectionCardProps) {
  return (
    <Link href={`/collections/${id}`} className="group surface-interactive overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl text-ink group-hover:text-ink-secondary">
            {title}
          </h3>
          <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-muted">
            {photoCount} photos
          </span>
        </div>
        {isPublished ? (
          <p className="mb-3 text-xs font-semibold tracking-wide text-ink uppercase">
            Published story
          </p>
        ) : null}
        {description ? (
          <p className="mb-4 line-clamp-2 text-sm leading-6 text-muted">
            {description}
          </p>
        ) : (
          <p className="mb-4 text-sm text-subtle">No description yet</p>
        )}
        <p className="text-xs tracking-wide text-subtle uppercase">
          Updated {new Date(updatedAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
