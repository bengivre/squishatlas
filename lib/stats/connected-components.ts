import {
  relationshipEdgeClass,
  type RelationshipType,
} from "@/db/schema/relationship";
import type { RelationshipPair } from "@/lib/dal";

export type FamilyComponent = {
  memberIds: string[];
  size: number;
};

export type BiggestFamily = {
  size: number;
  memberIds: string[];
};

/**
 * Connected components over family edges only (excludes friend/bestFriend).
 * Pure application-code Union-Find — no recursive CTE.
 */
export function computeFamilyComponents(
  squishIds: string[],
  pairs: RelationshipPair[],
): FamilyComponent[] {
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  for (const id of squishIds) {
    parent.set(id, id);
    rank.set(id, 0);
  }

  function find(id: string): string {
    let current = id;
    while (parent.get(current) !== current) {
      const next = parent.get(current)!;
      parent.set(current, parent.get(next)!);
      current = next;
    }
    return current;
  }

  function union(a: string, b: string) {
    if (!parent.has(a) || !parent.has(b)) {
      return;
    }
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) {
      return;
    }
    const rankA = rank.get(rootA) ?? 0;
    const rankB = rank.get(rootB) ?? 0;
    if (rankA < rankB) {
      parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      parent.set(rootB, rootA);
    } else {
      parent.set(rootB, rootA);
      rank.set(rootA, rankA + 1);
    }
  }

  for (const pair of pairs) {
    if (relationshipEdgeClass(pair.forwardType) !== "family") {
      continue;
    }
    union(pair.fromSquishId, pair.toSquishId);
  }

  const groups = new Map<string, string[]>();
  for (const id of squishIds) {
    const root = find(id);
    const members = groups.get(root) ?? [];
    members.push(id);
    groups.set(root, members);
  }

  return [...groups.values()]
    .map((memberIds) => ({
      memberIds,
      size: memberIds.length,
    }))
    .sort((a, b) => b.size - a.size);
}

export function findBiggestFamily(
  squishIds: string[],
  pairs: RelationshipPair[],
): BiggestFamily | null {
  const components = computeFamilyComponents(squishIds, pairs);
  // A "family" needs at least 2 members connected by family edges.
  const family = components.find((component) => component.size >= 2);
  if (!family) {
    return null;
  }
  return {
    size: family.size,
    memberIds: family.memberIds,
  };
}

export function countFriendshipEdges(pairs: RelationshipPair[]): number {
  return pairs.filter(
    (pair) => relationshipEdgeClass(pair.forwardType) === "friendship",
  ).length;
}

export function lonelySquishIds(
  squishIds: string[],
  pairs: RelationshipPair[],
): string[] {
  const linked = new Set<string>();
  for (const pair of pairs) {
    linked.add(pair.fromSquishId);
    linked.add(pair.toSquishId);
  }
  return squishIds.filter((id) => !linked.has(id));
}

export function isFamilyRelationshipType(type: RelationshipType): boolean {
  return relationshipEdgeClass(type) === "family";
}
