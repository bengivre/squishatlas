import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user, session, account } from "./auth";
import { orbit } from "./orbit";

export const tenant = pgTable(
  "tenant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("tenant_slug_unique").on(table.slug)],
);

export const membership = pgTable(
  "membership",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("membership_tenant_id_unique").on(table.tenantId)],
);

export const tenantSettings = pgTable("tenant_settings", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenant.id, { onDelete: "cascade" }),
  hubEnabled: boolean("hub_enabled").default(false).notNull(),
  galleryEnabled: boolean("gallery_enabled").default(false).notNull(),
  treeEnabled: boolean("tree_enabled").default(false).notNull(),
  hubPasswordHash: text("hub_password_hash"),
  galleryPasswordHash: text("gallery_password_hash"),
  treePasswordHash: text("tree_password_hash"),
  hubPasswordReveal: text("hub_password_reveal"),
  galleryPasswordReveal: text("gallery_password_reveal"),
  treePasswordReveal: text("tree_password_reveal"),
  hubIntro: text("hub_intro"),
  /** When false (default), public pages send noindex — pages made by children. */
  allowIndexing: boolean("allow_indexing").default(false).notNull(),
});

export const tenantInvite = pgTable(
  "tenant_invite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("tenant_invite_tenant_id_unique").on(table.tenantId)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(membership),
}));

export const tenantRelations = relations(tenant, ({ one, many }) => ({
  settings: one(tenantSettings, {
    fields: [tenant.id],
    references: [tenantSettings.tenantId],
  }),
  memberships: many(membership),
  invites: many(tenantInvite),
  orbitsOwned: many(orbit, { relationName: "orbitOwned" }),
  orbitsSaved: many(orbit, { relationName: "orbitSaved" }),
}));

export const membershipRelations = relations(membership, ({ one }) => ({
  tenant: one(tenant, {
    fields: [membership.tenantId],
    references: [tenant.id],
  }),
  user: one(user, {
    fields: [membership.userId],
    references: [user.id],
  }),
}));

export const tenantSettingsRelations = relations(tenantSettings, ({ one }) => ({
  tenant: one(tenant, {
    fields: [tenantSettings.tenantId],
    references: [tenant.id],
  }),
}));

export const tenantInviteRelations = relations(tenantInvite, ({ one }) => ({
  tenant: one(tenant, {
    fields: [tenantInvite.tenantId],
    references: [tenant.id],
  }),
}));
