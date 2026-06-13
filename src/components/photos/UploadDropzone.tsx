"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

type UploadDropzoneProps = {
  collectionId: string;
};

export function UploadDropzone({ collectionId }: UploadDropzoneProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const selected = Array.from(incoming).filter((file) =>
      file.type.startsWith("image/"),
    );
    setFiles((current) => {
      const existing = new Set(
        current.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
      );
      const merged = [...current];
      for (const file of selected) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!existing.has(key)) merged.push(file);
      }
      return merged;
    });
    setError(null);
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setError("Select at least one image");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("collectionId", collectionId);
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      router.push(`/collections/${collectionId}`);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center transition ${
          isDragging
            ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:border-zinc-600"
        }`}
      >
        <span className="mb-2 text-base font-medium text-zinc-900 dark:text-zinc-100">
          Drop photos here or browse
        </span>
        <span className="text-sm text-zinc-500">
          JPG, PNG, or WebP up to 15MB each
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {files.length > 0 ? (
        <div>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            {files.length} file{files.length === 1 ? "" : "s"} selected
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.lastModified}`}
                className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="truncate px-2 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isUploading || files.length === 0}>
          {isUploading ? "Processing photos..." : "Upload and analyze"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/collections/${collectionId}`)}
          disabled={isUploading}
        >
          Skip for now
        </Button>
      </div>
    </form>
  );
}
