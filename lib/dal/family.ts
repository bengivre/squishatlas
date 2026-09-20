import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  FAMILY_COLORS,
  family,
  type Family,
  type FamilyColor,
} from "@/db/schema/family";
import { squish } from "@/db/schema/squish";

export type FamilyInput = {
  name: string;
  emoji?: string;
  color?: FamilyColor;
};

export function isFamilyColor(value: string): value is FamilyColor {
  return (FAMILY_COLORS as readonly string[]).includes(value);
}

function cleanEmoji(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  // One grapheme is plenty; fall back to the moon.
  const [first] = [...new Intl.Segmenter().segment(trimmed)].map(
    (s) => s.segment,
  );
  return first ?? "🌙";
}

export async function listFamilies(tenantId: string): Promise<Family[]> {
  return db.query.family.findMany({
    where: eq(family.tenantId, tenantId),
    orderBy: (fields, { asc }) => [asc(fields.createdAt)],
  });
}

export async function getFamilyById(
  tenantId: string,
  familyId: string,
): Promise<Family | null> {
  const row = await db.query.family.findFirst({
    where: and(eq(family.id, familyId), eq(family.tenantId, tenantId)),
  });
  return row ?? null;
}

export async function createFamily(
  tenantId: string,
  input: FamilyInput,
  memberIds: string[] = [],
): Promise<Family> {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Give the family a name.");
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(family)
      .values({
        tenantId,
        name,
        emoji: cleanEmoji(input.emoji),
        color: input.color ?? "gold",
      })
      .returning();

    if (memberIds.length > 0) {
      await tx
        .update(squish)
        .set({ familyId: created.id })
        .where(
          and(eq(squish.tenantId, tenantId), inArray(squish.id, memberIds)),
        );
    }

    return created;
  });
}

export async function updateFamily(
  tenantId: string,
  familyId: string,
  input: Partial<FamilyInput>,
): Promise<Family | null> {
  const patch: Partial<typeof family.$inferInsert> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Give the family a name.");
    }
    patch.name = name;
  }
  if (input.emoji !== undefined) {
    patch.emoji = cleanEmoji(input.emoji);
  }
  if (input.color !== undefined) {
    patch.color = input.color;
  }

  const [updated] = await db
    .update(family)
    .set(patch)
    .where(and(eq(family.id, familyId), eq(family.tenantId, tenantId)))
    .returning();

  return updated ?? null;
}

/** Members go back to being solo stars; nothing else is touched. */
export async function deleteFamily(
  tenantId: string,
  familyId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(family)
    .where(and(eq(family.id, familyId), eq(family.tenantId, tenantId)))
    .returning({ id: family.id });
  return deleted.length > 0;
}

export async function setSquishFamily(
  tenantId: string,
  squishIds: string[],
  familyId: string | null,
): Promise<void> {
  if (squishIds.length === 0) {
    return;
  }
  if (familyId) {
    const owner = await getFamilyById(tenantId, familyId);
    if (!owner) {
      throw new Error("That family wasn't found.");
    }
  }
  await db
    .update(squish)
    .set({ familyId })
    .where(and(eq(squish.tenantId, tenantId), inArray(squish.id, squishIds)));
}

/**
 * When two squishies get a family link and only one of them has a family,
 * the other joins it. Kids never have to manage membership by hand.
 */
export async function adoptFamilyAcrossLink(
  tenantId: string,
  aId: string,
  bId: string,
): Promise<void> {
  const rows = await db.query.squish.findMany({
    where: and(eq(squish.tenantId, tenantId), inArray(squish.id, [aId, bId])),
    columns: { id: true, familyId: true },
  });
  const a = rows.find((row) => row.id === aId);
  const b = rows.find((row) => row.id === bId);
  if (!a || !b) {
    return;
  }
  if (a.familyId && !b.familyId) {
    await setSquishFamily(tenantId, [bId], a.familyId);
  } else if (b.familyId && !a.familyId) {
    await setSquishFamily(tenantId, [aId], b.familyId);
  }
}
