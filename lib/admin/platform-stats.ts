import {
  and,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { session, user } from "@/db/schema/auth";
import { family } from "@/db/schema/family";
import { squish } from "@/db/schema/squish";
import { squishPhoto } from "@/db/schema/squish-photo";
import {
  tenant,
  tenantInvite,
  tenantSettings,
} from "@/db/schema/tenant";
import { buildInviteUrl } from "@/lib/admin/tenant-utils";

export type PlatformCounters = {
  tenants: number;
  users: number;
  superadmins: number;
  squishies: number;
  photos: number;
  families: number;
  activeSessions: number;
  publicSurfaces: number;
  pendingInvites: number;
};

export type AttentionItem = {
  id: string;
  kind:
    | "no_owner"
    | "expired_invite"
    | "must_change_password"
    | "unverified_email";
  title: string;
  detail: string;
  href?: string;
};

export type RecentTenant = {
  id: string;
  slug: string;
  displayName: string;
  createdAt: string;
};

export type RecentUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isSuperadmin: boolean;
};

export type DayBucket = {
  /** YYYY-MM-DD */
  day: string;
  count: number;
};

export type PlatformOverview = {
  counters: PlatformCounters;
  attention: AttentionItem[];
  recentTenants: RecentTenant[];
  recentUsers: RecentUser[];
  tenantSparkline: DayBucket[];
  squishSparkline: DayBucket[];
};

export type AdminTenantRow = {
  id: string;
  slug: string;
  displayName: string;
  createdAt: string;
  owner: { id: string; email: string; name: string } | null;
  pendingInvite: {
    email: string;
    expiresAt: string;
    inviteUrl: string;
  } | null;
  squishCount: number;
  photoCount: number;
  familyCount: number;
  sharing: {
    hubEnabled: boolean;
    galleryEnabled: boolean;
    treeEnabled: boolean;
    allowIndexing: boolean;
  };
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  isSuperadmin: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  tenant: { id: string; slug: string; displayName: string } | null;
  activeSessionCount: number;
};

function emptySparkline(days = 7): DayBucket[] {
  const buckets: DayBucket[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    buckets.push({ day: d.toISOString().slice(0, 10), count: 0 });
  }
  return buckets;
}

function fillSparkline(
  rows: { day: string; count: number }[],
  days = 7,
): DayBucket[] {
  const base = emptySparkline(days);
  const map = new Map(rows.map((r) => [r.day, r.count]));
  return base.map((b) => ({ day: b.day, count: map.get(b.day) ?? 0 }));
}

async function countTable(table: typeof tenant | typeof user | typeof squish | typeof squishPhoto | typeof family) {
  const [row] = await db.select({ value: count() }).from(table);
  return Number(row?.value ?? 0);
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
  weekAgo.setUTCHours(0, 0, 0, 0);

  const [
    tenants,
    users,
    squishies,
    photos,
    families,
    superadminRow,
    sessionRow,
    publicRow,
    pendingInviteRow,
    tenantSparkRows,
    squishSparkRows,
    recentTenantRows,
    recentUserRows,
    allTenants,
    mustChangeUsers,
    unverifiedUsers,
  ] = await Promise.all([
    countTable(tenant),
    countTable(user),
    countTable(squish),
    countTable(squishPhoto),
    countTable(family),
    db
      .select({ value: count() })
      .from(user)
      .where(eq(user.isSuperadmin, true))
      .then((r) => r[0]),
    db
      .select({ value: count() })
      .from(session)
      .where(gt(session.expiresAt, now))
      .then((r) => r[0]),
    db
      .select({ value: count() })
      .from(tenantSettings)
      .where(
        or(
          eq(tenantSettings.hubEnabled, true),
          eq(tenantSettings.galleryEnabled, true),
          eq(tenantSettings.treeEnabled, true),
        ),
      )
      .then((r) => r[0]),
    db
      .select({ value: count() })
      .from(tenantInvite)
      .where(and(isNull(tenantInvite.usedAt), gt(tenantInvite.expiresAt, now)))
      .then((r) => r[0]),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${tenant.createdAt} at time zone 'utc'), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(tenant)
      .where(gte(tenant.createdAt, weekAgo))
      .groupBy(sql`date_trunc('day', ${tenant.createdAt} at time zone 'utc')`)
      .orderBy(sql`date_trunc('day', ${tenant.createdAt} at time zone 'utc')`),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${squish.createdAt} at time zone 'utc'), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(squish)
      .where(gte(squish.createdAt, weekAgo))
      .groupBy(sql`date_trunc('day', ${squish.createdAt} at time zone 'utc')`)
      .orderBy(sql`date_trunc('day', ${squish.createdAt} at time zone 'utc')`),
    db.query.tenant.findMany({
      orderBy: desc(tenant.createdAt),
      limit: 5,
    }),
    db.query.user.findMany({
      orderBy: desc(user.createdAt),
      limit: 5,
    }),
    db.query.tenant.findMany({
      with: {
        memberships: true,
        invites: true,
      },
    }),
    db.query.user.findMany({
      where: eq(user.mustChangePassword, true),
      orderBy: desc(user.updatedAt),
      limit: 20,
    }),
    db.query.user.findMany({
      where: and(eq(user.emailVerified, false), eq(user.isSuperadmin, false)),
      orderBy: desc(user.createdAt),
      limit: 20,
    }),
  ]);

  const attention: AttentionItem[] = [];

  for (const row of allTenants) {
    const hasOwner = row.memberships.length > 0;
    const validInvite = row.invites.find(
      (inv) => inv.usedAt == null && inv.expiresAt > now,
    );
    const expiredInvite = row.invites.find(
      (inv) => inv.usedAt == null && inv.expiresAt <= now,
    );

    if (!hasOwner && !validInvite) {
      attention.push({
        id: `no-owner-${row.id}`,
        kind: "no_owner",
        title: `${row.displayName} has no owner`,
        detail: expiredInvite
          ? `Invite to ${expiredInvite.email} expired — send a new one.`
          : "Create an invite so someone can claim this shelf.",
        href: "/admin/tenants",
      });
    } else if (!hasOwner && expiredInvite) {
      attention.push({
        id: `expired-${row.id}`,
        kind: "expired_invite",
        title: `Expired invite for ${row.displayName}`,
        detail: `${expiredInvite.email} — invite another owner.`,
        href: "/admin/tenants",
      });
    }
  }

  for (const u of mustChangeUsers) {
    attention.push({
      id: `mcp-${u.id}`,
      kind: "must_change_password",
      title: `${u.email} must change password`,
      detail: u.isSuperadmin
        ? "Superadmin still on temporary credentials."
        : "User has a temporary password pending change.",
      href: "/admin/users",
    });
  }

  for (const u of unverifiedUsers) {
    attention.push({
      id: `unverified-${u.id}`,
      kind: "unverified_email",
      title: `${u.email} unverified`,
      detail: "Email verification has not completed.",
      href: "/admin/users",
    });
  }

  return {
    counters: {
      tenants,
      users,
      superadmins: Number(superadminRow?.value ?? 0),
      squishies,
      photos,
      families,
      activeSessions: Number(sessionRow?.value ?? 0),
      publicSurfaces: Number(publicRow?.value ?? 0),
      pendingInvites: Number(pendingInviteRow?.value ?? 0),
    },
    attention: attention.slice(0, 12),
    recentTenants: recentTenantRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      displayName: row.displayName,
      createdAt: row.createdAt.toISOString(),
    })),
    recentUsers: recentUserRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
      isSuperadmin: row.isSuperadmin,
    })),
    tenantSparkline: fillSparkline(
      tenantSparkRows.map((r) => ({ day: r.day, count: Number(r.count) })),
    ),
    squishSparkline: fillSparkline(
      squishSparkRows.map((r) => ({ day: r.day, count: Number(r.count) })),
    ),
  };
}

