"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenant } from "@/db/schema/tenant";
import type { OrbitPage } from "@/db/schema/orbit";
import {
  addOrbit,
  getOrbitBySavedTenant,
  isOrbitPage,
  removeOrbit,
  removeOrbitBySavedTenant,
  updateOrbit,
} from "@/lib/dal";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

export type OrbitActionResult =
  | { ok: true; message?: string; inOrbit?: boolean }
  | { ok: false; message: string };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function revalidateOrbit(ownerSlug: string, savedSlug?: string) {
  revalidatePath(`/t/${ownerSlug}/orbit`);
  revalidatePath(`/t/${ownerSlug}/dashboard`);
  if (savedSlug) {
    revalidatePath(`/t/${savedSlug}`);
    revalidatePath(`/t/${savedSlug}/gallery`);
    revalidatePath(`/t/${savedSlug}/tree`);
  }
}

async function resolveSavedTenant(savedSlug: string) {
  return db.query.tenant.findFirst({
    where: eq(tenant.slug, savedSlug),
  });
}

/**
 * Toggle orbit from a public page. `ownerSlug` is the viewer's own shelf;
 * `savedSlug` is the public shelf being viewed.
 */
export async function toggleOrbitAction(
  ownerSlug: string,
  savedSlug: string,
  preferredPage: string = "gallery",
): Promise<OrbitActionResult> {
  const { tenant: owner } = await requireTenantMember(ownerSlug);

  const saved = await resolveSavedTenant(savedSlug);
  if (!saved) {
    return { ok: false, message: "That shelf wasn't found." };
  }

  if (owner.id === saved.id) {
    return { ok: false, message: "You can't add your own shelf to your orbit." };
  }

  const page: OrbitPage = isOrbitPage(preferredPage) ? preferredPage : "gallery";

  try {
    const existing = await getOrbitBySavedTenant(owner.id, saved.id);
    if (existing) {
      await removeOrbitBySavedTenant(owner.id, saved.id);
      revalidateOrbit(ownerSlug, savedSlug);
      return { ok: true, message: "Removed from your orbit.", inOrbit: false };
    }

    await addOrbit(owner.id, saved.id, page);
    revalidateOrbit(ownerSlug, savedSlug);
    return { ok: true, message: "Added to your orbit!", inOrbit: true };
  } catch (error) {
    const message = errorMessage(error, "Couldn't update your orbit — try again.");
    if (message.includes("unique") || message.includes("duplicate")) {
      return { ok: false, message: "That shelf is already in your orbit." };
    }
    return { ok: false, message };
  }
}

export async function removeOrbitAction(
  ownerSlug: string,
  orbitId: string,
): Promise<OrbitActionResult> {
  const { tenant: owner } = await requireTenantMember(ownerSlug);

  const removed = await removeOrbit(owner.id, orbitId);
  if (!removed) {
    return {
      ok: false,
      message: "That shelf wasn't in your orbit — refresh and try again.",
    };
  }

  revalidateOrbit(ownerSlug);
  return { ok: true, message: "Removed from your orbit." };
}

export async function updateOrbitAction(
  ownerSlug: string,
  orbitId: string,
  formData: FormData,
): Promise<OrbitActionResult> {
  const { tenant: owner } = await requireTenantMember(ownerSlug);

  const labelRaw = formData.get("label");
  const pageRaw = String(formData.get("preferredPage") ?? "");

  if (pageRaw && !isOrbitPage(pageRaw)) {
    return { ok: false, message: "Pick hub, gallery, or family tree." };
  }

  const updated = await updateOrbit(owner.id, orbitId, {
    label: typeof labelRaw === "string" ? labelRaw : undefined,
    preferredPage: isOrbitPage(pageRaw) ? pageRaw : undefined,
  });

  if (!updated) {
    return {
      ok: false,
      message: "That entry wasn't found — refresh and try again.",
    };
  }

  revalidateOrbit(ownerSlug);
  return { ok: true, message: "Saved." };
}
