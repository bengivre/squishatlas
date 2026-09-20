import { notFound } from "next/navigation";

import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

import { NewSquishForm } from "./new-squish-form";

export default async function NewSquishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantMember(slug);

  if (!tenant) {
    notFound();
  }

  return <NewSquishForm slug={slug} displayName={tenant.displayName} />;
}
