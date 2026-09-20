import { notFound } from "next/navigation";

import {
  RelationshipChips,
  type RelationshipChipItem,
} from "@/components/tenant/relationship-chips";
import { TenantAppShell } from "@/components/tenant/tenant-app-shell";
import {
  getSquishById,
  listPrimaryPhotosForSquishIds,
  listRelationshipPairs,
  listSquish,
  listSquishPhotos,
} from "@/lib/dal";
import { kinFor } from "@/lib/relationship/derive";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

import { SquishDetailEditor } from "./squish-detail-editor";
import { SquishDetailHero } from "./squish-detail-hero";
import { SquishPhotoManager } from "./squish-photo-manager";

export default async function SquishDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ added?: string }>;
}) {
  const { slug, id } = await params;
  const query = await searchParams;
  const { tenant } = await requireTenantMember(slug);

  const squish = await getSquishById(tenant.id, id);

  if (!squish) {
    notFound();
  }

  const [photos, pairs, allSquish] = await Promise.all([
    listSquishPhotos(tenant.id, id),
    listRelationshipPairs(tenant.id),
    listSquish(tenant.id, { sort: "name", order: "asc" }),
  ]);

  const squishMap = new Map(allSquish.map((item) => [item.id, item]));
  const kin = kinFor(id, pairs);
  const relatedIds = kin.map((rel) => rel.otherId);
  const relatedPhotos = await listPrimaryPhotosForSquishIds(
    tenant.id,
    relatedIds,
  );

  const relationships: RelationshipChipItem[] = kin
    .map((rel) => {
      const other = squishMap.get(rel.otherId);
      if (!other) {
        return null;
      }
      return {
        squishId: rel.otherId,
        name: other.name,
        role: rel.role,
        kind: rel.kind,
        derived: rel.derived,
        photo: relatedPhotos.get(rel.otherId) ?? null,
      };
    })
    .filter((item): item is RelationshipChipItem => item !== null);

  return (
    <TenantAppShell
      slug={slug}
      eyebrow=""
      title=""
      activeTab="collection"
      hideHeader
    >
      <SquishDetailHero
        slug={slug}
        tenantId={tenant.id}
        squishId={id}
        photos={photos}
      />

      <div className="mt-5 space-y-6">
        <SquishDetailEditor
          slug={slug}
          squish={squish}
          showAddedMessage={query.added === "1"}
        />

        <div>
          <div className="section-label">Family &amp; friends</div>
          <RelationshipChips
            slug={slug}
            tenantId={tenant.id}
            relationships={relationships}
          />
        </div>

        <SquishPhotoManager
          slug={slug}
          tenantId={tenant.id}
          squishId={id}
          initialPhotos={photos}
        />
      </div>
    </TenantAppShell>
  );
}
