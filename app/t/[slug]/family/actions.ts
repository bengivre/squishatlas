"use server";

import { revalidatePath } from "next/cache";

import {
  RELATIONSHIP_TYPES,
  relationshipEdgeClass,
  type RelationshipType,
} from "@/db/schema/relationship";
import {
  adoptFamilyAcrossLink,
  createFamily,
  createRelationshipPair,
  deleteFamily,
  deleteRelationshipPair,
  isFamilyColor,
  setSquishFamily,
  updateFamily,
} from "@/lib/dal";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

export type FamilyActionResult =
  { ok: true; message?: string; id?: string } | { ok: false; message: string };

function familyPaths(slug: string) {
  return [`/t/${slug}/family`, `/t/${slug}/tree`, `/t/${slug}/squishies`];
}

function revalidate(slug: string) {
  for (const path of familyPaths(slug)) {
    revalidatePath(path);
  }
}

function isRelationshipType(value: string): value is RelationshipType {
  return (RELATIONSHIP_TYPES as readonly string[]).includes(value);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function createRelationshipAction(
  slug: string,
  fromSquishId: string,
  toSquishId: string,
  forwardType: string,
  inverseType: string,
): Promise<FamilyActionResult> {
  const { tenant } = await requireTenantMember(slug);

  if (!isRelationshipType(forwardType) || !isRelationshipType(inverseType)) {
    return {
      ok: false,
      message: "That relationship type isn't valid — pick one from the list.",
    };
  }

  try {
    await createRelationshipPair(
      tenant.id,
      fromSquishId,
      toSquishId,
      forwardType,
      inverseType,
    );
    if (relationshipEdgeClass(forwardType) === "family") {
      await adoptFamilyAcrossLink(tenant.id, fromSquishId, toSquishId);
    }
  } catch (error) {
    const message = errorMessage(error, "Relationship didn't add — try again.");
    if (message.includes("unique") || message.includes("duplicate")) {
      return {
        ok: false,
        message:
          "Those two are already linked — remove the old link first to change it.",
      };
    }
    return { ok: false, message };
  }

  revalidate(slug);
  return { ok: true, message: "Linked!" };
}

export async function deleteRelationshipAction(
  slug: string,
  pairId: string,
): Promise<FamilyActionResult> {
  const { tenant } = await requireTenantMember(slug);

  const removed = await deleteRelationshipPair(tenant.id, pairId);
  if (!removed) {
    return {
      ok: false,
      message: "That link wasn't found — refresh and try again.",
    };
  }

  revalidate(slug);
  return { ok: true, message: "Link removed." };
}

export async function createFamilyAction(
  slug: string,
  input: { name: string; emoji?: string; color?: string },
  memberIds: string[],
): Promise<FamilyActionResult> {
  const { tenant } = await requireTenantMember(slug);
  const color =
    input.color && isFamilyColor(input.color) ? input.color : undefined;

  try {
    const created = await createFamily(
      tenant.id,
      { name: input.name, emoji: input.emoji, color },
      memberIds,
    );
    revalidate(slug);
    return { ok: true, id: created.id, message: "Family created." };
  } catch (error) {
    return {
      ok: false,
      message: errorMessage(error, "Couldn't create the family."),
    };
  }
}

export async function updateFamilyAction(
  slug: string,
  familyId: string,
  input: { name?: string; emoji?: string; color?: string },
): Promise<FamilyActionResult> {
  const { tenant } = await requireTenantMember(slug);
  const color =
    input.color !== undefined && isFamilyColor(input.color)
      ? input.color
      : undefined;

  try {
    const updated = await updateFamily(tenant.id, familyId, {
      name: input.name,
      emoji: input.emoji,
      color,
    });
    if (!updated) {
      return { ok: false, message: "That family wasn't found." };
    }
    revalidate(slug);
    return { ok: true, message: "Family updated." };
  } catch (error) {
    return {
      ok: false,
      message: errorMessage(error, "Couldn't update the family."),
    };
  }
}

export async function deleteFamilyAction(
  slug: string,
  familyId: string,
): Promise<FamilyActionResult> {
  const { tenant } = await requireTenantMember(slug);
  const removed = await deleteFamily(tenant.id, familyId);
  if (!removed) {
    return { ok: false, message: "That family wasn't found." };
  }
  revalidate(slug);
  return {
    ok: true,
    message: "Family removed — its squishies are solo stars again.",
  };
}

export async function moveToFamilyAction(
  slug: string,
  squishIds: string[],
  familyId: string | null,
): Promise<FamilyActionResult> {
  const { tenant } = await requireTenantMember(slug);
  try {
    await setSquishFamily(tenant.id, squishIds, familyId);
    revalidate(slug);
    return { ok: true, message: familyId ? "Moved in." : "Now a solo star." };
  } catch (error) {
    return { ok: false, message: errorMessage(error, "Couldn't move them.") };
  }
}
