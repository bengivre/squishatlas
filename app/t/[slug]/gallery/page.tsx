import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { PrivatePageNotice } from "@/components/public/private-page-notice";
import { PublicShareHeader } from "@/components/public/public-share-header";
import { SquishPhotoImg } from "@/components/squish/squish-photo-img";
import { db } from "@/db";
import { tenant, tenantSettings } from "@/db/schema/tenant";
import {
  listPrimaryPhotosForSquishIds,
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
    title: `${tenantRow.displayName} · Gallery`,
    ...noIndexMeta(settings?.allowIndexing ?? false),
  };
}

export default async function PublicGalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await enforcePublicPageAccess(slug, "gallery");

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

  const squishies = await listSquish(tenant.id, {
    sort: "name",
    order: "asc",
  });
  const photos = await listPrimaryPhotosForSquishIds(
    tenant.id,
    squishies.map((item) => item.id),
  );

  return (
    <main className="min-h-screen bg-night-deep px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <PublicShareHeader
          slug={slug}
          displayName={tenant.displayName}
          title="Gallery"
          hubIntro={settings.hubIntro}
          active="gallery"
          galleryEnabled={settings.galleryEnabled}
          treeEnabled={settings.treeEnabled}
          isMember={isMember}
          viewerOwnTenant={viewerOwnTenant}
          isInOrbit={isInOrbit}
        />

        {squishies.length === 0 ? (
          <p className="text-center text-sm text-star-dim">
            No squishies here yet. Check back when the collection grows.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {squishies.map((item) => {
              const photo = photos.get(item.id);
              return (
                <li
                  key={item.id}
                  className="pressable-card rounded-card border border-star-dim/20 bg-night-plum p-4 shadow-glow-soft"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-card bg-night-deep">
                    {photo ? (
                      <SquishPhotoImg
                        photo={photo}
                        tenantId={tenant.id}
                        squishId={item.id}
                        size="card"
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-star-dim">
                        No photo yet
                      </div>
                    )}
                  </div>
                  <h2 className="text-lg text-lamplight">{item.name}</h2>
                  {item.story ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-star-dim">
                      {item.story}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
