"use server";

import { createLocalAccountIssuer } from "@better-auth/core/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { account, user } from "@/db/schema/auth";
import {
  listUsersForAdmin,
  type AdminUserRow,
} from "@/lib/admin/platform-stats";
import { createTemporaryPassword } from "@/lib/admin/tenant-utils";
import { requireSuperadmin } from "@/lib/admin/require-superadmin";

export type AdminUserActionResult =
  | { ok: true; message: string; temporaryPassword: string }
  | { ok: false; message: string };

export type { AdminUserRow };

export async function listUsersForAdminAction() {
  await requireSuperadmin();
  return listUsersForAdmin();
}

export async function resetUserPasswordAction(
  formData: FormData,
): Promise<AdminUserActionResult> {
  const session = await requireSuperadmin();

  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return { ok: false, message: "Pick a user before continuing." };
  }

  if (userId === session.user.id) {
    return {
      ok: false,
      message: "You can't reset your own password from here — use Change password instead.",
    };
  }

  const target = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      accounts: true,
    },
  });

  if (!target) {
    return {
      ok: false,
      message: "That user wasn't found — refresh and try again.",
    };
  }

  const credentialIssuer = createLocalAccountIssuer("credential");
  const credentialAccount = target.accounts.find(
    (entry) =>
      entry.providerId === "credential" &&
      entry.issuer === credentialIssuer &&
      entry.accountId === target.id,
  );

  if (!credentialAccount) {
    return {
      ok: false,
      message:
        "This account has no password credentials — set one up another way.",
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
    .where(eq(user.id, target.id));

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/tenants");

  return {
    ok: true,
    message: `Temporary password set for ${target.email}. They must change it on next login.`,
    temporaryPassword,
  };
}
