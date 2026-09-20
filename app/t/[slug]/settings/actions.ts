"use server";

import { revalidatePath } from "next/cache";

import { updateTenantSettings } from "@/lib/dal";
import { hashPagePassword, sealPagePassword } from "@/lib/public/page-password";
import type { PublicPageKey } from "@/lib/public/unlock-cookie";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

export type SettingsActionResult =
  { ok: true; message?: string } | { ok: false; message: string };

const PAGE_LABEL: Record<PublicPageKey, string> = {
  hub: "Hub",
  gallery: "Gallery",
  tree: "Family tree",
};

function boolFromForm(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

type PasswordUpdate = {
  hash: string | null;
  reveal: string | null;
};

async function resolvePasswordUpdate(
  formData: FormData,
  passwordKey: string,
  clearKey: string,
  hadRevealKey: string,
): Promise<PasswordUpdate | undefined> {
  if (boolFromForm(formData, clearKey)) {
    return { hash: null, reveal: null };
  }

  const raw = String(formData.get(passwordKey) ?? "");
  if (!raw) {
    if (boolFromForm(formData, hadRevealKey)) {
      return { hash: null, reveal: null };
    }
    return undefined;
  }

  if (raw.length < 4) {
    throw new Error("Page passwords need at least 4 characters.");
  }

  return {
    hash: await hashPagePassword(raw),
    reveal: sealPagePassword(raw),
  };
}

function revalidateSettingsPaths(slug: string) {
  revalidatePath(`/t/${slug}/settings`);
  revalidatePath(`/t/${slug}`);
  revalidatePath(`/t/${slug}/gallery`);
  revalidatePath(`/t/${slug}/tree`);
}

function visibilityField(
  page: PublicPageKey,
): "hubEnabled" | "galleryEnabled" | "treeEnabled" {
  switch (page) {
    case "hub":
      return "hubEnabled";
    case "gallery":
      return "galleryEnabled";
    case "tree":
      return "treeEnabled";
  }
}

export async function updatePageVisibilityAction(
  slug: string,
  page: PublicPageKey,
  enabled: boolean,
): Promise<SettingsActionResult> {
  const { tenant } = await requireTenantMember(slug);

  try {
    await updateTenantSettings(tenant.id, {
      [visibilityField(page)]: enabled,
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Settings didn't save — try again.",
    };
  }

  revalidateSettingsPaths(slug);
  return { ok: true, message: `Configuration ${PAGE_LABEL[page]} saved.` };
}

export async function updatePagePasswordAction(
  slug: string,
  page: PublicPageKey,
  formData: FormData,
): Promise<SettingsActionResult> {
  const { tenant } = await requireTenantMember(slug);

  try {
    const password = await resolvePasswordUpdate(
      formData,
      `${page}_password`,
      `${page}_clear_password`,
      `${page}_had_reveal`,
    );

    if (password) {
      if (page === "hub") {
        await updateTenantSettings(tenant.id, {
          hubPasswordHash: password.hash,
          hubPasswordReveal: password.reveal,
        });
      } else if (page === "gallery") {
        await updateTenantSettings(tenant.id, {
          galleryPasswordHash: password.hash,
          galleryPasswordReveal: password.reveal,
        });
      } else {
        await updateTenantSettings(tenant.id, {
          treePasswordHash: password.hash,
          treePasswordReveal: password.reveal,
        });
      }
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Settings didn't save — try again.",
    };
  }

  revalidateSettingsPaths(slug);
  return { ok: true, message: `Configuration ${PAGE_LABEL[page]} saved.` };
}

export async function updateGeneralSettingsAction(
  slug: string,
  formData: FormData,
): Promise<SettingsActionResult> {
  const { tenant } = await requireTenantMember(slug);

  try {
    const hubIntro = String(formData.get("hub_intro") ?? "").trim();
    await updateTenantSettings(tenant.id, {
      hubIntro: hubIntro || null,
      allowIndexing: boolFromForm(formData, "allow_indexing"),
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Settings didn't save — try again.",
    };
  }

  revalidateSettingsPaths(slug);
  return { ok: true, message: "Configuration General saved." };
}
