export type PhotoDerivativeSize = "thumb" | "card" | "full";

export function photoDerivativeFilename(
  photoId: string,
  size: PhotoDerivativeSize,
): string {
  return `${photoId}-${size}.webp`;
}

export function photoPublicUrl(
  tenantId: string,
  squishId: string,
  photoId: string,
  size: PhotoDerivativeSize,
): string {
  return `/uploads/${tenantId}/${squishId}/${photoDerivativeFilename(photoId, size)}`;
}
