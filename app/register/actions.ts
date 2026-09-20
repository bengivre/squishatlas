"use server";

import { generateId } from "@better-auth/core/utils/id";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { headers } from "next/headers";

import { db } from "@/db";
import { account, user } from "@/db/schema/auth";
import { membership, tenant, tenantSettings } from "@/db/schema/tenant";
import { auth } from "@/lib/auth";
import {
  isValidEmail,
  isValidSlug,
  normalizeEmail,
  normalizeSlug,
} from "@/lib/admin/tenant-utils";

export type RegisterResult =
  | { ok: true }
  | { ok: false; message: string };

export async function registerAction(
  formData: FormData,
): Promise<RegisterResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));

  if (!name) {
    return { ok: false, message: "Add your name to continue." };
  }

  if (!isValidEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

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

  if (!displayName) {
    return {
      ok: false,
      message: "Add a shelf name — this is what you'll see in the app.",
    };
  }

  if (!isValidSlug(slug)) {
    return {
      ok: false,
      message:
        "Public address must be 2–48 characters, lowercase letters, numbers, and hyphens only.",
    };
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existingUser) {
    return {
      ok: false,
      message: "An account already exists for this email — sign in instead.",
    };
  }

  const existingTenant = await db.query.tenant.findFirst({
    where: eq(tenant.slug, slug),
  });

  if (existingTenant) {
    return {
      ok: false,
      message: "That public address is already taken — pick a different one.",
    };
  }

  const passwordHash = await hashPassword(password);
  const userId = generateId();
  const accountId = generateId();

  try {
    await db.transaction(async (tx) => {
      const [createdTenant] = await tx
        .insert(tenant)
        .values({ slug, displayName })
        .returning({ id: tenant.id });

      await tx.insert(tenantSettings).values({ tenantId: createdTenant.id });

      await tx.insert(user).values({
        id: userId,
        name,
        email,
        emailVerified: false,
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
        tenantId: createdTenant.id,
        userId,
      });
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration didn't go through.";

    if (
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("Unique")
    ) {
      return {
        ok: false,
        message:
          "That email or public address was just taken — try again with different details.",
      };
    }

    return {
      ok: false,
      message: "Registration didn't go through — try again.",
    };
  }

  const baseURL = process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "";
  const callbackURL = `${baseURL}/login`;

  try {
    await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL,
      },
      headers: await headers(),
    });
  } catch {
    return {
      ok: false,
      message:
        "Your account was created, but the verification email didn't send. Try signing in to get a new link.",
    };
  }

  return { ok: true };
}
