import { layoutSky } from "@/components/constellation/layout-islands";
import { FAMILY_COLOR_HEX } from "@/db/schema/family";
import type { Squish } from "@/db/schema/squish";
import type { SquishPhoto } from "@/db/schema/squish-photo";
import {
  listFamilies,
  listPrimaryPhotosForSquishIds,
  listRelationshipPairs,
  listSquish,
  countOrbit,
} from "@/lib/dal";
import {
  countFriendshipEdges,
  lonelySquishIds,
} from "@/lib/stats/connected-components";

export type SquishSnapshot = {
  id: string;
  name: string;
  photo: SquishPhoto | null;
};

export type AdoptionMonthBucket = {
  /** YYYY-MM */
  month: string;
  count: number;
};

export type FamilyStat = {
  /** Family id for named families, island id otherwise. */
  id: string;
  name: string;
  emoji: string;
  color: string;
  named: boolean;
  size: number;
  members: SquishSnapshot[];
};

export type TenantDashboardStats = {
  collectionSize: number;
  /** Every family island, biggest first (named or not). */
  families: FamilyStat[];
  familyCount: number;
  soloCount: number;
  biggestFamily: FamilyStat | null;
  friendshipWeb: number;
  newestArrival: (SquishSnapshot & { adoptedAt: string }) | null;
  longestLoved: (SquishSnapshot & { adoptedAt: string }) | null;
  adoptionTimeline: AdoptionMonthBucket[];
  lonelyCount: number;
  /** Shelves saved in this tenant's orbit. */
  orbitCount: number;
};

function toSnapshot(
  squish: Squish,
  photos: Map<string, SquishPhoto>,
): SquishSnapshot {
  return {
    id: squish.id,
    name: squish.name,
    photo: photos.get(squish.id) ?? null,
  };
}

function buildAdoptionTimeline(squishies: Squish[]): AdoptionMonthBucket[] {
  const counts = new Map<string, number>();

  for (const squish of squishies) {
    if (!squish.adoptedAt) {
      continue;
    }
    const month = squish.adoptedAt.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export async function getTenantDashboardStats(
  tenantId: string,
): Promise<TenantDashboardStats> {
  const [squishies, pairs, familyRows, orbitCount] = await Promise.all([
    listSquish(tenantId, { sort: "name", order: "asc" }),
    listRelationshipPairs(tenantId),
    listFamilies(tenantId),
    countOrbit(tenantId),
  ]);

  const photoIds = squishies.map((s) => s.id);
  const photos = await listPrimaryPhotosForSquishIds(tenantId, photoIds);
  const byId = new Map(squishies.map((s) => [s.id, s]));

  // Same grouping the constellation draws, so the numbers match the sky.
  const { islands } = layoutSky(
    squishies.map((s) => ({ ...s, photo: photos.get(s.id) ?? null })),
    pairs,
    familyRows.map((f) => ({
      id: f.id,
      name: f.name,
      emoji: f.emoji,
      color: f.color,
    })),
  );
  const families: FamilyStat[] = islands
    .filter((island) => island.kind !== "solo")
    .map((island) => ({
      id: island.familyId ?? island.id,
      name: island.familyId ? island.label : `${island.label}'s family`,
      emoji: island.emoji,
      color: island.colorName
        ? FAMILY_COLOR_HEX[island.colorName]
        : island.color,
      named: Boolean(island.familyId),
      size: island.memberIds.length,
      members: island.memberIds
        .map((id) => byId.get(id))
        .filter((s): s is Squish => Boolean(s))
        .map((s) => toSnapshot(s, photos)),
    }))
    .sort((a, b) => b.size - a.size);
  const soloIsland = islands.find((island) => island.kind === "solo");

  const withAdopted = squishies.filter(
    (s): s is Squish & { adoptedAt: string } => Boolean(s.adoptedAt),
  );
  const newest = [...withAdopted].sort((a, b) =>
    b.adoptedAt.localeCompare(a.adoptedAt),
  )[0];
  const longest = [...withAdopted].sort((a, b) =>
    a.adoptedAt.localeCompare(b.adoptedAt),
  )[0];

  const lonely = lonelySquishIds(
    squishies.map((s) => s.id),
    pairs,
  );

  return {
    collectionSize: squishies.length,
    families,
    familyCount: families.length,
    soloCount: soloIsland?.memberIds.length ?? 0,
    biggestFamily: families[0] ?? null,
    friendshipWeb: countFriendshipEdges(pairs),
    newestArrival: newest
      ? { ...toSnapshot(newest, photos), adoptedAt: newest.adoptedAt }
      : null,
    longestLoved: longest
      ? { ...toSnapshot(longest, photos), adoptedAt: longest.adoptedAt }
      : null,
    adoptionTimeline: buildAdoptionTimeline(squishies),
    lonelyCount: lonely.length,
    orbitCount,
  };
}
