import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { squish } from "./squish";
import { tenant } from "./tenant";

export const RELATIONSHIP_TYPES = [
  "mom",
  "dad",
  "son",
  "daughter",
  "partner",
  "brother",
  "sister",
  "twin",
  "grandma",
  "grandpa",
  "grandson",
  "granddaughter",
  "aunt",
  "uncle",
  "nephew",
  "niece",
  "cousin",
  "friend",
  "bestFriend",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const FRIENDSHIP_TYPES: RelationshipType[] = ["friend", "bestFriend"];

export function relationshipEdgeClass(
  type: RelationshipType,
): "family" | "friendship" {
  return FRIENDSHIP_TYPES.includes(type) ? "friendship" : "family";
}

export const relationship = pgTable(
  "relationship",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    fromSquishId: uuid("from_squish_id")
      .notNull()
      .references(() => squish.id, { onDelete: "cascade" }),
    toSquishId: uuid("to_squish_id")
      .notNull()
      .references(() => squish.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<RelationshipType>(),
    pairId: uuid("pair_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("relationship_tenant_id_idx").on(table.tenantId),
    index("relationship_from_squish_id_idx").on(table.fromSquishId),
    index("relationship_pair_id_idx").on(table.pairId),
    uniqueIndex("relationship_from_to_unique").on(
      table.fromSquishId,
      table.toSquishId,
    ),
  ],
);

export const relationshipRelations = relations(relationship, ({ one }) => ({
  tenant: one(tenant, {
    fields: [relationship.tenantId],
    references: [tenant.id],
  }),
  fromSquish: one(squish, {
    fields: [relationship.fromSquishId],
    references: [squish.id],
    relationName: "relationshipsFrom",
  }),
  toSquish: one(squish, {
    fields: [relationship.toSquishId],
    references: [squish.id],
    relationName: "relationshipsTo",
  }),
}));

export type Relationship = typeof relationship.$inferSelect;
export type NewRelationship = typeof relationship.$inferInsert;
