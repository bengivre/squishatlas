import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { squish } from "./squish";
import { tenant } from "./tenant";

export const squishPhoto = pgTable(
  "squish_photo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    squishId: uuid("squish_id")
      .notNull()
      .references(() => squish.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").default(false).notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("squish_photo_tenant_id_idx").on(table.tenantId),
    index("squish_photo_squish_id_idx").on(table.squishId),
  ],
);

export const squishPhotoRelations = relations(squishPhoto, ({ one }) => ({
  tenant: one(tenant, {
    fields: [squishPhoto.tenantId],
    references: [tenant.id],
  }),
  squish: one(squish, {
    fields: [squishPhoto.squishId],
    references: [squish.id],
  }),
}));

export type SquishPhoto = typeof squishPhoto.$inferSelect;
export type NewSquishPhoto = typeof squishPhoto.$inferInsert;
