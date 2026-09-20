import { ConstellationView } from "@/components/constellation/constellation-view";
import { TenantAppShell } from "@/components/tenant/tenant-app-shell";
import {
  listFamilies,
  listPrimaryPhotosForSquishIds,
  listRelationshipPairs,
  listSquish,
} from "@/lib/dal";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantMember(slug);

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
    <TenantAppShell
      slug={slug}
      eyebrow="Family map"
      title="Constellation"
      activeTab="family"
      hideHeader
      fullBleed
    >
      <ConstellationView
        tenantId={tenant.id}
        slug={slug}
        variant="app"
        squishies={squishiesWithPhotos}
        pairs={pairs}
        families={families.map((f) => ({
          id: f.id,
          name: f.name,
          emoji: f.emoji,
          color: f.color,
        }))}
      />
    </TenantAppShell>
  );
}
