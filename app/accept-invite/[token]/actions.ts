"use server";

import { generateId } from "@better-auth/core/utils/id";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "@/db";
import { account, user } from "@/db/schema/auth";
import { membership, tenantInvite } from "@/db/schema/tenant";
import {
  getInviteByToken,
  getInviteValidationError,
} from "@/lib/invites/validate-invite";

export type AcceptInviteResult =
  | { ok: true; email: string; tenantSlug: string }
  | { ok: false; message: string };

function defaultOwnerName(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  return localPart || "Owner";
}

export async function acceptInviteAction(
  token: string,
  formData: FormData,
): Promise<AcceptInviteResult> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return {
      ok: false,
      message: "Password needs at least 8 characters — try a longer one.",
    };
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      message: "Those passwords don't match — enter the same one twice.",
    };
  }

  const invite = await getInviteByToken(token);
  const validationError = getInviteValidationError(invite);

  if (validationError || !invite) {
    return {
      ok: false,
      message: validationError ?? "This invite link is invalid — request a new one.",
    };
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, invite.email),
  });

  if (existingUser) {
    return {
      ok: false,
      message: "An account already exists for this email — sign in instead.",
    };
  }

  const passwordHash = await hashPassword(password);
  const userId = generateId();
  const accountId = generateId();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      const currentInvite = await tx.query.tenantInvite.findFirst({
        where: eq(tenantInvite.token, token),
        with: { tenant: true },
      });

      const currentError = getInviteValidationError(currentInvite);

      if (currentError || !currentInvite) {
        throw new Error(currentError ?? "This invite link is invalid.");
      }

      await tx.insert(user).values({
        id: userId,
        name: defaultOwnerName(currentInvite.email),
        email: currentInvite.email,
        emailVerified: true,
      });

      await tx.insert(account).values({
        id: accountId,
        userId,
        accountId: userId,
        providerId: "credential",
        issuer: createLocalAccountIssuer("credential"),
        password: passwordHash,
      });

      await tx.insert(membership).values({
        tenantId: currentInvite.tenantId,
        userId,
      });

      await tx
        .update(tenantInvite)
        .set({ usedAt: now })
        .where(eq(tenantInvite.id, currentInvite.id));
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invite didn't go through — try again.";
    return { ok: false, message };
  }

  return {
    ok: true,
    email: invite.email,
    tenantSlug: invite.tenant.slug,
  };
}
