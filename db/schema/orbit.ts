import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { tenant } from "./tenant";

export const ORBIT_PAGES = ["hub", "gallery", "tree"] as const;

export type OrbitPage = (typeof ORBIT_PAGES)[number];

export const orbit = pgTable(
  "orbit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerTenantId: uuid("owner_tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    savedTenantId: uuid("saved_tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    label: text("label"),
    preferredPage: text("preferred_page")
      .notNull()
      .default("gallery")
      .$type<OrbitPage>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("orbit_owner_saved_unique").on(
      table.ownerTenantId,
      table.savedTenantId,
    ),
    index("orbit_owner_tenant_id_idx").on(table.ownerTenantId),
    check(
      "orbit_not_self",
      sql`${table.ownerTenantId} <> ${table.savedTenantId}`,
    ),
  ],
);

export const orbitRelations = relations(orbit, ({ one }) => ({
  ownerTenant: one(tenant, {
    fields: [orbit.ownerTenantId],
    references: [tenant.id],
    relationName: "orbitOwned",
  }),
  savedTenant: one(tenant, {
    fields: [orbit.savedTenantId],
    references: [tenant.id],
    relationName: "orbitSaved",
  }),
}));

export type Orbit = typeof orbit.$inferSelect;
export type NewOrbit = typeof orbit.$inferInsert;
