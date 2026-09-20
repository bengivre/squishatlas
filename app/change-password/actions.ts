"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { auth } from "@/lib/auth";

export async function clearMustChangePassword() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Not signed in");
  }

  await db
    .update(user)
    .set({ mustChangePassword: false })
    .where(eq(user.id, session.user.id));

  redirect("/admin");
}
