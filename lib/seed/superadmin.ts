import { generateId } from "@better-auth/core/utils/id";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "@/db";
import { account, user } from "@/db/schema/auth";

export type SeedSuperadminResult =
  | { status: "skipped"; reason: "superadmin_exists" }
  | { status: "created"; email: string }
  | { status: "skipped"; reason: "env_not_configured" };

export async function seedSuperadmin(): Promise<SeedSuperadminResult> {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_INITIAL_PASSWORD;

  if (!email || !password) {
    return { status: "skipped", reason: "env_not_configured" };
  }

  const existingSuperadmin = await db.query.user.findFirst({
    where: eq(user.isSuperadmin, true),
  });

  if (existingSuperadmin) {
    return { status: "skipped", reason: "superadmin_exists" };
  }

  const passwordHash = await hashPassword(password);
  const userId = generateId();
  const accountId = generateId();

  await db.insert(user).values({
    id: userId,
    name: "Superadmin",
    email,
    emailVerified: true,
    isSuperadmin: true,
    mustChangePassword: true,
  });

  await db.insert(account).values({
    id: accountId,
    userId,
    accountId: userId,
    providerId: "credential",
    issuer: createLocalAccountIssuer("credential"),
    password: passwordHash,
  });

  return { status: "created", email };
}
