import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { ConstellationView } from "@/components/constellation/constellation-view";
import { PrivatePageNotice } from "@/components/public/private-page-notice";
import { PublicShareHeader } from "@/components/public/public-share-header";
import { db } from "@/db";
import { tenant, tenantSettings } from "@/db/schema/tenant";
import {
  listFamilies,
  listPrimaryPhotosForSquishIds,
  listRelationshipPairs,
  listSquish,
} from "@/lib/dal";
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
    title: `${tenantRow.displayName} · Family tree`,
    ...noIndexMeta(settings?.allowIndexing ?? false),
  };
}

export default async function PublicTreePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await enforcePublicPageAccess(slug, "tree");

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

  const [squishies, pairs, families] = await Promise.all([
    listSquish(tenant.id, { sort: "name", order: "asc" }),
    listRelationshipPairs(tenant.id),
    listFamilies(tenant.id),
  ]);
  const primaryPhotos = await listPrimaryPhotosForSquishIds(
    tenant.id,
    squishies.map((item) => item.id),
  );

  const squishiesWithPhotos = squishies.map((item) => ({
    ...item,
    photo: primaryPhotos.get(item.id) ?? null,
  }));

  return (
    <main className="bg-night-deep flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 pt-8">
        <PublicShareHeader
          slug={slug}
          displayName={tenant.displayName}
          title="Family tree"
          hubIntro={settings.hubIntro}
          active="tree"
          galleryEnabled={settings.galleryEnabled}
          treeEnabled={settings.treeEnabled}
          isMember={isMember}
          viewerOwnTenant={viewerOwnTenant}
          isInOrbit={isInOrbit}
        />
      </div>

      <div className="relative min-h-[70vh] flex-1">
        <ConstellationView
          tenantId={tenant.id}
          slug={slug}
          variant="public"
          squishies={squishiesWithPhotos}
          pairs={pairs}
          families={families.map((f) => ({
            id: f.id,
            name: f.name,
            emoji: f.emoji,
            color: f.color,
          }))}
        />
      </div>
    </main>
  );
}
