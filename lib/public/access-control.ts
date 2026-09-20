import { and, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { membership, tenant, tenantSettings } from "@/db/schema/tenant";
import { auth } from "@/lib/auth";
import { getOrbitBySavedTenant } from "@/lib/dal";
import {
  isValidUnlockCookieValue,
  unlockCookieName,
  type PublicPageKey,
} from "@/lib/public/unlock-cookie";

export type ViewerOwnTenant = {
  id: string;
  slug: string;
  displayName: string;
};

export type PublicPageContext = {
  tenant: {
    id: string;
    slug: string;
    displayName: string;
  };
  settings: typeof tenantSettings.$inferSelect;
  isMember: boolean;
  /** Logged-in visitor's own shelf, when they have one and it isn't this page. */
  viewerOwnTenant: ViewerOwnTenant | null;
  /** Whether the viewer's shelf already has this tenant in orbit. */
  isInOrbit: boolean;
};

export type PublicPageAccessResult =
  | ({ kind: "ok" } & PublicPageContext)
  | {
      kind: "private";
      tenant: {
        id: string;
        slug: string;
        displayName: string;
      };
      page: PublicPageKey;
    };

function enabledFlag(
  settings: typeof tenantSettings.$inferSelect,
  page: PublicPageKey,
): boolean {
  switch (page) {
    case "hub":
      return settings.hubEnabled;
    case "gallery":
      return settings.galleryEnabled;
    case "tree":
      return settings.treeEnabled;
  }
}

function passwordHash(
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

async function resolveViewerOrbitContext(
  userId: string,
  viewedTenantId: string,
  isMember: boolean,
): Promise<{
  viewerOwnTenant: ViewerOwnTenant | null;
  isInOrbit: boolean;
}> {
  if (isMember) {
    return { viewerOwnTenant: null, isInOrbit: false };
  }

  const own = await db.query.membership.findFirst({
    where: eq(membership.userId, userId),
    with: { tenant: true },
  });

  if (!own?.tenant || own.tenant.id === viewedTenantId) {
    return { viewerOwnTenant: null, isInOrbit: false };
  }

  const viewerOwnTenant: ViewerOwnTenant = {
    id: own.tenant.id,
    slug: own.tenant.slug,
    displayName: own.tenant.displayName,
  };

  const existing = await getOrbitBySavedTenant(own.tenant.id, viewedTenantId);
  return {
    viewerOwnTenant,
    isInOrbit: Boolean(existing),
  };
}

/**
 * Access-control gate for public tenant pages (TASK-59).
 * Logged-in members bypass enabled/password checks; everyone else must
 * pass enabled + optional unlock cookie. Disabled pages return kind "private"
 * instead of a 404 so visitors see how to make the page public.
 */
export async function enforcePublicPageAccess(
  slug: string,
  page: PublicPageKey,
): Promise<PublicPageAccessResult> {
  const tenantRow = await db.query.tenant.findFirst({
    where: eq(tenant.slug, slug),
  });

  if (!tenantRow) {
    notFound();
  }

  const settings = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.tenantId, tenantRow.id),
  });

  if (!settings) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let isMember = false;
  if (session?.user) {
    const member = await db.query.membership.findFirst({
      where: and(
        eq(membership.tenantId, tenantRow.id),
        eq(membership.userId, session.user.id),
      ),
    });
    isMember = Boolean(member);
  }

  const tenantInfo = {
    id: tenantRow.id,
    slug: tenantRow.slug,
    displayName: tenantRow.displayName,
  };

  if (isMember) {
    return {
      kind: "ok",
      tenant: tenantInfo,
      settings,
      isMember: true,
      viewerOwnTenant: null,
      isInOrbit: false,
    };
  }

  if (!enabledFlag(settings, page)) {
    return {
      kind: "private",
      tenant: tenantInfo,
      page,
    };
  }

  const hash = passwordHash(settings, page);
  if (hash) {
    const jar = await cookies();
    const cookieValue = jar.get(unlockCookieName(tenantRow.id, page))?.value;
    if (!isValidUnlockCookieValue(tenantRow.id, page, cookieValue)) {
      const next = page === "hub" ? `/t/${slug}` : `/t/${slug}/${page}`;
      redirect(`/t/${slug}/unlock?next=${encodeURIComponent(next)}`);
    }
  }

  let viewerOwnTenant: ViewerOwnTenant | null = null;
  let isInOrbit = false;
  if (session?.user) {
    const orbitCtx = await resolveViewerOrbitContext(
      session.user.id,
      tenantRow.id,
      false,
    );
    viewerOwnTenant = orbitCtx.viewerOwnTenant;
    isInOrbit = orbitCtx.isInOrbit;
  }

  return {
    kind: "ok",
    tenant: tenantInfo,
    settings,
    isMember: false,
    viewerOwnTenant,
    isInOrbit,
  };
}

export function noIndexMeta(allowIndexing: boolean) {
  if (allowIndexing) {
    return undefined;
  }
  return { robots: { index: false, follow: false } };
}
