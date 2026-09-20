import sharp from "sharp";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateUploadMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

export function validateUploadSize(byteLength: number): boolean {
  return byteLength > 0 && byteLength <= MAX_UPLOAD_BYTES;
}

export async function probeImageBuffer(buffer: Buffer): Promise<boolean> {
  try {
    await sharp(buffer, { failOn: "error" }).metadata();
    return true;
  } catch {
    return false;
  }
}

export const UPLOAD_TOO_LARGE_MESSAGE =
  "That photo is too big — try one under 10MB.";
export const UPLOAD_INVALID_TYPE_MESSAGE =
  "That file is not a supported photo. Use JPEG, PNG, or WebP.";
export const UPLOAD_INVALID_IMAGE_MESSAGE =
  "That file could not be read as a photo. Try a different image.";
