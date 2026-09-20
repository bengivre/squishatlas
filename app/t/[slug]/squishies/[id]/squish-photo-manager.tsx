"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { ImageCropModal } from "@/components/squish/image-crop-modal";
import { SquishPhotoImg } from "@/components/squish/squish-photo-img";
import type { SquishPhoto } from "@/db/schema/squish-photo";
import {
  downscaleImageIfNeeded,
  prepareImageForCrop,
} from "@/lib/images/prepare-upload";

import {
  deletePhotoAction,
  reorderPhotosAction,
  setPrimaryPhotoAction,
} from "./photo-actions";

type CropSession = {
  imageSrc: string;
  fileName: string;
  mimeType: string;
};

export function SquishPhotoManager({
  slug,
  tenantId,
  squishId,
  initialPhotos,
}: {
  slug: string;
  tenantId: string;
  squishId: string;
  initialPhotos: SquishPhoto[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [cropSession, setCropSession] = useState<CropSession | null>(null);

  useEffect(() => {
    return () => {
      if (cropSession?.imageSrc) {
        URL.revokeObjectURL(cropSession.imageSrc);
      }
    };
  }, [cropSession?.imageSrc]);

  function clearCropSession() {
    setCropSession((current) => {
      if (current?.imageSrc) {
        URL.revokeObjectURL(current.imageSrc);
      }
      return null;
    });
  }

  async function onUploadSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsPreparingCrop(true);

    try {
      const prepared = await prepareImageForCrop(file);
      const imageSrc = URL.createObjectURL(prepared);

      setCropSession({
        imageSrc,
        fileName: prepared.name,
        mimeType: prepared.type || "image/jpeg",
      });
    } catch (prepareError) {
      setError(
        prepareError instanceof Error
          ? prepareError.message
          : "Could not open that photo for cropping.",
      );
    } finally {
      setIsPreparingCrop(false);
    }
  }

  async function uploadCroppedPhoto(file: File) {
    clearCropSession();
    setError(null);
    setMessage(null);
    setIsUploading(true);

    try {
      const prepared = await downscaleImageIfNeeded(file, 2000);
      const body = new FormData();
      body.set("photo", prepared);

      const response = await fetch(
        `/api/t/${slug}/squishies/${squishId}/photos`,
        {
          method: "POST",
          body,
        },
      );

      const payload = (await response.json()) as {
        photo?: SquishPhoto;
        error?: string;
      };

      if (!response.ok || !payload.photo) {
        setError(
          payload.error ?? "Photo didn't upload — try again or pick another file.",
        );
        return;
      }

      setPhotos((current) => [...current, payload.photo!]);
      setMessage("Photo uploaded.");
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Photo didn't upload — try again or pick another file.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function movePhoto(photoId: string, direction: -1 | 1) {
    const index = photos.findIndex((photo) => photo.id === photoId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= photos.length) {
      return;
    }

    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);

    setPhotos(next);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await reorderPhotosAction(
        slug,
        squishId,
        next.map((photo) => photo.id),
      );

      if (!result.ok) {
        setError(result.message);
        setPhotos(initialPhotos);
        return;
      }

      setPhotos(result.photos);
      setMessage("Photo order updated.");
      router.refresh();
    });
  }

  function onSetPrimary(photoId: string) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await setPrimaryPhotoAction(slug, squishId, photoId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPhotos(result.photos);
      setMessage("Primary photo updated.");
      router.refresh();
    });
  }

  function onDeletePhoto(photoId: string) {
    const photo = photos.find((entry) => entry.id === photoId);
    if (!photo) {
      return;
    }

    if (!confirm("Delete this photo?")) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await deletePhotoAction(slug, squishId, photoId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setPhotos(result.photos);
      setMessage("Photo deleted.");
      router.refresh();
    });
  }

  const busy = isUploading || isPending || isPreparingCrop;

  return (
    <section className="stat-panel space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="stat-k">Photos</h2>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {isUploading
            ? "Uploading…"
            : isPreparingCrop
              ? "Opening…"
              : "Upload photo"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={onUploadSelected}
        />
      </div>

      {message ? <p className="text-sm text-aurora">{message}</p> : null}
      {error ? <p className="text-sm text-blush">{error}</p> : null}

      {photos.length === 0 ? (
        <p className="text-sm text-star-dim">
          No photos yet. Upload one to show this squish in your collection.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <li key={photo.id} className="space-y-2">
              <div className="squish-card-pic">
                <SquishPhotoImg
                  photo={photo}
                  tenantId={tenantId}
                  squishId={squishId}
                  size="card"
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {photo.isPrimary ? (
                  <span className="rounded-full border border-moon-gold/40 px-2 py-0.5 text-moon-gold">
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => onSetPrimary(photo.id)}
                    className="rounded-full border border-star-dim/30 px-2 py-0.5 text-star-dim disabled:opacity-60"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending || index === 0}
                  onClick={() => movePhoto(photo.id, -1)}
                  className="rounded-full border border-star-dim/30 px-2 py-0.5 text-star-dim disabled:opacity-60"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={isPending || index === photos.length - 1}
                  onClick={() => movePhoto(photo.id, 1)}
                  className="rounded-full border border-star-dim/30 px-2 py-0.5 text-star-dim disabled:opacity-60"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onDeletePhoto(photo.id)}
                  className="rounded-full border border-blush/40 px-2 py-0.5 text-blush disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cropSession ? (
        <ImageCropModal
          imageSrc={cropSession.imageSrc}
          fileName={cropSession.fileName}
          mimeType={cropSession.mimeType}
          onCancel={clearCropSession}
          onConfirm={uploadCroppedPhoto}
        />
      ) : null}
    </section>
  );
}
