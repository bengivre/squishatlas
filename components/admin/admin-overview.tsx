import Link from "next/link";

import type {
  PlatformOverview,
  RecentTenant,
  RecentUser,
} from "@/lib/admin/platform-stats";
import { AttentionList } from "@/components/admin/attention-list";
import { Sparkline } from "@/components/admin/sparkline";
import { StatTiles } from "@/components/admin/stat-tiles";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RecentTenants({ rows }: { rows: RecentTenant[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-star-dim">No tenants yet.</p>;
  }
  return (
    <ul className="divide-y divide-star-dim/15">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-lamplight">{row.displayName}</p>
            <p className="truncate text-xs text-star-dim">/t/{row.slug}</p>
          </div>
          <span className="shrink-0 text-xs text-star-dim">
            {formatWhen(row.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RecentUsers({ rows }: { rows: RecentUser[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-star-dim">No users yet.</p>;
  }
  return (
    <ul className="divide-y divide-star-dim/15">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-lamplight">{row.email}</p>
            <p className="truncate text-xs text-star-dim">
              {row.name}
              {row.isSuperadmin ? " · superadmin" : ""}
            </p>
          </div>
          <span className="shrink-0 text-xs text-star-dim">
            {formatWhen(row.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AdminOverview({ data }: { data: PlatformOverview }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-lamplight">Overview</h2>
          <p className="mt-1 text-sm text-star-dim">
            Platform pulse — collections, accounts, and things that need a nudge.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/tenants"
            className="rounded-input bg-moon-gold px-3 py-2 font-semibold text-night-deep"
          >
            Manage tenants
          </Link>
          <Link
            href="/admin/users"
            className="rounded-input border border-star-dim/30 px-3 py-2 text-lamplight"
          >
            Users
          </Link>
        </div>
      </div>

      <StatTiles counters={data.counters} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Sparkline label="New tenants" data={data.tenantSparkline} accent="gold" />
        <Sparkline
          label="New squishies"
          data={data.squishSparkline}
          accent="aurora"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h3 className="mb-3 font-display text-lg text-lamplight">Needs attention</h3>
          <AttentionList items={data.attention} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-card border border-star-dim/20 bg-night-plum/80 px-4 py-4">
            <h3 className="mb-2 font-display text-lg text-lamplight">
              Recent tenants
            </h3>
            <RecentTenants rows={data.recentTenants} />
          </div>
          <div className="rounded-card border border-star-dim/20 bg-night-plum/80 px-4 py-4">
            <h3 className="mb-2 font-display text-lg text-lamplight">
              Recent accounts
            </h3>
            <RecentUsers rows={data.recentUsers} />
          </div>
        </div>
      </section>
    </div>
  );
}
