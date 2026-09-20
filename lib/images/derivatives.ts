import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import {
  photoDerivativeFilename,
  photoStorageDir,
  type PhotoDerivativeSize,
} from "@/lib/uploads/config";

export const DERIVATIVE_SPECS: Record<
  PhotoDerivativeSize,
  { maxEdge: number; quality: number }
> = {
  thumb: { maxEdge: 200, quality: 70 },
  card: { maxEdge: 600, quality: 78 },
  full: { maxEdge: 1400, quality: 82 },
};

export type GeneratedDerivatives = {
  width: number;
  height: number;
};

export async function generatePhotoDerivatives(options: {
  tenantId: string;
  squishId: string;
  photoId: string;
  input: Buffer;
}): Promise<GeneratedDerivatives> {
  const dir = photoStorageDir(options.tenantId, options.squishId);
  await mkdir(dir, { recursive: true });

  let fullMeta: { width: number; height: number } | null = null;

  for (const [size, spec] of Object.entries(DERIVATIVE_SPECS) as [
    PhotoDerivativeSize,
    { maxEdge: number; quality: number },
  ][]) {
    const outputPath = path.join(
      dir,
      photoDerivativeFilename(options.photoId, size),
    );

    const pipeline = sharp(options.input, { failOn: "error" })
      .rotate()
      .resize({
        width: spec.maxEdge,
        height: spec.maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: spec.quality });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    await writeFile(outputPath, data);

    if (size === "full") {
      fullMeta = { width: info.width, height: info.height };
    }
  }

  if (!fullMeta) {
    throw new Error("Could not generate full derivative.");
  }

  return fullMeta;
}

export async function removeTemporaryUpload(filePath: string): Promise<void> {
  await unlink(filePath).catch(() => undefined);
}
