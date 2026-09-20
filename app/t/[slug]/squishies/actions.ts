"use server";

import { revalidatePath } from "next/cache";

import {
  createSquish,
  deleteSquish,
  updateSquish,
} from "@/lib/dal";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

export type SquishActionResult =
  | { ok: true; squishId?: string; message?: string }
  | { ok: false; message: string };

function parseSquishFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const storyRaw = String(formData.get("story") ?? "").trim();
  const adoptedAtRaw = String(formData.get("adopted_at") ?? "").trim();
  const isFavorite =
    formData.get("is_favorite") === "on" ||
    formData.get("is_favorite") === "true";

  return {
    name,
    story: storyRaw || null,
    adoptedAt: adoptedAtRaw || null,
    isFavorite,
  };
}

function squishiesPath(slug: string) {
  return `/t/${slug}/squishies`;
}

export async function createSquishAction(
  slug: string,
  formData: FormData,
): Promise<SquishActionResult> {
  const { tenant } = await requireTenantMember(slug);
  const fields = parseSquishFields(formData);

  if (!fields.name) {
    return { ok: false, message: "Name is required — add one to continue." };
  }

  const created = await createSquish(tenant.id, fields);

  revalidatePath(squishiesPath(slug));
  revalidatePath(`${squishiesPath(slug)}/${created.id}`);

  return {
    ok: true,
    squishId: created.id,
    message: "Squish added.",
  };
}

export async function updateSquishAction(
  slug: string,
  squishId: string,
  formData: FormData,
): Promise<SquishActionResult> {
  const { tenant } = await requireTenantMember(slug);
  const fields = parseSquishFields(formData);

  if (!fields.name) {
    return { ok: false, message: "Name is required — add one to continue." };
  }

  const updated = await updateSquish(tenant.id, squishId, fields);

  if (!updated) {
    return {
      ok: false,
      message: "That squish wasn't found — go back and try again.",
    };
  }

  revalidatePath(squishiesPath(slug));
  revalidatePath(`${squishiesPath(slug)}/${squishId}`);

  return { ok: true, squishId, message: "Changes saved." };
}

export async function deleteSquishAction(
  slug: string,
  squishId: string,
): Promise<SquishActionResult> {
  const { tenant } = await requireTenantMember(slug);

  const removed = await deleteSquish(tenant.id, squishId);

  if (!removed) {
    return {
      ok: false,
      message: "That squish wasn't found — go back and try again.",
    };
  }

  revalidatePath(squishiesPath(slug));

  return { ok: true, message: "Squish deleted." };
}
