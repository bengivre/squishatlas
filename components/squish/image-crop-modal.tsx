"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import { cropImageToFile } from "@/lib/images/crop-image";

type ImageCropModalProps = {
  imageSrc: string;
  fileName: string;
  mimeType: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropModal({
  imageSrc,
  fileName,
  mimeType,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels || isConfirming) {
      return;
    }

    setError(null);
    setIsConfirming(true);

    try {
      const outputType =
        mimeType === "image/png" || mimeType === "image/webp"
          ? mimeType
          : "image/jpeg";
      const file = await cropImageToFile(
        imageSrc,
        croppedAreaPixels,
        fileName,
        outputType,
      );
      onConfirm(file);
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "Could not crop that image.",
      );
      setIsConfirming(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-night-deep/80 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
    >
      <div className="stat-panel flex w-full max-w-lg flex-col gap-4 overflow-hidden shadow-glow">
        <div>
          <h2 id="image-crop-title" className="stat-k">
            Crop photo
          </h2>
          <p className="mt-1 text-sm text-star-dim">
            Move and zoom so your squish fits.
          </p>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-card bg-night-deep">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
          />
        </div>

        <label className="flex flex-col gap-2 text-sm text-star-dim">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-moon-gold"
            disabled={isConfirming}
          />
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1"
            disabled={isConfirming}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-11 flex-1 font-semibold"
            disabled={isConfirming || !croppedAreaPixels}
            onClick={handleConfirm}
          >
            {isConfirming ? "Working…" : "Use this photo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
