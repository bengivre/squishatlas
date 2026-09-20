import "dotenv/config";

import { generateId } from "@better-auth/core/utils/id";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { parseSetCookieHeader } from "better-auth/cookies/utils";

import { db } from "../db";
import { account, user } from "../db/schema/auth";
import { auth } from "../lib/auth";

const TEST_EMAIL = "auth-verify@example.com";
const TEST_PASSWORD = "verify-test-password-123";

async function seedTestUser() {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, TEST_EMAIL),
  });

  if (existing) {
    await db.delete(account).where(eq(account.userId, existing.id));
    await db.delete(user).where(eq(user.id, existing.id));
  }

  const userId = generateId();
  const accountId = generateId();
  const passwordHash = await hashPassword(TEST_PASSWORD);

  await db.insert(user).values({
    id: userId,
    name: "Auth Verify",
    email: TEST_EMAIL,
    emailVerified: true,
  });

  await db.insert(account).values({
    id: accountId,
    userId,
    accountId: userId,
    providerId: "credential",
    issuer: createLocalAccountIssuer("credential"),
    password: passwordHash,
  });

  return userId;
}

async function main() {
  await seedTestUser();

  const result = await auth.api.signInEmail({
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
    asResponse: true,
  });

  if (!result.ok) {
    const body = await result.text();
    throw new Error(`Sign-in failed (${result.status}): ${body}`);
  }

  const setCookie = result.headers.get("set-cookie");
  if (!setCookie?.includes("better-auth.session_token")) {
    throw new Error(
      `Expected session cookie in response, got: ${setCookie ?? "(none)"}`,
    );
  }

  const signedCookie = parseSetCookieHeader(setCookie).get(
    "better-auth.session_token",
  )?.value;
  if (!signedCookie) {
    throw new Error("Could not parse session cookie from Set-Cookie header");
  }

  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: `better-auth.session_token=${signedCookie}`,
    }),
  });

  if (!session?.user?.email) {
    throw new Error("Session missing after sign-in");
  }

  console.log("Auth OK:", {
    email: session.user.email,
    sessionCookie: setCookie.split(";")[0],
  });
}

main().catch((error: unknown) => {
  console.error("Auth verification failed:", error);
  process.exit(1);
});
