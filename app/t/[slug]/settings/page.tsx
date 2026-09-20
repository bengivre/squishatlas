import { headers } from "next/headers";

import { getTenantSettings } from "@/lib/dal";
import { unsealPagePassword } from "@/lib/public/page-password";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantMember(slug);
  const settings = await getTenantSettings(tenant.id);

  if (!settings) {
    throw new Error("Tenant settings missing");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "http://localhost:3000";

  return (
    <SettingsForm
      slug={slug}
      displayName={tenant.displayName}
      origin={origin}
      settings={{
        hubEnabled: settings.hubEnabled,
        galleryEnabled: settings.galleryEnabled,
        treeEnabled: settings.treeEnabled,
        hubIntro: settings.hubIntro,
        allowIndexing: settings.allowIndexing,
        hubPassword: unsealPagePassword(settings.hubPasswordReveal),
        galleryPassword: unsealPagePassword(settings.galleryPasswordReveal),
        treePassword: unsealPagePassword(settings.treePasswordReveal),
        hasHubPassword: Boolean(settings.hubPasswordHash),
        hasGalleryPassword: Boolean(settings.galleryPasswordHash),
        hasTreePassword: Boolean(settings.treePasswordHash),
      }}
    />
  );
}
