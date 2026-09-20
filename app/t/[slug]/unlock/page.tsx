import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { tenant } from "@/db/schema/tenant";
import {
  isSafeNextPath,
  publicPageFromPath,
} from "@/lib/public/unlock-cookie";

import { UnlockForm } from "./unlock-form";

export default async function UnlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const tenantRow = await db.query.tenant.findFirst({
    where: eq(tenant.slug, slug),
  });
  if (!tenantRow) {
    notFound();
  }

  const nextCandidate = query.next ?? `/t/${slug}`;
  const next = isSafeNextPath(nextCandidate, slug)
    ? nextCandidate
    : `/t/${slug}`;

  if (!publicPageFromPath(next.split("?")[0] ?? next, slug)) {
    notFound();
  }

  return (
    <UnlockForm
      slug={slug}
      next={next}
      displayName={tenantRow.displayName}
    />
  );
}
