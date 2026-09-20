import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tenantSettings } from "@/db/schema/tenant";

export type TenantSettingsUpdate = Partial<
  Pick<
    typeof tenantSettings.$inferInsert,
    | "hubEnabled"
    | "galleryEnabled"
    | "treeEnabled"
    | "hubPasswordHash"
    | "galleryPasswordHash"
    | "treePasswordHash"
    | "hubPasswordReveal"
    | "galleryPasswordReveal"
    | "treePasswordReveal"
    | "hubIntro"
    | "allowIndexing"
  >
>;

export async function getTenantSettings(tenantId: string) {
  return db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.tenantId, tenantId),
  });
}

export async function updateTenantSettings(
  tenantId: string,
  values: TenantSettingsUpdate,
) {
  const [updated] = await db
    .update(tenantSettings)
    .set(values)
    .where(eq(tenantSettings.tenantId, tenantId))
    .returning();

  return updated ?? null;
}
