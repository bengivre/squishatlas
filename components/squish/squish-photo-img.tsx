import type { SquishPhoto } from "@/db/schema/squish-photo";
import {
  photoPublicUrl,
  type PhotoDerivativeSize,
} from "@/lib/uploads/urls";

export function SquishPhotoImg({
  photo,
  tenantId,
  squishId,
  size,
  className,
  alt,
}: {
  photo: SquishPhoto;
  tenantId: string;
  squishId: string;
  size: PhotoDerivativeSize;
  className?: string;
  alt: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-generated derivatives served by Caddy
    <img
      src={photoPublicUrl(tenantId, squishId, photo.id, size)}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      alt={alt}
      className={className}
    />
  );
}
