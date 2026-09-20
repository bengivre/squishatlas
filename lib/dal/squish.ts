import { and, asc, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { squish, type NewSquish, type Squish } from "@/db/schema/squish";
import { deleteSquishUploadDirectory } from "@/lib/uploads/files";

export type SquishSortField =
  | "name"
  | "adopted_at"
  | "created_at"
  | "is_favorite"
  | "favorite_first";
export type SquishSortOrder = "asc" | "desc";

export type ListSquishOptions = {
  search?: string;
  sort?: SquishSortField;
  order?: SquishSortOrder;
};

export type CreateSquishInput = {
  name: string;
  story?: string | null;
  adoptedAt?: string | null;
  isFavorite?: boolean;
};

export type UpdateSquishInput = Partial<CreateSquishInput>;

function sortColumn(field: SquishSortField) {
  switch (field) {
    case "adopted_at":
      return squish.adoptedAt;
    case "created_at":
      return squish.createdAt;
    case "is_favorite":
      return squish.isFavorite;
    case "name":
    default:
      return squish.name;
  }
}

export async function createSquish(
  tenantId: string,
  input: CreateSquishInput,
): Promise<Squish> {
  const [created] = await db
    .insert(squish)
    .values({
      tenantId,
      name: input.name.trim(),
      story: input.story?.trim() || null,
      adoptedAt: input.adoptedAt ?? null,
      isFavorite: input.isFavorite ?? false,
    } satisfies NewSquish)
    .returning();

  return created;
}

export async function getSquishById(
  tenantId: string,
  squishId: string,
): Promise<Squish | null> {
  const row = await db.query.squish.findFirst({
    where: and(eq(squish.id, squishId), eq(squish.tenantId, tenantId)),
  });

  return row ?? null;
}

export async function listSquish(
  tenantId: string,
  options: ListSquishOptions = {},
): Promise<Squish[]> {
  const sortField = options.sort ?? "name";
  const sortOrder = options.order ?? "asc";

  if (sortField === "favorite_first") {
    const search = options.search?.trim();
    const where = search
      ? and(
          eq(squish.tenantId, tenantId),
          or(
            ilike(squish.name, `%${search}%`),
            ilike(squish.story, `%${search}%`),
          ),
        )
      : eq(squish.tenantId, tenantId);

    return db
      .select()
      .from(squish)
      .where(where)
      .orderBy(desc(squish.isFavorite), asc(squish.name));
  }

  const sortExpr = sortColumn(sortField);
  const orderBy = sortOrder === "desc" ? desc(sortExpr) : asc(sortExpr);

  const search = options.search?.trim();

  if (search) {
    const pattern = `%${search}%`;
    return db
      .select()
      .from(squish)
      .where(
        and(
          eq(squish.tenantId, tenantId),
          or(ilike(squish.name, pattern), ilike(squish.story, pattern)),
        ),
      )
      .orderBy(orderBy);
  }

  return db
    .select()
    .from(squish)
    .where(eq(squish.tenantId, tenantId))
    .orderBy(orderBy);
}

export async function updateSquish(
  tenantId: string,
  squishId: string,
  input: UpdateSquishInput,
): Promise<Squish | null> {
  const values: Partial<NewSquish> = {};

  if (input.name !== undefined) {
    values.name = input.name.trim();
  }
  if (input.story !== undefined) {
    values.story = input.story?.trim() || null;
  }
  if (input.adoptedAt !== undefined) {
    values.adoptedAt = input.adoptedAt;
  }
  if (input.isFavorite !== undefined) {
    values.isFavorite = input.isFavorite;
  }

  if (Object.keys(values).length === 0) {
    return getSquishById(tenantId, squishId);
  }

  const [updated] = await db
    .update(squish)
    .set(values)
    .where(and(eq(squish.id, squishId), eq(squish.tenantId, tenantId)))
    .returning();

  return updated ?? null;
}

export async function deleteSquish(
  tenantId: string,
  squishId: string,
): Promise<boolean> {
  const existing = await getSquishById(tenantId, squishId);

  if (!existing) {
    return false;
  }

  await deleteSquishUploadDirectory(tenantId, squishId);

  const deleted = await db
    .delete(squish)
    .where(and(eq(squish.id, squishId), eq(squish.tenantId, tenantId)))
    .returning({ id: squish.id });

  return deleted.length > 0;
}
