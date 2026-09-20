import { createHmac, timingSafeEqual } from "node:crypto";

export type PublicPageKey = "hub" | "gallery" | "tree";

const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function requireSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }
  return secret;
}

export function unlockCookieName(
  tenantId: string,
  page: PublicPageKey,
): string {
  return `unlock_${tenantId}_${page}`;
}

function signPayload(payload: string): string {
  return createHmac("sha256", requireSecret())
    .update(payload)
    .digest("base64url");
}

export function createUnlockCookieValue(
  tenantId: string,
  page: PublicPageKey,
  now = Date.now(),
): { name: string; value: string; maxAge: number } {
  const exp = Math.floor(now / 1000) + COOKIE_TTL_SECONDS;
  const payload = `${tenantId}:${page}:${exp}`;
  const value = `${exp}.${signPayload(payload)}`;

  return {
    name: unlockCookieName(tenantId, page),
    value,
    maxAge: COOKIE_TTL_SECONDS,
  };
}

export function isValidUnlockCookieValue(
  tenantId: string,
  page: PublicPageKey,
  cookieValue: string | undefined,
  now = Date.now(),
): boolean {
  if (!cookieValue) {
    return false;
  }

  const [expRaw, signature] = cookieValue.split(".");
  if (!expRaw || !signature) {
    return false;
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < now) {
    return false;
  }

  const payload = `${tenantId}:${page}:${exp}`;
  const expected = signPayload(payload);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function publicPageFromPath(
  pathname: string,
  slug: string,
): PublicPageKey | null {
  const base = `/t/${slug}`;
  if (pathname === base || pathname === `${base}/`) {
    return "hub";
  }
  if (pathname === `${base}/gallery` || pathname.startsWith(`${base}/gallery/`)) {
    return "gallery";
  }
  if (pathname === `${base}/tree` || pathname.startsWith(`${base}/tree/`)) {
    return "tree";
  }
  return null;
}

export function isSafeNextPath(next: string, slug: string): boolean {
  if (!next.startsWith(`/t/${slug}`)) {
    return false;
  }
  if (next.includes("://") || next.includes("\\") || next.includes("//")) {
    return false;
  }
  return publicPageFromPath(next.split("?")[0] ?? next, slug) !== null;
}
