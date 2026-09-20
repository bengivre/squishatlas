import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { family } from "./family";
import { squishPhoto } from "./squish-photo";
import { tenant } from "./tenant";

export const squish = pgTable(
  "squish",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").references(() => family.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    story: text("story"),
    adoptedAt: date("adopted_at"),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("squish_tenant_id_idx").on(table.tenantId),
    index("squish_family_id_idx").on(table.familyId),
  ],
);

export const squishRelations = relations(squish, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [squish.tenantId],
    references: [tenant.id],
  }),
  family: one(family, {
    fields: [squish.familyId],
    references: [family.id],
  }),
  photos: many(squishPhoto),
}));

export type Squish = typeof squish.$inferSelect;
export type NewSquish = typeof squish.$inferInsert;
