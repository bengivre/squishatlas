import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { OrbitToggleButton } from "@/components/public/orbit-toggle-button";
import { PrivatePageNotice } from "@/components/public/private-page-notice";
import { db } from "@/db";
import { tenant, tenantSettings } from "@/db/schema/tenant";
import {
  enforcePublicPageAccess,
  noIndexMeta,
} from "@/lib/public/access-control";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenantRow = await db.query.tenant.findFirst({
    where: eq(tenant.slug, slug),
  });
  if (!tenantRow) {
    return { robots: { index: false, follow: false } };
  }
  const settings = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.tenantId, tenantRow.id),
  });
  return {
    title: tenantRow.displayName,
    description: settings?.hubIntro ?? undefined,
    ...noIndexMeta(settings?.allowIndexing ?? false),
  };
}

export default async function PublicHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await enforcePublicPageAccess(slug, "hub");

  if (access.kind === "private") {
    return (
      <PrivatePageNotice
        slug={slug}
        displayName={access.tenant.displayName}
        page={access.page}
      />
    );
  }

  const { tenant, settings, isMember, viewerOwnTenant, isInOrbit } = access;

  if (isMember || settings.galleryEnabled) {
    redirect(`/t/${slug}/gallery`);
  }
  if (settings.treeEnabled) {
    redirect(`/t/${slug}/tree`);
  }

  return (
    <main className="bg-night-deep min-h-screen px-4 py-16">
      <div className="mx-auto w-full max-w-lg text-center">
        {viewerOwnTenant ? (
          <div className="mb-6 flex justify-end">
            <OrbitToggleButton
              ownerSlug={viewerOwnTenant.slug}
              savedSlug={slug}
              preferredPage="hub"
              initialInOrbit={isInOrbit}
            />
          </div>
        ) : null}
        <p className="text-star-dim text-xs tracking-wide uppercase">
          Squishatlas
        </p>
        <h1 className="text-lamplight mt-2 text-3xl">{tenant.displayName}</h1>
        {settings.hubIntro ? (
          <p className="text-star-dim mt-4 whitespace-pre-wrap">
            {settings.hubIntro}
          </p>
        ) : (
          <p className="text-star-dim mt-4">
            A soft little window into this squish collection.
          </p>
        )}
      </div>
    </main>
  );
}
