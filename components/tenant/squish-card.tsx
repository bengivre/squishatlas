import Link from "next/link";

import { SquishPhotoImg } from "@/components/squish/squish-photo-img";
import type { SquishPhoto } from "@/db/schema/squish-photo";

function formatAdoptedDate(adoptedAt: string | null): string | null {
  if (!adoptedAt) {
    return null;
  }
  const date = new Date(adoptedAt);
  if (Number.isNaN(date.getTime())) {
    return `Adopted ${adoptedAt}`;
  }
  return `Adopted ${date.toLocaleString("en-US", { month: "short", year: "numeric" })}`;
}

export function SquishCard({
  slug,
  tenantId,
  squishId,
  name,
  adoptedAt,
  isFavorite,
  photo,
}: {
  slug: string;
  tenantId: string;
  squishId: string;
  name: string;
  adoptedAt: string | null;
  isFavorite: boolean;
  photo: SquishPhoto | null | undefined;
}) {
  const meta = formatAdoptedDate(adoptedAt);

  return (
    <Link
      href={`/t/${slug}/squishies/${squishId}`}
      className="squish-card pressable-card block transition hover:opacity-95"
    >
      {isFavorite ? <div className="squish-card-heart">💛</div> : null}
      <div className="squish-card-pic">
        {photo ? (
          <SquishPhotoImg
            photo={photo}
            tenantId={tenantId}
            squishId={squishId}
            size="card"
            alt={name}
            className="h-full w-full object-contain"
          />
        ) : null}
      </div>
      <h3 className="squish-card-name">{name}</h3>
      {meta ? <div className="squish-card-meta">{meta}</div> : null}
    </Link>
  );
}
