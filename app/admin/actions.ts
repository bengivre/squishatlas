"use server";

import { createLocalAccountIssuer } from "@better-auth/core/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { account, user } from "@/db/schema/auth";
import {
  tenant,
  tenantInvite,
  tenantSettings,
} from "@/db/schema/tenant";
import {
  listEnrichedTenantsForAdmin,
  type AdminTenantRow,
} from "@/lib/admin/platform-stats";
import {
  buildInviteUrl,
  createInviteToken,
  createTemporaryPassword,
  inviteExpiresAt,
  isValidEmail,
  isValidSlug,
  normalizeEmail,
  normalizeSlug,
} from "@/lib/admin/tenant-utils";
import { requireSuperadmin } from "@/lib/admin/require-superadmin";
import { sendTenantInviteEmail } from "@/lib/email/send-invite-email";

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type AdminActionResultWithSecret =
  | ({ ok: true; message: string } & (
      | { inviteUrl: string }
      | { temporaryPassword: string }
    ))
  | { ok: false; message: string };

export type { AdminTenantRow };

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/tenants");
  revalidatePath("/admin/users");
}

export async function createTenantAction(formData: FormData): Promise<AdminActionResult> {
  await requireSuperadmin();

  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!isValidSlug(slug)) {
    return {
      ok: false,
      message: "Slug must be 2–48 characters, lowercase letters, numbers, and hyphens only.",
    };
  }

  if (!displayName) {
    return {
      ok: false,
      message: "Display name is required — add one to continue.",
    };
  }

  const existing = await db.query.tenant.findFirst({
    where: eq(tenant.slug, slug),
  });

  if (existing) {
    return {
      ok: false,
      message: "That slug is already taken — pick a different one.",
    };
  }

  const [created] = await db
    .insert(tenant)
    .values({ slug, displayName })
    .returning({ id: tenant.id });

  await db.insert(tenantSettings).values({ tenantId: created.id });

  revalidateAdmin();
  return { ok: true, message: `Tenant “${displayName}” created.` };
}

export async function inviteOwnerAction(formData: FormData): Promise<AdminActionResultWithSecret> {
  await requireSuperadmin();

  const tenantId = String(formData.get("tenantId") ?? "");
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!tenantId) {
    return {
      ok: false,
      message: "Pick a tenant before continuing.",
    };
  }

  if (!isValidEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const row = await db.query.tenant.findFirst({
    where: eq(tenant.id, tenantId),
    with: {
      memberships: true,
      invites: {
        where: and(isNull(tenantInvite.usedAt), gt(tenantInvite.expiresAt, new Date())),
      },
    },
  });

  if (!row) {
    return {
      ok: false,
      message: "That tenant wasn't found — refresh and try again.",
    };
  }

  if (row.memberships.length > 0) {
    return {
      ok: false,
      message: "This tenant already has an owner — invite someone else elsewhere.",
    };
  }

  if (row.invites.length > 0) {
    return {
      ok: false,
      message:
        "This tenant already has a pending invite — reset it or wait for it to expire.",
    };
  }

  const token = createInviteToken();
  const inviteUrl = buildInviteUrl(token);

  const [createdInvite] = await db
    .insert(tenantInvite)
    .values({
      tenantId,
      email,
      token,
      expiresAt: inviteExpiresAt(),
    })
    .returning({ id: tenantInvite.id });

  try {
    await sendTenantInviteEmail({
      to: email,
      inviteUrl,
      tenantDisplayName: row.displayName,
    });
  } catch (error) {
    await db.delete(tenantInvite).where(eq(tenantInvite.id, createdInvite.id));

    const detail =
      error instanceof Error ? error.message : "email didn't send";
    return {
      ok: false,
      message: `Invite email didn't send — ${detail}. Try again.`,
    };
  }

  revalidateAdmin();
  return {
    ok: true,
    message: `Invite sent to ${email}.`,
    inviteUrl,
  };
}

export async function resetOwnerPasswordAction(
  formData: FormData,
): Promise<AdminActionResultWithSecret> {
  await requireSuperadmin();

  const tenantId = String(formData.get("tenantId") ?? "");

  if (!tenantId) {
    return {
      ok: false,
      message: "Pick a tenant before continuing.",
    };
  }

  const row = await db.query.tenant.findFirst({
    where: eq(tenant.id, tenantId),
    with: {
      memberships: {
        with: {
          user: {
            with: {
              accounts: true,
            },
          },
        },
      },
    },
  });

  if (!row) {
    return {
      ok: false,
      message: "That tenant wasn't found — refresh and try again.",
    };
  }

  const ownerMembership = row.memberships[0];
  if (!ownerMembership?.user) {
    return {
      ok: false,
      message: "This tenant has no owner yet — invite one first.",
    };
  }

  const credentialIssuer = createLocalAccountIssuer("credential");
  const credentialAccount = ownerMembership.user.accounts.find(
    (entry) =>
      entry.providerId === "credential" &&
      entry.issuer === credentialIssuer &&
      entry.accountId === ownerMembership.user.id,
  );

  if (!credentialAccount) {
    return {
      ok: false,
      message:
        "Owner account has no password credentials — set one up another way.",
    };
  }

  const temporaryPassword = createTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  await db
    .update(account)
    .set({ password: passwordHash })
    .where(eq(account.id, credentialAccount.id));

  await db
    .update(user)
    .set({ mustChangePassword: true })
    .where(eq(user.id, ownerMembership.user.id));

  revalidateAdmin();
  return {
    ok: true,
    message: `Temporary password set for ${ownerMembership.user.email}. They must change it on next login.`,
    temporaryPassword,
  };
}

export async function deleteTenantAction(formData: FormData): Promise<AdminActionResult> {
  await requireSuperadmin();

  const tenantId = String(formData.get("tenantId") ?? "");

  if (!tenantId) {
    return {
      ok: false,
      message: "Pick a tenant before continuing.",
    };
  }

  const row = await db.query.tenant.findFirst({
    where: eq(tenant.id, tenantId),
  });

  if (!row) {
    return {
      ok: false,
      message: "That tenant wasn't found — refresh and try again.",
    };
  }

  await db.delete(tenant).where(eq(tenant.id, tenantId));

  revalidateAdmin();
  return { ok: true, message: `Tenant “${row.displayName}” deleted.` };
}

export async function listTenantsForAdmin() {
  await requireSuperadmin();
  return listEnrichedTenantsForAdmin();
}
