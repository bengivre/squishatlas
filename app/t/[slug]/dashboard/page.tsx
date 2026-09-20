import Link from "next/link";

import { SquishPhotoImg } from "@/components/squish/squish-photo-img";
import { TenantAppShell } from "@/components/tenant/tenant-app-shell";
import { getTenantDashboardStats } from "@/lib/stats/dashboard";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

function formatMonthShort(month: string): string {
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" }).toUpperCase();
}

function relativeAdoptionLabel(adoptedAt: string): string {
  const adopted = new Date(adoptedAt);
  const now = new Date();
  const diffMs = now.getTime() - adopted.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) {
    return "Today";
  }
  if (days === 1) {
    return "1 day ago";
  }
  if (days < 30) {
    return `${days} days ago`;
  }
  const months =
    (now.getFullYear() - adopted.getFullYear()) * 12 +
    (now.getMonth() - adopted.getMonth());
  if (months < 12) {
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }
  return `${years} year${years === 1 ? "" : "s"}, ${remMonths} month${remMonths === 1 ? "" : "s"}`;
}

function durationSince(adoptedAt: string): string {
  const adopted = new Date(adoptedAt);
  const now = new Date();
  const months =
    (now.getFullYear() - adopted.getFullYear()) * 12 +
    (now.getMonth() - adopted.getMonth());
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) {
    return remMonths === 1 ? "1 month" : `${remMonths} months`;
  }
  if (remMonths === 0) {
    return years === 1 ? "1 year" : `${years} years`;
  }
  return `${years} year${years === 1 ? "" : "s"}, ${remMonths} month${remMonths === 1 ? "" : "s"}`;
}

