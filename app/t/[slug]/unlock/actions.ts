"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenant, tenantSettings } from "@/db/schema/tenant";
import { verifyPagePassword } from "@/lib/public/page-password";
import { checkUnlockRateLimit } from "@/lib/public/rate-limit";
import {
  createUnlockCookieValue,
  isSafeNextPath,
  publicPageFromPath,
  type PublicPageKey,
} from "@/lib/public/unlock-cookie";

export type UnlockActionResult =
  | { ok: true }
  | { ok: false; message: string };

function passwordHashForPage(
  settings: typeof tenantSettings.$inferSelect,
  page: PublicPageKey,
): string | null {
  switch (page) {
    case "hub":
      return settings.hubPasswordHash;
    case "gallery":
      return settings.galleryPasswordHash;
    case "tree":
      return settings.treePasswordHash;
  }
}

function clientIp(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headerStore.get("x-real-ip") ?? "unknown";
}

export async function unlockPublicPageAction(
  slug: string,
  formData: FormData,
): Promise<UnlockActionResult> {
  const headerStore = await headers();
  const rate = checkUnlockRateLimit(clientIp(headerStore));
  if (!rate.allowed) {
    return {
      ok: false,
      message: `Too many attempts. Try again in about ${Math.ceil(rate.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? `/t/${slug}`);
  const next = isSafeNextPath(nextRaw, slug) ? nextRaw : `/t/${slug}`;
  const page = publicPageFromPath(next.split("?")[0] ?? next, slug);

  if (!page) {
    return {
      ok: false,
      message: "That page can't be unlocked — check the link and try again.",
    };
  }

  const tenantRow = await db.query.tenant.findFirst({
    where: eq(tenant.slug, slug),
  });
  if (!tenantRow) {
    return {
      ok: false,
      message: "That collection wasn't found — check the link and try again.",
    };
  }

  const settings = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.tenantId, tenantRow.id),
  });
  if (!settings) {
    return {
      ok: false,
      message: "That collection wasn't found — check the link and try again.",
    };
  }

  const hash = passwordHashForPage(settings, page);
  if (!hash) {
    redirect(next);
  }

  const valid = await verifyPagePassword(password, hash);
  if (!valid) {
    return { ok: false, message: "That password didn’t work. Try again." };
  }

  const cookie = createUnlockCookieValue(tenantRow.id, page);
  const jar = await cookies();
  jar.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookie.maxAge,
  });

  redirect(next);
}
