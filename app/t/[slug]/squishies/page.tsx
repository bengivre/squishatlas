import Link from "next/link";

import { buildFilterChips } from "@/components/tenant/build-filter-chips";
import { FilterChips } from "@/components/tenant/filter-chips";
import { SquishCard } from "@/components/tenant/squish-card";
import { TenantAppShell } from "@/components/tenant/tenant-app-shell";
import {
  listPrimaryPhotosForSquishIds,
  listRelationshipPairs,
  listSquish,
  type SquishSortField,
} from "@/lib/dal";
import { lonelySquishIds } from "@/lib/stats/connected-components";
import { requireTenantMember } from "@/lib/tenant/require-tenant-member";

function resolveListOptions(
  sort: string | undefined,
  filter: string | undefined,
) {
  if (filter === "favorites" || sort === "favorites") {
    return {
      sort: "favorite_first" as SquishSortField,
    };
  }
  if (sort === "newest" || filter === "newest") {
    return {
      sort: "created_at" as SquishSortField,
      order: "desc" as const,
    };
  }
  return {
    sort: "name" as SquishSortField,
    order: "asc" as const,
  };
}

function EmptyCollectionState({
  slug,
  lonelyOnly,
  filter,
}: {
  slug: string;
  lonelyOnly: boolean;
  filter: string | undefined;
}) {
  const collectionHref = `/t/${slug}/squishies`;

  let message = "No squishies yet. Add your first one and give them a story.";
  let ctaHref = `/t/${slug}/squishies/new`;
  let ctaLabel = "Add a squish";

  if (lonelyOnly) {
    message = "No lonely squishes right now — everyone has a thread.";
    ctaHref = `/t/${slug}/family`;
    ctaLabel = "Open Family";
  } else if (filter === "no_story") {
    message = "Everyone has a story already — nice work.";
    ctaHref = collectionHref;
    ctaLabel = "Show everyone";
  } else if (filter === "favorites") {
    message = "No favourites yet. Tap the heart on a squish you love.";
    ctaHref = collectionHref;
    ctaLabel = "Show everyone";
  } else if (filter === "connected") {
    message = "No family links yet. Connect friends on the Family page.";
    ctaHref = `/t/${slug}/family`;
    ctaLabel = "Open Family";
  }

  return (
    <section className="stat-panel text-center">
      <p className="text-lamplight">{message}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-block rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}

export default async function SquishiesGridPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string; sort?: string; lonely?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { tenant } = await requireTenantMember(slug);
  const lonelyOnly = query.lonely === "1";

  const listOptions = resolveListOptions(query.sort, query.filter);
  let squishies = await listSquish(tenant.id, listOptions);

  const pairs = await listRelationshipPairs(tenant.id);
  const connectedIds = new Set<string>();
  for (const pair of pairs) {
    connectedIds.add(pair.fromSquishId);
    connectedIds.add(pair.toSquishId);
  }

  if (lonelyOnly) {
    const lonelyIds = new Set(
      lonelySquishIds(
        squishies.map((item) => item.id),
        pairs,
      ),
    );
    squishies = squishies.filter((item) => lonelyIds.has(item.id));
  } else if (query.filter === "favorites") {
    squishies = squishies.filter((item) => item.isFavorite);
  } else if (query.filter === "connected") {
    squishies = squishies.filter((item) => connectedIds.has(item.id));
  } else if (query.filter === "no_story") {
    squishies = squishies.filter((item) => !item.story?.trim());
  }

  const primaryPhotos = await listPrimaryPhotosForSquishIds(
    tenant.id,
    squishies.map((item) => item.id),
  );

  const { chips, activeId } = buildFilterChips(slug, query);
  const countLabel =
    squishies.length === 1 ? "1 squishie" : `${squishies.length} squishies`;

  return (
    <TenantAppShell
      slug={slug}
      eyebrow={`${tenant.displayName}'s shelf`}
      title={countLabel}
      activeTab="collection"
      showFab
    >
      {lonelyOnly ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-card border border-moon-gold/20 bg-night-plum/60 px-4 py-3">
          <p className="text-sm text-lamplight">
            Showing friends still waiting for a connection.
          </p>
          <Link
            href={`/t/${slug}/squishies`}
            className="text-sm text-moon-gold underline-offset-2 hover:underline"
          >
            Show everyone
          </Link>
        </div>
      ) : null}

      <FilterChips chips={chips} activeId={activeId} />

      {squishies.length === 0 ? (
        <EmptyCollectionState
          slug={slug}
          lonelyOnly={lonelyOnly}
          filter={query.filter}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-[13px]">
          {squishies.map((item) => (
            <li key={item.id}>
              <SquishCard
                slug={slug}
                tenantId={tenant.id}
                squishId={item.id}
                name={item.name}
                adoptedAt={item.adoptedAt}
                isFavorite={item.isFavorite}
                photo={primaryPhotos.get(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </TenantAppShell>
  );
}
