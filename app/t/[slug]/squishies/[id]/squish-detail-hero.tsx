"use client";

import Link from "next/link";
import { useState } from "react";

import { SquishPhotoImg } from "@/components/squish/squish-photo-img";
import type { SquishPhoto } from "@/db/schema/squish-photo";

export function SquishDetailHero({
  slug,
  tenantId,
  squishId,
  photos,
}: {
  slug: string;
  tenantId: string;
  squishId: string;
  photos: SquishPhoto[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = photos[activeIndex] ?? null;

  function cyclePhoto() {
    if (photos.length <= 1) {
      return;
    }
    setActiveIndex((current) => (current + 1) % photos.length);
  }

  return (
    <div
      className="detail-hero cursor-pointer"
      onClick={cyclePhoto}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          cyclePhoto();
        }
      }}
      role={photos.length > 1 ? "button" : undefined}
      tabIndex={photos.length > 1 ? 0 : undefined}
      aria-label={photos.length > 1 ? "Cycle photos" : undefined}
    >
      <Link
        href={`/t/${slug}/squishies`}
        className="detail-back"
        onClick={(event) => event.stopPropagation()}
      >
        ‹
      </Link>
      {activePhoto ? (
        <SquishPhotoImg
          photo={activePhoto}
          tenantId={tenantId}
          squishId={squishId}
          size="full"
          alt=""
          className="h-full w-full object-contain"
        />
      ) : null}
      {photos.length > 1 ? (
        <div className="detail-dots">
          {photos.map((photo, index) => (
            <span key={photo.id} className={index === activeIndex ? "on" : undefined} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
