import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { squish } from "./squish";
import { tenant } from "./tenant";

/** Nebula colours a family can pick; the sky tints its island with it. */
export const FAMILY_COLORS = [
  "gold",
  "blush",
  "aurora",
  "lilac",
  "sky",
  "mint",
] as const;

export type FamilyColor = (typeof FAMILY_COLORS)[number];

export const FAMILY_COLOR_HEX: Record<FamilyColor, string> = {
  gold: "#ffc96b",
  blush: "#ff9fc4",
  aurora: "#6fe3d0",
  lilac: "#b7a6ff",
  sky: "#8fd0ff",
  mint: "#b9f5a8",
};

export const family = pgTable(
  "family",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("🌙"),
    color: text("color").notNull().default("gold").$type<FamilyColor>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("family_tenant_id_idx").on(table.tenantId)],
);

export const familyRelations = relations(family, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [family.tenantId],
    references: [tenant.id],
  }),
  members: many(squish),
}));

export type Family = typeof family.$inferSelect;
export type NewFamily = typeof family.$inferInsert;
