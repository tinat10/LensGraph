const IMAGE_EXTENSION_PATTERN =
  /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i;

export function isAcceptedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  // iOS Safari often leaves type empty for camera roll photos.
  if (!file.type && IMAGE_EXTENSION_PATTERN.test(file.name)) {
    return true;
  }

  return false;
}

export const MAX_UPLOAD_FILE_SIZE = 15 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 20;
