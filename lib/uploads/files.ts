import { rm } from "node:fs/promises";

import {
  photoDerivativeFilename,
  photoStorageDir,
  type PhotoDerivativeSize,
} from "./config";

const DERIVATIVE_SIZES: PhotoDerivativeSize[] = ["thumb", "card", "full"];

export async function deletePhotoDerivatives(
  tenantId: string,
  squishId: string,
  photoId: string,
): Promise<void> {
  const { unlink } = await import("node:fs/promises");
  const dir = photoStorageDir(tenantId, squishId);

  await Promise.all(
    DERIVATIVE_SIZES.map((size) =>
      unlink(`${dir}/${photoDerivativeFilename(photoId, size)}`).catch(() => undefined),
    ),
  );
}

export async function deleteSquishUploadDirectory(
  tenantId: string,
  squishId: string,
): Promise<void> {
  await rm(photoStorageDir(tenantId, squishId), {
    recursive: true,
    force: true,
  });
}
