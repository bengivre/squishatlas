import "dotenv/config";

import { eq, sql } from "drizzle-orm";
import { parseSetCookieHeader } from "better-auth/cookies/utils";

import { db } from "../db";
import { user } from "../db/schema/auth";
import { auth } from "../lib/auth";
import { seedSuperadmin } from "../lib/seed/superadmin";

async function countSuperadmins(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(eq(user.isSuperadmin, true));
  return result[0]?.count ?? 0;
}

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_INITIAL_PASSWORD;

  if (!email || !password) {
    throw new Error("SUPERADMIN_EMAIL and SUPERADMIN_INITIAL_PASSWORD must be set");
  }

  const first = await seedSuperadmin();
  const second = await seedSuperadmin();
  const superadminCount = await countSuperadmins();

  if (superadminCount !== 1) {
    throw new Error(`Expected exactly 1 superadmin, found ${superadminCount}`);
  }

  if (first.status !== "created" && first.status !== "skipped") {
    throw new Error(`Unexpected first seed result: ${JSON.stringify(first)}`);
  }

  if (second.status !== "skipped" || second.reason !== "superadmin_exists") {
    throw new Error(`Second seed should skip: ${JSON.stringify(second)}`);
  }

  const signIn = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });

  if (!signIn.ok) {
    throw new Error(`Superadmin sign-in failed (${signIn.status})`);
  }

  const setCookie = signIn.headers.get("set-cookie");
  const signedCookie = parseSetCookieHeader(setCookie ?? "").get(
    "better-auth.session_token",
  )?.value;

  if (!signedCookie) {
    throw new Error("Missing session cookie after superadmin sign-in");
  }

  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: `better-auth.session_token=${signedCookie}`,
    }),
  });

  if (!session?.user?.isSuperadmin) {
    throw new Error("Session user is not marked superadmin");
  }

  if (!session.user.mustChangePassword) {
    throw new Error("Seeded superadmin should require password change");
  }

  console.log("Superadmin seed OK:", {
    email,
    firstSeed: first.status,
    secondSeed: second.reason,
    superadminCount,
    mustChangePassword: session.user.mustChangePassword,
  });
}

main().catch((error: unknown) => {
  console.error("Superadmin seed verification failed:", error);
  process.exit(1);
});
