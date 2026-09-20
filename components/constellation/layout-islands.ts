import { FAMILY_COLOR_HEX, type FamilyColor } from "@/db/schema/family";
import {
  relationshipEdgeClass,
  type RelationshipType,
} from "@/db/schema/relationship";
import {
  buildKinGraph,
  type KinGraph,
  type KinPair,
} from "@/lib/relationship/derive";
import { RELATIONSHIP_TYPE_LABELS } from "@/lib/relationship/inverse-resolution";

import type { FamilyInfo, SquishWithPhoto } from "./types";

/*
 * Island layout.
 *
 * Every family is an island: a proper genealogy (couples side by side, kids
 * hanging from one rail under them, grandparents a row up) sitting on its own
 * nebula. Islands are packed onto the sky in rows; squishies with no family
 * link at all drift together in a solo cloud.
 */

export const ORB_R = 36;
export const COL_W = 150;
export const ROW_H = 190;
export const ISLAND_PAD = 96;
export const ISLAND_GAP = 140;
export const SOLO_PER_ROW = 5;
export const SOLO_COL_W = 130;
export const SOLO_ROW_H = 130;

export type IslandKind = "family" | "unnamed" | "solo";

export type Island = {
  id: string;
  kind: IslandKind;
  familyId: string | null;
  label: string;
  emoji: string;
  color: string;
  colorName: FamilyColor | null;
  memberIds: string[];
  bounds: { x: number; y: number; w: number; h: number };
};

export type SkyNode = {
  id: string;
  x: number;
  y: number;
  generation: number;
  islandId: string;
};

export type SkyEdge =
  | {
      id: string;
      kind: "couple";
      a: string;
      b: string;
      d: string;
      recorded: boolean;
      cx: number;
      cy: number;
    }
  | {
      id: string;
      kind: "trunk";
      parents: string[];
      kids: string[];
      d: string;
      derived: boolean;
    }
  | {
      id: string;
      kind: "drop";
      parents: string[];
      child: string;
      d: string;
      derived: boolean;
    }
  | {
      id: string;
      kind: "kin";
      a: string;
      b: string;
      d: string;
      label: string;
      lx: number;
      ly: number;
    }
  | {
      id: string;
      kind: "bridge";
      a: string;
      b: string;
      d: string;
      label: string;
      lx: number;
      ly: number;
    }
  | {
      id: string;
      kind: "friend";
      a: string;
      b: string;
      d: string;
      best: boolean;
    };

export type SkyLayout = {
  islands: Island[];
  nodes: SkyNode[];
  edges: SkyEdge[];
  width: number;
  height: number;
  graph: KinGraph;
};

type RankEdge = { from: string; to: string; delta: number };

const RANK_DELTA: Partial<Record<RelationshipType, number>> = {
  mom: 1,
  dad: 1,
  aunt: 1,
  uncle: 1,
  grandma: 2,
  grandpa: 2,
};
const RANK_DELTA_INVERSE: Partial<Record<RelationshipType, number>> = {
  son: 1,
  daughter: 1,
  nephew: 1,
  niece: 1,
  grandson: 2,
  granddaughter: 2,
};

class UnionFind {
  private parent = new Map<string, string>();
  find(id: string): string {
    if (!this.parent.has(id)) this.parent.set(id, id);
    let cur = id;
    while (this.parent.get(cur) !== cur) {
      const next = this.parent.get(cur) ?? cur;
      this.parent.set(cur, this.parent.get(next) ?? next);
      cur = next;
    }
    return cur;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }
}

function byName(ids: Iterable<string>, names: Map<string, string>): string[] {
  return [...ids].sort((a, b) =>
    (names.get(a) ?? a).localeCompare(names.get(b) ?? b, undefined, {
      sensitivity: "base",
    }),
  );
}

/* ---------- generations ---------- */

