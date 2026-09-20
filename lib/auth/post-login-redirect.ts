"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { membership } from "@/db/schema/tenant";
import { auth } from "@/lib/auth";

export async function getPostLoginRedirect(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return "/login";
  }

  if ("isSuperadmin" in session.user && session.user.isSuperadmin) {
    return "/admin";
  }

  const member = await db.query.membership.findFirst({
    where: eq(membership.userId, session.user.id),
    with: { tenant: true },
  });

  if (member?.tenant) {
    return `/t/${member.tenant.slug}/gallery`;
  }

  return "/";
}
