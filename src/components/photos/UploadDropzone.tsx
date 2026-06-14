"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  parseApiErrorResponse,
  parseJsonResponse,
} from "@/lib/api/parse-response-error";
import {
  MAX_UPLOAD_FILES,
  MAX_UPLOAD_FILE_SIZE,
  isAcceptedImageFile,
} from "@/lib/photos/image-file";
import { Button } from "@/components/ui/Button";

type UploadDropzoneProps = {
  collectionId: string;
};

type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadFormat: string;
};

type CloudinaryDirectUploadResult = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format?: string;
};

export function UploadDropzone({ collectionId }: UploadDropzoneProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const selected = Array.from(incoming).filter(isAcceptedImageFile);
    const rejectedCount = Array.from(incoming).length - selected.length;

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

    if (rejectedCount > 0) {
      setError(
        `${rejectedCount} file${rejectedCount === 1 ? "" : "s"} skipped — use JPG, PNG, WebP, or HEIC photos.`,
      );
    } else {
      setError(null);
    }
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  async function getUploadSignature(): Promise<CloudinaryUploadSignature> {
    const response = await fetch("/api/photos/upload/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    });

    if (!response.ok) {
      throw new Error(
        await parseApiErrorResponse(response, "Could not start upload"),
      );
    }

    return parseJsonResponse<CloudinaryUploadSignature>(
      response,
      "Could not start upload",
    );
  }

  async function uploadFileToCloudinary(
    file: File,
    signature: CloudinaryUploadSignature,
  ): Promise<CloudinaryDirectUploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);
    formData.append("format", signature.uploadFormat);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(
        await parseApiErrorResponse(response, `Failed to upload ${file.name}`),
      );
    }

    return parseJsonResponse<CloudinaryDirectUploadResult>(
      response,
      `Failed to upload ${file.name}`,
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setError("Select at least one image");
      return;
    }

    if (files.length > MAX_UPLOAD_FILES) {
      setError(`Maximum ${MAX_UPLOAD_FILES} files per upload`);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_UPLOAD_FILE_SIZE);
    if (oversized) {
      setError(`${oversized.name} exceeds the 15MB limit`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const signature = await getUploadSignature();
      const uploaded: CloudinaryDirectUploadResult[] = [];

      for (const [index, file] of files.entries()) {
        setUploadProgress(`Uploading ${index + 1} of ${files.length}…`);
        const result = await uploadFileToCloudinary(file, signature);
        uploaded.push(result);
      }

      setUploadProgress("Saving photos…");

      const registerResponse = await fetch("/api/photos/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          photos: uploaded.map((result, index) => ({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            format: result.format,
            originalFilename: files[index]?.name ?? result.public_id,
          })),
        }),
      });

      if (!registerResponse.ok) {
        throw new Error(
          await parseApiErrorResponse(registerResponse, "Upload failed"),
        );
      }

      router.push(`/collections/${collectionId}`);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
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
            ? "border-ink bg-paper-muted"
            : "border-line-strong bg-surface hover:border-ink hover:bg-paper-muted"
        }`}
      >
        <span className="mb-2 text-base font-medium text-ink">
          Drop photos here or browse
        </span>
        <span className="text-sm text-muted">
          JPG, PNG, WebP, or HEIC up to 15MB each
        </span>
        <input
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {files.length > 0 ? (
        <div>
          <p className="mb-3 text-sm text-muted">
            {files.length} file{files.length === 1 ? "" : "s"} selected
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.lastModified}`}
                className="surface overflow-hidden"
              >
                <div className="relative aspect-square bg-paper-muted">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="truncate px-2 py-2 text-xs text-muted">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {uploadProgress ? (
        <p className="text-sm text-muted">{uploadProgress}</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isUploading || files.length === 0}>
          {isUploading ? "Uploading photos..." : "Upload and analyze"}
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
