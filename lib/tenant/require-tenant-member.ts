import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db";
import { membership, tenant } from "@/db/schema/tenant";
import { auth } from "@/lib/auth";
import { requirePasswordChanged } from "@/lib/auth/require-password-changed";

export type TenantAccessContext = {
  tenant: {
    id: string;
    slug: string;
    displayName: string;
  };
  userId: string;
};

export async function requireTenantMember(
  slug: string,
): Promise<TenantAccessContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(`/t/${slug}/gallery`)}`);
  }

  requirePasswordChanged(session);

  const row = await db
    .select({
      tenantId: tenant.id,
      slug: tenant.slug,
      displayName: tenant.displayName,
    })
    .from(tenant)
    .innerJoin(membership, eq(membership.tenantId, tenant.id))
    .where(and(eq(tenant.slug, slug), eq(membership.userId, session.user.id)))
    .limit(1);

  const match = row[0];

  if (!match) {
    notFound();
  }

  return {
    tenant: {
      id: match.tenantId,
      slug: match.slug,
      displayName: match.displayName,
    },
    userId: session.user.id,
  };
}
