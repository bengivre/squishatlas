"use server";

import { revalidatePath } from "next/cache";

import {
  deleteSquishPhoto,
  listSquishPhotos,
  reorderSquishPhotos,
  setPrimarySquishPhoto,
} from "@/lib/dal";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

import type { SquishPhoto } from "@/db/schema/squish-photo";

export type PhotoActionResult =
  | { ok: true; photos: SquishPhoto[]; message?: string }
  | { ok: false; message: string };

function detailPath(slug: string, squishId: string) {
  return `/t/${slug}/squishies/${squishId}`;
}

export async function reorderPhotosAction(
  slug: string,
  squishId: string,
  orderedPhotoIds: string[],
): Promise<PhotoActionResult> {
  const { tenant } = await requireTenantMember(slug);

  try {
    const photos = await reorderSquishPhotos(
      tenant.id,
      squishId,
      orderedPhotoIds,
    );

    revalidatePath(detailPath(slug, squishId));
    revalidatePath(`/t/${slug}/squishies`);

    return { ok: true, photos, message: "Photo order updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Photos didn't reorder — try again.",
    };
  }
}

export async function setPrimaryPhotoAction(
  slug: string,
  squishId: string,
  photoId: string,
): Promise<PhotoActionResult> {
  const { tenant } = await requireTenantMember(slug);

  try {
    const photos = await setPrimarySquishPhoto(tenant.id, squishId, photoId);

    revalidatePath(detailPath(slug, squishId));
    revalidatePath(`/t/${slug}/squishies`);

    return { ok: true, photos, message: "Primary photo updated." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Primary photo didn't update — try again.",
    };
  }
}

export async function deletePhotoAction(
  slug: string,
  squishId: string,
  photoId: string,
): Promise<PhotoActionResult> {
  const { tenant } = await requireTenantMember(slug);

  const removed = await deleteSquishPhoto(tenant.id, squishId, photoId);

  if (!removed) {
    return {
      ok: false,
      message: "That photo wasn't found — refresh and try again.",
    };
  }

  const photos = await listSquishPhotos(tenant.id, squishId);

  revalidatePath(detailPath(slug, squishId));
  revalidatePath(`/t/${slug}/squishies`);

  return { ok: true, photos, message: "Photo deleted." };
}
