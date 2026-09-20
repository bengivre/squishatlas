import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  squishPhoto,
  type NewSquishPhoto,
  type SquishPhoto,
} from "@/db/schema/squish-photo";
import { deletePhotoDerivatives } from "@/lib/uploads/files";

export async function listSquishPhotos(
  tenantId: string,
  squishId: string,
): Promise<SquishPhoto[]> {
  return db.query.squishPhoto.findMany({
    where: and(
      eq(squishPhoto.tenantId, tenantId),
      eq(squishPhoto.squishId, squishId),
    ),
    orderBy: [asc(squishPhoto.sortOrder), asc(squishPhoto.createdAt)],
  });
}

export async function getSquishPhotoById(
  tenantId: string,
  squishId: string,
  photoId: string,
): Promise<SquishPhoto | null> {
  const row = await db.query.squishPhoto.findFirst({
    where: and(
      eq(squishPhoto.id, photoId),
      eq(squishPhoto.tenantId, tenantId),
      eq(squishPhoto.squishId, squishId),
    ),
  });

  return row ?? null;
}

export async function createSquishPhoto(
  tenantId: string,
  squishId: string,
  input: Pick<NewSquishPhoto, "filename" | "width" | "height"> & {
    id?: string;
  },
): Promise<SquishPhoto> {
  const existing = await listSquishPhotos(tenantId, squishId);
  const nextSortOrder =
    existing.length > 0
      ? Math.max(...existing.map((photo) => photo.sortOrder)) + 1
      : 0;
  const isPrimary = existing.length === 0;

  const [created] = await db
    .insert(squishPhoto)
    .values({
      id: input.id,
      tenantId,
      squishId,
      filename: input.filename,
      width: input.width,
      height: input.height,
      sortOrder: nextSortOrder,
      isPrimary,
    })
    .returning();

  return created;
}

export async function updateSquishPhotoDimensions(
  tenantId: string,
  squishId: string,
  photoId: string,
  dimensions: { width: number; height: number },
): Promise<SquishPhoto | null> {
  const [updated] = await db
    .update(squishPhoto)
    .set(dimensions)
    .where(
      and(
        eq(squishPhoto.id, photoId),
        eq(squishPhoto.tenantId, tenantId),
        eq(squishPhoto.squishId, squishId),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function reorderSquishPhotos(
  tenantId: string,
  squishId: string,
  orderedPhotoIds: string[],
): Promise<SquishPhoto[]> {
  const photos = await listSquishPhotos(tenantId, squishId);
  const knownIds = new Set(photos.map((photo) => photo.id));

  if (
    orderedPhotoIds.length !== photos.length ||
    orderedPhotoIds.some((id) => !knownIds.has(id))
  ) {
    throw new Error("Photo order is invalid.");
  }

  await db.transaction(async (tx) => {
    for (const [index, photoId] of orderedPhotoIds.entries()) {
      await tx
        .update(squishPhoto)
        .set({ sortOrder: index })
        .where(
          and(
            eq(squishPhoto.id, photoId),
            eq(squishPhoto.tenantId, tenantId),
            eq(squishPhoto.squishId, squishId),
          ),
        );
    }
  });

  return listSquishPhotos(tenantId, squishId);
}

export async function setPrimarySquishPhoto(
  tenantId: string,
  squishId: string,
  photoId: string,
): Promise<SquishPhoto[]> {
  const target = await getSquishPhotoById(tenantId, squishId, photoId);

  if (!target) {
    throw new Error("Photo not found.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(squishPhoto)
      .set({ isPrimary: false })
      .where(
        and(
          eq(squishPhoto.tenantId, tenantId),
          eq(squishPhoto.squishId, squishId),
        ),
      );

    await tx
      .update(squishPhoto)
      .set({ isPrimary: true })
      .where(
        and(
          eq(squishPhoto.id, photoId),
          eq(squishPhoto.tenantId, tenantId),
          eq(squishPhoto.squishId, squishId),
        ),
      );
  });

  return listSquishPhotos(tenantId, squishId);
}

export async function deleteSquishPhoto(
  tenantId: string,
  squishId: string,
  photoId: string,
): Promise<boolean> {
  const photo = await getSquishPhotoById(tenantId, squishId, photoId);

  if (!photo) {
    return false;
  }

  await deletePhotoDerivatives(tenantId, squishId, photoId);

  await db
    .delete(squishPhoto)
    .where(
      and(
        eq(squishPhoto.id, photoId),
        eq(squishPhoto.tenantId, tenantId),
        eq(squishPhoto.squishId, squishId),
      ),
    );

  if (photo.isPrimary) {
    const remaining = await listSquishPhotos(tenantId, squishId);
    if (remaining[0]) {
      await setPrimarySquishPhoto(tenantId, squishId, remaining[0].id);
    }
  }

  return true;
}

export async function listPrimaryPhotosForSquishIds(
  tenantId: string,
  squishIds: string[],
): Promise<Map<string, SquishPhoto>> {
  if (squishIds.length === 0) {
    return new Map();
  }

  const rows = await db.query.squishPhoto.findMany({
    where: and(
      eq(squishPhoto.tenantId, tenantId),
      inArray(squishPhoto.squishId, squishIds),
    ),
    orderBy: [
      desc(squishPhoto.isPrimary),
      asc(squishPhoto.sortOrder),
      asc(squishPhoto.createdAt),
    ],
  });

  const map = new Map<string, SquishPhoto>();

  for (const row of rows) {
    if (!map.has(row.squishId)) {
      map.set(row.squishId, row);
    }
  }

  return map;
}

export async function countSquishPhotos(
  tenantId: string,
  squishId: string,
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(squishPhoto)
    .where(
      and(
        eq(squishPhoto.tenantId, tenantId),
        eq(squishPhoto.squishId, squishId),
      ),
    );

  return result?.count ?? 0;
}