function assignGenerations(
  memberIds: string[],
  rankEdges: RankEdge[],
  sameGen: UnionFind,
): Map<string, number> {
  const groupGen = new Map<string, number>();
  for (const id of memberIds) groupGen.set(sameGen.find(id), 0);

  const edges = rankEdges
    .map((e) => ({
      from: sameGen.find(e.from),
      to: sameGen.find(e.to),
      delta: e.delta,
    }))
    .filter((e) => e.from !== e.to);

  const passes = memberIds.length + 2;
  for (let i = 0; i < passes; i += 1) {
    let changed = false;
    for (const e of edges) {
      const next = (groupGen.get(e.from) ?? 0) + e.delta;
      if (next > (groupGen.get(e.to) ?? 0)) {
        groupGen.set(e.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Pull every ancestor as low as its descendants allow, so a grandparent
  // with no linked child sits one row above the grandkid, not two.
  for (let i = 0; i < passes; i += 1) {
    let changed = false;
    for (const e of edges) {
      let bound = Number.POSITIVE_INFINITY;
      for (const other of edges) {
        if (other.from === e.from) {
          bound = Math.min(bound, (groupGen.get(other.to) ?? 0) - other.delta);
        }
      }
      if (Number.isFinite(bound) && bound > (groupGen.get(e.from) ?? 0)) {
        groupGen.set(e.from, bound);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const gens = new Map<string, number>();
  for (const id of memberIds) gens.set(id, groupGen.get(sameGen.find(id)) ?? 0);
  const used = [...new Set(gens.values())].sort((a, b) => a - b);
  const rank = new Map(used.map((v, i) => [v, i]));
  for (const id of memberIds) gens.set(id, rank.get(gens.get(id) ?? 0) ?? 0);
  return gens;
}

/* ---------- one island ---------- */

type Placed = Map<string, { x: number; y: number; generation: number }>;

function unitWidth(count: number) {
  return count * COL_W;
}

function layoutIsland(
  memberIds: string[],
  graph: KinGraph,
  pairs: KinPair[],
  names: Map<string, string>,
): { pos: Placed; couples: [string, string][]; w: number; h: number } {
  const members = new Set(memberIds);
  const sameGen = new UnionFind();
  const rankEdges: RankEdge[] = [];

  for (const id of memberIds) sameGen.find(id);
  for (const [parent, kids] of graph.childrenOf) {
    if (!members.has(parent)) continue;
    for (const kid of kids) {
      if (members.has(kid)) rankEdges.push({ from: parent, to: kid, delta: 1 });
    }
  }
  for (const [a, partners] of graph.partnersOf) {
    if (!members.has(a)) continue;
    for (const b of partners) if (members.has(b)) sameGen.union(a, b);
  }
  for (const id of memberIds) {
    const root = graph.siblings.find(id);
    for (const other of memberIds) {
      if (other !== id && graph.siblings.find(other) === root)
        sameGen.union(id, other);
    }
  }
  for (const pair of pairs) {
    const { fromSquishId: a, toSquishId: b, forwardType } = pair;
    if (!members.has(a) || !members.has(b)) continue;
    if (relationshipEdgeClass(forwardType) !== "family") continue;
    if (forwardType === "cousin" || forwardType === "twin") {
      sameGen.union(a, b);
      continue;
    }
    const d = RANK_DELTA[forwardType];
    if (d) {
      rankEdges.push({ from: a, to: b, delta: d });
      continue;
    }
    const di = RANK_DELTA_INVERSE[forwardType];
    if (di) rankEdges.push({ from: b, to: a, delta: di });
  }

  const gens = assignGenerations(memberIds, rankEdges, sameGen);
  const maxGen = Math.max(0, ...memberIds.map((id) => gens.get(id) ?? 0));

  // Couples: partners on the same row. One partner each (first by name wins).
  const coupleOf = new Map<string, string>();
  const couples: [string, string][] = [];
  for (const a of byName(memberIds, names)) {
    if (coupleOf.has(a)) continue;
    for (const b of byName(graph.partnersOf.get(a) ?? [], names)) {
      if (b === a || !members.has(b) || coupleOf.has(b)) continue;
      if (gens.get(a) !== gens.get(b)) continue;
      coupleOf.set(a, b);
      coupleOf.set(b, a);
      couples.push([a, b]);
      break;
    }
  }

  const parentsOf = (id: string) =>
    [...(graph.parentsOf.get(id) ?? [])].filter((p) => members.has(p));
  const kidsOf = (id: string) =>
    [...(graph.childrenOf.get(id) ?? [])].filter((k) => members.has(k));

  type Unit = { ids: string[]; x: number; gen: number };
  const rows: Unit[][] = [];
  for (let gen = 0; gen <= maxGen; gen += 1) {
    const rowIds = byName(
      memberIds.filter((id) => gens.get(id) === gen),
      names,
    );
    const seen = new Set<string>();
    const units: Unit[] = [];
    for (const id of rowIds) {
      if (seen.has(id)) continue;
      const partner = coupleOf.get(id);
      const ids = partner && rowIds.includes(partner) ? [id, partner] : [id];
      // Mom on the left reads naturally for kids; otherwise keep name order.
      ids.sort((a, b) => {
        const ga = graph.gender.get(a);
        const gb = graph.gender.get(b);
        if (ga === gb) return 0;
        if (ga === "f") return -1;
        if (gb === "f") return 1;
        return 0;
      });
      ids.forEach((u) => seen.add(u));
      units.push({ ids, x: 0, gen });
    }
    rows.push(units);
  }

  const unitOf = new Map<string, Unit>();
  for (const row of rows)
    for (const u of row) for (const id of u.ids) unitOf.set(id, u);
  const memberX = (id: string) => {
    const u = unitOf.get(id);
    if (!u) return 0;
    return u.x + COL_W / 2 + u.ids.indexOf(id) * COL_W;
  };

  const resolve = (row: Unit[]) => {
    row.sort((a, b) => a.x - b.x);
    let right = Number.NEGATIVE_INFINITY;
    for (const u of row) {
      if (u.x < right) u.x = right;
      right = u.x + unitWidth(u.ids.length);
    }
  };

  // Units that share the same parents form a sibling block; the block is
  // centred under the parents as a whole so two kids straddle mom & dad
  // instead of the first one hogging the middle.
  const blockKey = (u: Unit) => {
    const ps = new Set<string>();
    for (const id of u.ids) for (const p of parentsOf(id)) ps.add(p);
    return ps.size ? [...ps].sort().join("+") : null;
  };
  const topDown = (gen: number) => {
    const row = rows[gen];
    const blocks = new Map<string, Unit[]>();
    const loose: Unit[] = [];
    for (const u of row) {
      const key = blockKey(u);
      if (key === null) loose.push(u);
      else blocks.set(key, [...(blocks.get(key) ?? []), u]);
    }
    for (const [key, units] of blocks) {
      const parentXs = key.split("+").map((p) => memberX(p));
      const center = parentXs.reduce((s, v) => s + v, 0) / parentXs.length;
      const total = units.reduce((s, u) => s + unitWidth(u.ids.length), 0);
      let cursor = center - total / 2;
      for (const u of units) {
        u.x = cursor;
        cursor += unitWidth(u.ids.length);
      }
    }
    const placed = row.filter((u) => !loose.includes(u));
    resolve(placed);
    // Units with no parent on this island go to the right of everyone else.
    let right = placed.length
      ? Math.max(...placed.map((u) => u.x + unitWidth(u.ids.length)))
      : 0;
    for (const u of loose) {
      u.x = right;
      right += unitWidth(u.ids.length);
    }
  };

  // Pass 1: top-down.
  rows[0]?.forEach((u, i) => {
    u.x = i === 0 ? 0 : rows[0][i - 1].x + unitWidth(rows[0][i - 1].ids.length);
  });
  for (let gen = 1; gen < rows.length; gen += 1) topDown(gen);
  // Pass 2: bottom-up, parents re-centre over their children (widens the
  // upper rows so branches don't all lean left).
  for (let gen = rows.length - 2; gen >= 0; gen -= 1) {
    for (const u of rows[gen]) {
      const xs: number[] = [];
      for (const id of u.ids) for (const k of kidsOf(id)) xs.push(memberX(k));
      if (xs.length) {
        u.x =
          xs.reduce((s, v) => s + v, 0) / xs.length -
          unitWidth(u.ids.length) / 2;
      }
    }
    resolve(rows[gen]);
  }
  // Pass 3: top-down once more so kids follow the parents that moved.
  for (let gen = 1; gen < rows.length; gen += 1) topDown(gen);

  const pos: Placed = new Map();
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (const row of rows) {
    for (const u of row) {
      u.ids.forEach((id, i) => {
        const x = u.x + COL_W / 2 + i * COL_W;
        pos.set(id, { x, y: u.gen * ROW_H + ROW_H / 2, generation: u.gen });
        minX = Math.min(minX, x - COL_W / 2);
        maxX = Math.max(maxX, x + COL_W / 2);
      });
    }
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = COL_W;
  }
  for (const p of pos.values()) p.x -= minX;

  return { pos, couples, w: maxX - minX, h: (maxGen + 1) * ROW_H };
}

/* ---------- grouping into islands ---------- */

function familyComponents(ids: string[], pairs: KinPair[]): string[][] {
  const uf = new UnionFind();
  for (const id of ids) uf.find(id);
  const idSet = new Set(ids);
  for (const p of pairs) {
    if (relationshipEdgeClass(p.forwardType) !== "family") continue;
    if (idSet.has(p.fromSquishId) && idSet.has(p.toSquishId))
      uf.union(p.fromSquishId, p.toSquishId);
  }
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const root = uf.find(id);
    groups.set(root, [...(groups.get(root) ?? []), id]);
  }
  return [...groups.values()];
}

function colorHex(color: FamilyColor | null, fallback: string) {
  return color ? FAMILY_COLOR_HEX[color] : fallback;
}

/* ---------- the whole sky ---------- */

export function layoutSky(
  squishies: SquishWithPhoto[],
  pairs: KinPair[],
  families: FamilyInfo[],
): SkyLayout {
  const names = new Map(squishies.map((s) => [s.id, s.name]));
  const familyById = new Map(families.map((f) => [f.id, f]));
  const graph = buildKinGraph(pairs);
  const ids = squishies.map((s) => s.id);

  // Islands: named family first. Members of a family component that have no
  // family yet inherit the family most of the component belongs to, so a kid
  // who links a new cousin sees them land on the right island right away.
  const islandOfSquish = new Map<string, string>();
  const groups = new Map<
    string,
    { kind: IslandKind; familyId: string | null; members: string[] }
  >();

  const components = familyComponents(ids, pairs);
  let unnamedCounter = 0;
  for (const component of components) {
    const counts = new Map<string, number>();
    for (const id of component) {
      const fid = squishies.find((s) => s.id === id)?.familyId ?? null;
      if (fid && familyById.has(fid))
        counts.set(fid, (counts.get(fid) ?? 0) + 1);
    }
    const dominant =
      [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    for (const id of component) {
      const own = squishies.find((s) => s.id === id)?.familyId ?? null;
      const fid = own && familyById.has(own) ? own : dominant;
      let key: string;
      if (fid) {
        key = `family-${fid}`;
        if (!groups.has(key))
          groups.set(key, { kind: "family", familyId: fid, members: [] });
      } else if (component.length >= 2) {
        key = `unnamed-${unnamedCounter}`;
        if (!groups.has(key))
          groups.set(key, { kind: "unnamed", familyId: null, members: [] });
      } else {
        key = "solo";
        if (!groups.has(key))
          groups.set(key, { kind: "solo", familyId: null, members: [] });
      }
      groups.get(key)!.members.push(id);
      islandOfSquish.set(id, key);
    }
    if (component.length >= 2 && !dominant) unnamedCounter += 1;
  }

  const nodes: SkyNode[] = [];
  const edges: SkyEdge[] = [];
  const islands: Island[] = [];

  type Laid = {
    key: string;
    group: { kind: IslandKind; familyId: string | null; members: string[] };
    pos: Placed;
    couples: [string, string][];
    w: number;
    h: number;
  };
  const laid: Laid[] = [];

  for (const [key, group] of groups) {
    if (group.kind === "solo") continue;
    const result = layoutIsland(group.members, graph, pairs, names);
    laid.push({ key, group, ...result });
  }
  laid.sort((a, b) => b.group.members.length - a.group.members.length);

  const solo = groups.get("solo");
  let soloW = 0;
  let soloH = 0;
  const soloPos: Placed = new Map();
  if (solo) {
    const ordered = byName(solo.members, names);
    ordered.forEach((id, i) => {
      const col = i % SOLO_PER_ROW;
      const row = Math.floor(i / SOLO_PER_ROW);
      // a little stagger so it reads as a cloud, not a grid
      soloPos.set(id, {
        x: col * SOLO_COL_W + SOLO_COL_W / 2,
        y: row * SOLO_ROW_H + SOLO_ROW_H / 2 + (col % 2) * 26,
        generation: 0,
      });
    });
    soloW = Math.min(ordered.length, SOLO_PER_ROW) * SOLO_COL_W;
    soloH = Math.ceil(ordered.length / SOLO_PER_ROW) * SOLO_ROW_H + 26;
  }

  // Shelf packing: rows no wider than the biggest island or ~1600px.
  const boxes = [
    ...laid.map((l) => ({
      key: l.key,
      w: l.w + ISLAND_PAD * 2,
      h: l.h + ISLAND_PAD * 2,
    })),
    ...(solo
      ? [{ key: "solo", w: soloW + ISLAND_PAD * 2, h: soloH + ISLAND_PAD * 2 }]
      : []),
  ];
  const limit = Math.max(1600, ...boxes.map((b) => b.w));
  const origin = new Map<string, { x: number; y: number }>();
  let cx = 0;
  let cy = 0;
  let rowH = 0;
  for (const b of boxes) {
    if (cx > 0 && cx + b.w > limit) {
      cx = 0;
      cy += rowH + ISLAND_GAP;
      rowH = 0;
    }
    origin.set(b.key, { x: cx, y: cy });
    cx += b.w + ISLAND_GAP;
    rowH = Math.max(rowH, b.h);
  }
  const width = Math.max(
    ...boxes.map((b) => (origin.get(b.key)?.x ?? 0) + b.w),
    0,
  );
  const height = cy + rowH;

  const place = (key: string, pos: Placed) => {
    const o = origin.get(key) ?? { x: 0, y: 0 };
    for (const [id, p] of pos) {
      nodes.push({
        id,
        x: o.x + ISLAND_PAD + p.x,
        y: o.y + ISLAND_PAD + p.y,
        generation: p.generation,
        islandId: key,
      });
    }
  };

  const nodeById = new Map<string, SkyNode>();
  const register = () => {
    nodeById.clear();
    for (const n of nodes) nodeById.set(n.id, n);
  };

  for (const l of laid) {
    place(l.key, l.pos);
    const fam = l.group.familyId ? familyById.get(l.group.familyId) : null;
    const heads = byName(
      l.group.members.filter((id) => (l.pos.get(id)?.generation ?? 0) === 0),
      names,
    );
    const label = fam
      ? fam.name
      : heads.length >= 2
        ? `${names.get(heads[0])} & ${names.get(heads[1])}`
        : `${names.get(heads[0] ?? l.group.members[0]) ?? "Family"}'s family`;
    const o = origin.get(l.key) ?? { x: 0, y: 0 };
    islands.push({
      id: l.key,
      kind: l.group.kind,
      familyId: l.group.familyId,
      label,
      emoji: fam?.emoji ?? "✦",
      color: colorHex(fam?.color ?? null, "#ffc96b"),
      colorName: fam?.color ?? null,
      memberIds: l.group.members,
      bounds: {
        x: o.x,
        y: o.y,
        w: l.w + ISLAND_PAD * 2,
        h: l.h + ISLAND_PAD * 2,
      },
    });
  }
  if (solo) {
    place("solo", soloPos);
    const o = origin.get("solo") ?? { x: 0, y: 0 };
    islands.push({
      id: "solo",
      kind: "solo",
      familyId: null,
      label: "Solo stars",
      emoji: "✦",
      color: "#8b84b8",
      colorName: null,
      memberIds: solo.members,
      bounds: {
        x: o.x,
        y: o.y,
        w: soloW + ISLAND_PAD * 2,
        h: soloH + ISLAND_PAD * 2,
      },
    });
  }
  register();

  /* ----- edges ----- */
  const drawnParentEdge = new Set<string>(); // "parent:child"

  for (const l of laid) {
    const members = new Set(l.group.members);
    // couples + their shared children on one rail
    for (const [a, b] of l.couples) {
      const A = nodeById.get(a)!;
      const B = nodeById.get(b)!;
      const [L, Rn] = A.x < B.x ? [A, B] : [B, A];
      const mx = (A.x + B.x) / 2;
      const y = A.y;
      edges.push({
        id: `couple-${a}-${b}`,
        kind: "couple",
        a,
        b,
        d: `M${L.x + ORB_R + 4} ${y} L${Rn.x - ORB_R - 4} ${y}`,
        recorded: graph.recordedPartners.has(a < b ? `${a}:${b}` : `${b}:${a}`),
        cx: mx,
        cy: y,
      });
      const kids = [...(graph.childrenOf.get(a) ?? [])].filter(
        (k) => members.has(k) && (graph.childrenOf.get(b)?.has(k) ?? false),
      );
      if (kids.length === 0) continue;
      const railY = y + ROW_H / 2 + 6;
      const xs = kids.map((k) => nodeById.get(k)!.x);
      const minX = Math.min(...xs, mx);
      const maxX = Math.max(...xs, mx);
      const derivedAll = kids.every(
        (k) =>
          graph.derivedParentEdges.has(`${a}:${k}`) ||
          graph.derivedParentEdges.has(`${b}:${k}`),
      );
      edges.push({
        id: `trunk-${a}-${b}`,
        kind: "trunk",
        parents: [a, b],
        kids,
        d: `M${mx} ${y + 14} L${mx} ${railY} M${minX} ${railY} L${maxX} ${railY}`,
        derived: derivedAll,
      });
      for (const k of kids) {
        const K = nodeById.get(k)!;
        edges.push({
          id: `drop-${k}`,
          kind: "drop",
          parents: [a, b],
          child: k,
          d: `M${K.x} ${railY} L${K.x} ${K.y - ORB_R - 6}`,
          derived:
            graph.derivedParentEdges.has(`${a}:${k}`) &&
            graph.derivedParentEdges.has(`${b}:${k}`),
        });
        drawnParentEdge.add(`${a}:${k}`);
        drawnParentEdge.add(`${b}:${k}`);
      }
    }
    // single-parent rails (one rail per parent, all their remaining kids)
    for (const parent of l.group.members) {
      const kids = [...(graph.childrenOf.get(parent) ?? [])].filter(
        (k) => members.has(k) && !drawnParentEdge.has(`${parent}:${k}`),
      );
      if (kids.length === 0) continue;
      const P = nodeById.get(parent)!;
      const railY = P.y + ROW_H / 2 + 6;
      const xs = kids.map((k) => nodeById.get(k)!.x);
      const minX = Math.min(...xs, P.x);
      const maxX = Math.max(...xs, P.x);
      edges.push({
        id: `trunk-${parent}`,
        kind: "trunk",
        parents: [parent],
        kids,
        d: `M${P.x} ${P.y + ORB_R + 6} L${P.x} ${railY} M${minX} ${railY} L${maxX} ${railY}`,
        derived: kids.every((k) =>
          graph.derivedParentEdges.has(`${parent}:${k}`),
        ),
      });
      for (const k of kids) {
        const K = nodeById.get(k)!;
        edges.push({
          id: `drop-${parent}-${k}`,
          kind: "drop",
          parents: [parent],
          child: k,
          d: `M${K.x} ${railY} L${K.x} ${K.y - ORB_R - 6}`,
          derived: graph.derivedParentEdges.has(`${parent}:${k}`),
        });
        drawnParentEdge.add(`${parent}:${k}`);
      }
    }
  }

  // Recorded links the tree can't express (a grandma with no parent in
  // between, an aunt with no sibling chain, cousins) get a soft labelled arc;
  // links across islands become bridges.
  const arc = (A: SkyNode, B: SkyNode, bend: number) => {
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2;
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const cx = mx + nx * bend;
    const cy = my + ny * bend;
    // Label a third of the way along, clear of the orb at the far end.
    const t = 0.34;
    const lx = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * cx + t * t * B.x;
    const ly = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * cy + t * t * B.y;
    return { d: `M${A.x} ${A.y} Q${cx} ${cy} ${B.x} ${B.y}`, lx, ly };
  };

  for (const pair of pairs) {
    const A = nodeById.get(pair.fromSquishId);
    const B = nodeById.get(pair.toSquishId);
    if (!A || !B) continue;
    const kind = relationshipEdgeClass(pair.forwardType);
    if (kind === "friendship") {
      const [top, bottom] = A.y <= B.y ? [A, B] : [B, A];
      const bend = Math.max(60, Math.abs(bottom.x - top.x) * 0.18);
      const d = `M${top.x} ${top.y + ORB_R} Q${(top.x + bottom.x) / 2} ${bottom.y + bend} ${bottom.x} ${bottom.y + ORB_R}`;
      edges.push({
        id: `friend-${pair.pairId}`,
        kind: "friend",
        a: pair.fromSquishId,
        b: pair.toSquishId,
        d,
        best: pair.forwardType === "bestFriend",
      });
      continue;
    }
    const t = pair.forwardType;
    const structural =
      t === "partner" ||
      t === "brother" ||
      t === "sister" ||
      t === "twin" ||
      ((t === "mom" || t === "dad") &&
        drawnParentEdge.has(`${pair.fromSquishId}:${pair.toSquishId}`)) ||
      ((t === "son" || t === "daughter") &&
        drawnParentEdge.has(`${pair.toSquishId}:${pair.fromSquishId}`));
    if (A.islandId !== B.islandId) {
      const { d, lx, ly } = arc(A, B, 80);
      edges.push({
        id: `bridge-${pair.pairId}`,
        kind: "bridge",
        a: pair.fromSquishId,
        b: pair.toSquishId,
        d,
        label: RELATIONSHIP_TYPE_LABELS[t],
        lx,
        ly,
      });
      continue;
    }
    if (structural) continue;
    const { d, lx, ly } = arc(A, B, 70);
    // Label from the older side, e.g. "Grandma", "Aunt", "Cousin".
    const older = RANK_DELTA[t]
      ? t
      : RANK_DELTA_INVERSE[t]
        ? pair.inverseType
        : t;
    edges.push({
      id: `kin-${pair.pairId}`,
      kind: "kin",
      a: pair.fromSquishId,
      b: pair.toSquishId,
      d,
      label: RELATIONSHIP_TYPE_LABELS[older],
      lx,
      ly,
    });
  }

  return { islands, nodes, edges, width, height, graph };
}

/** Bounding box of a set of nodes, padded. */
export function boundsOf(nodes: SkyNode[], pad = 80) {
  if (nodes.length === 0) return { x: 0, y: 0, w: 1, h: 1 };
  const minX = Math.min(...nodes.map((n) => n.x)) - pad;
  const maxX = Math.max(...nodes.map((n) => n.x)) + pad;
  const minY = Math.min(...nodes.map((n) => n.y)) - pad;
  const maxY = Math.max(...nodes.map((n) => n.y)) + pad;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
