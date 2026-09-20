import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  ORBIT_PAGES,
  orbit,
  type Orbit,
  type OrbitPage,
} from "@/db/schema/orbit";
import { tenant } from "@/db/schema/tenant";

export type OrbitEntry = Orbit & {
  savedTenant: {
    id: string;
    slug: string;
    displayName: string;
  };
};

export function isOrbitPage(value: string): value is OrbitPage {
  return (ORBIT_PAGES as readonly string[]).includes(value);
}

export function orbitPublicPath(slug: string, page: OrbitPage): string {
  switch (page) {
    case "hub":
      return `/t/${slug}`;
    case "gallery":
      return `/t/${slug}/gallery`;
    case "tree":
      return `/t/${slug}/tree`;
  }
}

export async function listOrbit(
  ownerTenantId: string,
): Promise<OrbitEntry[]> {
  const rows = await db.query.orbit.findMany({
    where: eq(orbit.ownerTenantId, ownerTenantId),
    orderBy: [desc(orbit.createdAt)],
    with: {
      savedTenant: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    savedTenant: {
      id: row.savedTenant.id,
      slug: row.savedTenant.slug,
      displayName: row.savedTenant.displayName,
    },
  }));
}

export async function countOrbit(ownerTenantId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(orbit)
    .where(eq(orbit.ownerTenantId, ownerTenantId));
  return row?.value ?? 0;
}

export async function getOrbitBySavedTenant(
  ownerTenantId: string,
  savedTenantId: string,
): Promise<Orbit | null> {
  const row = await db.query.orbit.findFirst({
    where: and(
      eq(orbit.ownerTenantId, ownerTenantId),
      eq(orbit.savedTenantId, savedTenantId),
    ),
  });
  return row ?? null;
}

export async function addOrbit(
  ownerTenantId: string,
  savedTenantId: string,
  preferredPage: OrbitPage = "gallery",
): Promise<Orbit> {
  if (ownerTenantId === savedTenantId) {
    throw new Error("You can't add your own shelf to your orbit.");
  }

  const saved = await db.query.tenant.findFirst({
    where: eq(tenant.id, savedTenantId),
  });
  if (!saved) {
    throw new Error("That shelf wasn't found.");
  }

  const [created] = await db
    .insert(orbit)
    .values({
      ownerTenantId,
      savedTenantId,
      preferredPage,
    })
    .returning();

  return created;
}

export async function removeOrbit(
  ownerTenantId: string,
  orbitId: string,
): Promise<boolean> {
  const removed = await db
    .delete(orbit)
    .where(and(eq(orbit.id, orbitId), eq(orbit.ownerTenantId, ownerTenantId)))
    .returning({ id: orbit.id });
  return removed.length > 0;
}

export async function removeOrbitBySavedTenant(
  ownerTenantId: string,
  savedTenantId: string,
): Promise<boolean> {
  const removed = await db
    .delete(orbit)
    .where(
      and(
        eq(orbit.ownerTenantId, ownerTenantId),
        eq(orbit.savedTenantId, savedTenantId),
      ),
    )
    .returning({ id: orbit.id });
  return removed.length > 0;
}

export type UpdateOrbitInput = {
  label?: string | null;
  preferredPage?: OrbitPage;
};

export async function updateOrbit(
  ownerTenantId: string,
  orbitId: string,
  input: UpdateOrbitInput,
): Promise<Orbit | null> {
  const patch: {
    label?: string | null;
    preferredPage?: OrbitPage;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if ("label" in input) {
    const trimmed = input.label?.trim() ?? "";
    patch.label = trimmed.length > 0 ? trimmed : null;
  }
  if (input.preferredPage) {
    patch.preferredPage = input.preferredPage;
  }

  const [updated] = await db
    .update(orbit)
    .set(patch)
    .where(and(eq(orbit.id, orbitId), eq(orbit.ownerTenantId, ownerTenantId)))
    .returning();

  return updated ?? null;
}