export default async function StatsDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantMember(slug);
  const stats = await getTenantDashboardStats(tenant.id);

  const currentYear = new Date().getFullYear();
  const yearBuckets = stats.adoptionTimeline.filter((bucket) =>
    bucket.month.startsWith(String(currentYear)),
  );
  const maxTimeline = Math.max(1, ...yearBuckets.map((bucket) => bucket.count));

  return (
    <TenantAppShell
      slug={slug}
      eyebrow={`${tenant.displayName}'s shelf`}
      title="The numbers"
      activeTab="stats"
    >
      <div className="grid grid-cols-2 gap-[11px]">
        <div className="stat-panel">
          <div className="stat-k">Squishies</div>
          <div className="stat-num text-moon-gold mt-[5px] text-[2.5rem] leading-tight">
            {stats.collectionSize}
          </div>
        </div>
        <div className="stat-panel">
          <div className="stat-k">Friendships</div>
          <div className="stat-num text-aurora mt-[5px] text-[2.5rem] leading-tight">
            {stats.friendshipWeb}
          </div>
        </div>
      </div>

      <div className="stat-panel mt-[11px]">
        <div className="stat-k">Orbit</div>
        <div className="stat-num text-lamplight mt-[5px] text-[2.5rem] leading-tight">
          {stats.orbitCount}
        </div>
        <div className="text-star-dim mt-[3px] text-[12.5px] font-bold">
          {stats.orbitCount === 0
            ? "No shelves saved yet"
            : stats.orbitCount === 1
              ? "1 shelf in your orbit"
              : `${stats.orbitCount} shelves in your orbit`}
        </div>
        <Link
          href={`/t/${slug}/orbit`}
          className="text-moon-gold mt-2 inline-block text-[12.5px] font-extrabold"
        >
          Manage →
        </Link>
      </div>

      <div className="mt-[11px] grid grid-cols-2 gap-[11px]">
        <div className="stat-panel">
          <div className="stat-k">Families</div>
          <div className="stat-num text-lamplight mt-[5px] text-[2.5rem] leading-tight">
            {stats.familyCount}
          </div>
          <div className="text-star-dim mt-[3px] text-[12.5px] font-bold">
            {stats.families.filter((f) => !f.named).length > 0
              ? `${stats.families.filter((f) => !f.named).length} still need a name`
              : stats.familyCount === 0
                ? "Link relatives to start one"
                : "All named — lovely."}
          </div>
        </div>
        <div className="stat-panel">
          <div className="stat-k">Solo stars</div>
          <div className="stat-num text-star-dim mt-[5px] text-[2.5rem] leading-tight">
            {stats.soloCount}
          </div>
          <div className="text-star-dim mt-[3px] text-[12.5px] font-bold">
            {stats.soloCount === 0
              ? "Everyone belongs somewhere."
              : "No family links yet"}
          </div>
        </div>
      </div>

      <div className="stat-panel mt-[11px]">
        <div className="stat-k">Biggest family</div>
        {stats.biggestFamily ? (
          <>
            <div className="stat-num text-lamplight mt-[5px] text-[2.5rem] leading-tight">
              {stats.biggestFamily.size}
            </div>
            <div className="text-star-dim mt-[3px] flex items-center gap-2 text-[12.5px] font-bold">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  background: stats.biggestFamily.color,
                  boxShadow: `0 0 8px ${stats.biggestFamily.color}`,
                }}
              />
              {stats.biggestFamily.emoji} {stats.biggestFamily.name}
              {!stats.biggestFamily.named ? " · not named yet" : ""}
            </div>
            <div className="avatar-pile">
              {stats.biggestFamily.members.slice(0, 7).map((member) => (
                <div key={member.id} title={member.name}>
                  {member.photo ? (
                    <SquishPhotoImg
                      photo={member.photo}
                      tenantId={tenant.id}
                      squishId={member.id}
                      size="thumb"
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-night-plum text-star-dim flex h-full w-full items-center justify-center text-[10px]">
                      ?
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-star-dim mt-3 text-sm">
            No families yet — link a few relatives on Family.
          </p>
        )}
      </div>

      {stats.families.length > 1 ? (
        <div className="stat-panel mt-[11px]">
          <div className="stat-k">All families</div>
          <ul className="mt-2 space-y-2">
            {stats.families.map((family) => (
              <li
                key={family.id}
                className="rounded-input border-star-dim/20 bg-night-deep/50 flex items-center gap-3 border px-3 py-2"
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: family.color,
                    boxShadow: `0 0 8px ${family.color}`,
                  }}
                />
                <span className="text-lamplight min-w-0 flex-1 truncate text-sm font-bold">
                  {family.emoji} {family.name}
                </span>
                <span className="text-star-dim text-[12.5px] font-bold">
                  {family.size}
                </span>
                <div className="avatar-pile !mt-0">
                  {family.members.slice(0, 4).map((member) => (
                    <div key={member.id} title={member.name}>
                      {member.photo ? (
                        <SquishPhotoImg
                          photo={member.photo}
                          tenantId={tenant.id}
                          squishId={member.id}
                          size="thumb"
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="bg-night-plum text-star-dim flex h-full w-full items-center justify-center text-[10px]">
                          ?
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <Link
            href={`/t/${slug}/family`}
            className="text-moon-gold mt-3 inline-block text-sm underline-offset-2 hover:underline"
          >
            Open the constellation
          </Link>
        </div>
      ) : null}

      <div className="stat-panel mt-[11px]">
        <div className="stat-k">Adopted this year</div>
        {yearBuckets.length > 0 ? (
          <>
            <div className="spark-bars">
              {yearBuckets.map((bucket) => {
                const height = Math.max(
                  8,
                  Math.round((bucket.count / maxTimeline) * 100),
                );
                return (
                  <span
                    key={bucket.month}
                    style={{ height: `${height}%` }}
                    title={`${formatMonthShort(bucket.month)}: ${bucket.count}`}
                  />
                );
              })}
            </div>
            <div className="spark-months">
              {yearBuckets.map((bucket) => (
                <span key={bucket.month}>{formatMonthShort(bucket.month)}</span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-star-dim mt-3 text-sm">
            Stars will appear here as you set adoption dates this year.
          </p>
        )}
      </div>

      {stats.newestArrival ? (
        <Link
          href={`/t/${slug}/squishies/${stats.newestArrival.id}`}
          className="row-card mt-[11px] transition hover:opacity-90"
        >
          <div className="row-av">
            {stats.newestArrival.photo ? (
              <SquishPhotoImg
                photo={stats.newestArrival.photo}
                tenantId={tenant.id}
                squishId={stats.newestArrival.id}
                size="thumb"
                alt={stats.newestArrival.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-star-dim text-xs">?</span>
            )}
          </div>
          <div>
            <div className="stat-k">Newest arrival</div>
            <div className="font-display text-lamplight text-[19px] font-semibold">
              {stats.newestArrival.name}
            </div>
            <div className="text-star-dim text-[12.5px] font-bold">
              {relativeAdoptionLabel(stats.newestArrival.adoptedAt)}
            </div>
          </div>
        </Link>
      ) : null}

      {stats.longestLoved ? (
        <Link
          href={`/t/${slug}/squishies/${stats.longestLoved.id}`}
          className="row-card mt-[11px] transition hover:opacity-90"
        >
          <div className="row-av">
            {stats.longestLoved.photo ? (
              <SquishPhotoImg
                photo={stats.longestLoved.photo}
                tenantId={tenant.id}
                squishId={stats.longestLoved.id}
                size="thumb"
                alt={stats.longestLoved.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-star-dim text-xs">?</span>
            )}
          </div>
          <div>
            <div className="stat-k">Longest loved</div>
            <div className="font-display text-lamplight text-[19px] font-semibold">
              {stats.longestLoved.name}
            </div>
            <div className="text-star-dim text-[12.5px] font-bold">
              {durationSince(stats.longestLoved.adoptedAt)}
            </div>
          </div>
        </Link>
      ) : null}

      <div className="stat-panel mt-[11px]">
        <div className="stat-k">Waiting for a friend</div>
        <div className="stat-num text-blush mt-[5px] text-[2.5rem] leading-tight">
          {stats.lonelyCount}
        </div>
        <div className="text-star-dim mt-[3px] text-[12.5px] font-bold">
          {stats.lonelyCount === 0
            ? "Everyone has at least one thread — lovely."
            : "Tap to give them someone →"}
        </div>
        {stats.lonelyCount > 0 ? (
          <Link
            href={`/t/${slug}/squishies?lonely=1`}
            className="text-moon-gold mt-3 inline-block text-sm underline-offset-2 hover:underline"
          >
            Meet them
          </Link>
        ) : null}
      </div>
    </TenantAppShell>
  );
}
