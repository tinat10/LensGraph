import Image from "next/image";
import Link from "next/link";

type CollectionCardProps = {
  id: string;
  title: string;
  description: string | null;
  photoCount: number;
  updatedAt: string;
  coverPhotoUrl?: string | null;
};

export function CollectionCard({
  id,
  title,
  description,
  photoCount,
  updatedAt,
  coverPhotoUrl,
}: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${id}`}
      className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <div className="relative aspect-[16/10] bg-zinc-100 dark:bg-zinc-900">
        {coverPhotoUrl ? (
          <Image
            src={coverPhotoUrl}
            alt={`${title} cover`}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No cover photo
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100">
            {title}
          </h3>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {photoCount} photos
          </span>
        </div>
        {description ? (
          <p className="mb-4 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        ) : (
          <p className="mb-4 text-sm text-zinc-400">No description yet</p>
        )}
        <p className="text-xs text-zinc-500">
          Updated {new Date(updatedAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
