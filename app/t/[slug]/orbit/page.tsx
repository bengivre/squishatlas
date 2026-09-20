import { OrbitList } from "@/components/tenant/orbit-list";
import { TenantAppShell } from "@/components/tenant/tenant-app-shell";
import { listOrbit } from "@/lib/dal";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

export default async function OrbitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantMember(slug);
  const entries = await listOrbit(tenant.id);

  return (
    <TenantAppShell
      slug={slug}
      eyebrow={`${tenant.displayName}'s shelf`}
      title="Orbit"
      activeTab="orbit"
    >
      <p className="text-star-dim mt-1 text-sm">
        Shelves you&apos;ve saved — open them anytime without hunting for the
        link.
      </p>
      <OrbitList
        slug={slug}
        entries={entries.map((entry) => ({
          id: entry.id,
          label: entry.label,
          preferredPage: entry.preferredPage,
          savedTenant: {
            slug: entry.savedTenant.slug,
            displayName: entry.savedTenant.displayName,
          },
        }))}
      />
    </TenantAppShell>
  );
}
