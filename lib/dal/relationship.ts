import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import {
  relationship,
  type Relationship,
  type RelationshipType,
} from "@/db/schema/relationship";
import { getSquishById } from "@/lib/dal/squish";

export type RelationshipPair = {
  pairId: string;
  fromSquishId: string;
  toSquishId: string;
  forwardType: RelationshipType;
  inverseType: RelationshipType;
  createdAt: Date;
};

export async function createRelationshipPair(
  tenantId: string,
  fromSquishId: string,
  toSquishId: string,
  forwardType: RelationshipType,
  inverseType: RelationshipType,
): Promise<RelationshipPair> {
  if (fromSquishId === toSquishId) {
    throw new Error("A squish cannot have a relationship with itself.");
  }

  const [fromSquish, toSquish] = await Promise.all([
    getSquishById(tenantId, fromSquishId),
    getSquishById(tenantId, toSquishId),
  ]);

  if (!fromSquish || !toSquish) {
    throw new Error("One or both squishies were not found.");
  }

  const pairId = randomUUID();

  const rows = await db.transaction(async (tx) => {
    return tx
      .insert(relationship)
      .values([
        {
          tenantId,
          fromSquishId,
          toSquishId,
          type: forwardType,
          pairId,
        },
        {
          tenantId,
          fromSquishId: toSquishId,
          toSquishId: fromSquishId,
          type: inverseType,
          pairId,
        },
      ])
      .returning();
  });

  const forward = rows.find((row) => row.fromSquishId === fromSquishId);

  if (!forward) {
    throw new Error("Failed to create relationship pair.");
  }

  return {
    pairId,
    fromSquishId,
    toSquishId,
    forwardType,
    inverseType,
    createdAt: forward.createdAt,
  };
}

export async function listRelationshipsBySquish(
  tenantId: string,
  squishId: string,
): Promise<Relationship[]> {
  return db.query.relationship.findMany({
    where: and(
      eq(relationship.tenantId, tenantId),
      eq(relationship.fromSquishId, squishId),
    ),
    orderBy: (fields, { asc }) => [asc(fields.createdAt)],
  });
}

export async function listRelationshipPairs(
  tenantId: string,
): Promise<RelationshipPair[]> {
  const rows = await db.query.relationship.findMany({
    where: eq(relationship.tenantId, tenantId),
    orderBy: (fields, { asc }) => [asc(fields.createdAt)],
  });

  const seen = new Set<string>();
  const pairs: RelationshipPair[] = [];

  for (const row of rows) {
    if (seen.has(row.pairId)) {
      continue;
    }

    const inverse = rows.find(
      (candidate) =>
        candidate.pairId === row.pairId &&
        candidate.fromSquishId === row.toSquishId &&
        candidate.toSquishId === row.fromSquishId,
    );

    if (!inverse) {
      continue;
    }

    seen.add(row.pairId);
    pairs.push({
      pairId: row.pairId,
      fromSquishId: row.fromSquishId,
      toSquishId: row.toSquishId,
      forwardType: row.type,
      inverseType: inverse.type,
      createdAt: row.createdAt,
    });
  }

  return pairs;
}

export async function deleteRelationshipPair(
  tenantId: string,
  pairId: string,
): Promise<boolean> {
  const rows = await db.query.relationship.findMany({
    where: and(
      eq(relationship.tenantId, tenantId),
      eq(relationship.pairId, pairId),
    ),
  });

  if (rows.length === 0) {
    return false;
  }

  await db
    .delete(relationship)
    .where(
      and(
        eq(relationship.tenantId, tenantId),
        eq(relationship.pairId, pairId),
      ),
    );

  return true;
}

export async function getRelationshipsForSquishIds(
  tenantId: string,
  squishIds: string[],
): Promise<Relationship[]> {
  if (squishIds.length === 0) {
    return [];
  }

  return db.query.relationship.findMany({
    where: and(
      eq(relationship.tenantId, tenantId),
      inArray(relationship.fromSquishId, squishIds),
    ),
  });
}