export async function listEnrichedTenantsForAdmin(): Promise<AdminTenantRow[]> {
  const now = new Date();

  const rows = await db.query.tenant.findMany({
    orderBy: desc(tenant.createdAt),
    with: {
      settings: true,
      memberships: {
        with: {
          user: true,
        },
      },
      invites: {
        where: and(isNull(tenantInvite.usedAt), gt(tenantInvite.expiresAt, now)),
        orderBy: desc(tenantInvite.createdAt),
      },
    },
  });

  if (rows.length === 0) {
    return [];
  }

  const tenantIds = rows.map((r) => r.id);

  const [squishCounts, photoCounts, familyCounts] = await Promise.all([
    db
      .select({
        tenantId: squish.tenantId,
        value: count(),
      })
      .from(squish)
      .where(inArray(squish.tenantId, tenantIds))
      .groupBy(squish.tenantId),
    db
      .select({
        tenantId: squishPhoto.tenantId,
        value: count(),
      })
      .from(squishPhoto)
      .where(inArray(squishPhoto.tenantId, tenantIds))
      .groupBy(squishPhoto.tenantId),
    db
      .select({
        tenantId: family.tenantId,
        value: count(),
      })
      .from(family)
      .where(inArray(family.tenantId, tenantIds))
      .groupBy(family.tenantId),
  ]);

  const squishMap = new Map(
    squishCounts.map((r) => [r.tenantId, Number(r.value)]),
  );
  const photoMap = new Map(
    photoCounts.map((r) => [r.tenantId, Number(r.value)]),
  );
  const familyMap = new Map(
    familyCounts.map((r) => [r.tenantId, Number(r.value)]),
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    createdAt: row.createdAt.toISOString(),
    owner: row.memberships[0]?.user
      ? {
          id: row.memberships[0].user.id,
          email: row.memberships[0].user.email,
          name: row.memberships[0].user.name,
        }
      : null,
    pendingInvite: row.invites[0]
      ? {
          email: row.invites[0].email,
          expiresAt: row.invites[0].expiresAt.toISOString(),
          inviteUrl: buildInviteUrl(row.invites[0].token),
        }
      : null,
    squishCount: squishMap.get(row.id) ?? 0,
    photoCount: photoMap.get(row.id) ?? 0,
    familyCount: familyMap.get(row.id) ?? 0,
    sharing: {
      hubEnabled: row.settings?.hubEnabled ?? false,
      galleryEnabled: row.settings?.galleryEnabled ?? false,
      treeEnabled: row.settings?.treeEnabled ?? false,
      allowIndexing: row.settings?.allowIndexing ?? false,
    },
  }));
}

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const now = new Date();

  const users = await db.query.user.findMany({
    orderBy: desc(user.createdAt),
    with: {
      memberships: {
        with: {
          tenant: true,
        },
      },
    },
  });

  const sessionCounts = await db
    .select({
      userId: session.userId,
      value: count(),
    })
    .from(session)
    .where(gt(session.expiresAt, now))
    .groupBy(session.userId);

  const sessionMap = new Map(
    sessionCounts.map((r) => [r.userId, Number(r.value)]),
  );

  return users.map((u) => {
    const m = u.memberships[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      isSuperadmin: u.isSuperadmin,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt.toISOString(),
      tenant: m?.tenant
        ? {
            id: m.tenant.id,
            slug: m.tenant.slug,
            displayName: m.tenant.displayName,
          }
        : null,
      activeSessionCount: sessionMap.get(u.id) ?? 0,
    };
  });
}
