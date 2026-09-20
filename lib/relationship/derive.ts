import {
  relationshipEdgeClass,
  type RelationshipType,
} from "@/db/schema/relationship";

import { RELATIONSHIP_TYPE_LABELS } from "./inverse-resolution";

/**
 * Kinship derivation.
 *
 * Kids record a handful of links ("Luna is Pip's mom", "Nana is Luna's mom").
 * Everything the tree implies — Nana is Pip's grandma, Mochi is Pip's brother,
 * Nori is Pip's aunt — is derived here, once, from the recorded pairs. Derived
 * kin are flagged so the UI can show them a touch softer than what was linked
 * by hand, and the layout uses the same graph so the picture and the words
 * never disagree.
 */

/** Minimal pair shape; matches `RelationshipPair` from the DAL. */
export type KinPair = {
  pairId: string;
  fromSquishId: string;
  toSquishId: string;
  forwardType: RelationshipType;
  inverseType: RelationshipType;
};

export type Gender = "f" | "m" | null;

/** A recorded type, or a gender-neutral role when the gender is unknown. */
export type KinRole =
  | RelationshipType
  | "parent"
  | "child"
  | "sibling"
  | "grandparent"
  | "grandchild"
  | "auntOrUncle"
  | "nieceOrNephew";

export const KIN_LABELS: Record<KinRole, string> = {
  ...RELATIONSHIP_TYPE_LABELS,
  parent: "Parent",
  child: "Child",
  sibling: "Sibling",
  grandparent: "Grandparent",
  grandchild: "Grandchild",
  auntOrUncle: "Aunt or uncle",
  nieceOrNephew: "Niece or nephew",
};

export type KinGroup =
  | "parents"
  | "partner"
  | "siblings"
  | "kids"
  | "grandparents"
  | "grandkids"
  | "extended"
  | "friends";

export const KIN_GROUP_ORDER: KinGroup[] = [
  "parents",
  "partner",
  "siblings",
  "kids",
  "grandparents",
  "grandkids",
  "extended",
  "friends",
];

export const KIN_GROUP_LABELS: Record<KinGroup, string> = {
  parents: "Parents",
  partner: "Partner",
  siblings: "Siblings",
  kids: "Kids",
  grandparents: "Grandparents",
  grandkids: "Grandkids",
  extended: "Family",
  friends: "Friends",
};

export function kinGroup(role: KinRole): KinGroup {
  switch (role) {
    case "mom":
    case "dad":
    case "parent":
      return "parents";
    case "partner":
      return "partner";
    case "brother":
    case "sister":
    case "twin":
    case "sibling":
      return "siblings";
    case "son":
    case "daughter":
    case "child":
      return "kids";
    case "grandma":
    case "grandpa":
    case "grandparent":
      return "grandparents";
    case "grandson":
    case "granddaughter":
    case "grandchild":
      return "grandkids";
    case "friend":
    case "bestFriend":
      return "friends";
    default:
      return "extended";
  }
}

export type Kin = {
  otherId: string;
  role: KinRole;
  kind: "family" | "friendship";
  /** True when the tree implies it; false when a person linked it. */
  derived: boolean;
  pairId: string | null;
};

const FEMININE = new Set<RelationshipType>([
  "mom",
  "daughter",
  "sister",
  "grandma",
  "granddaughter",
  "aunt",
  "niece",
]);
const MASCULINE = new Set<RelationshipType>([
  "dad",
  "son",
  "brother",
  "grandpa",
  "grandson",
  "uncle",
  "nephew",
]);
const SIBLING_TYPES = new Set<RelationshipType>(["brother", "sister", "twin"]);

class UnionFind {
  private parent = new Map<string, string>();

  find(id: string): string {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
    }
    let current = id;
    while (this.parent.get(current) !== current) {
      const next = this.parent.get(current) ?? current;
      this.parent.set(current, this.parent.get(next) ?? next);
      current = next;
    }
    return current;
  }

  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) {
      this.parent.set(rb, ra);
    }
  }
}

function addTo(map: Map<string, Set<string>>, key: string, value: string) {
  const set = map.get(key) ?? new Set<string>();
  set.add(value);
  map.set(key, set);
}

export type KinGraph = {
  /** parent → children, recorded and derived */
  childrenOf: Map<string, Set<string>>;
  /** child → parents, recorded and derived */
  parentsOf: Map<string, Set<string>>;
  /** Recorded partners plus co-parents. */
  partnersOf: Map<string, Set<string>>;
  /** Recorded partner pairs only (drawn with a heart even without kids). */
  recordedPartners: Set<string>;
  /** Parent edges that were derived from a sibling, as "parent:child". */
  derivedParentEdges: Set<string>;
  gender: Map<string, Gender>;
  siblings: UnionFind;
  pairs: KinPair[];
};

function pairKey(a: string, b: string) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function buildKinGraph(pairs: KinPair[]): KinGraph {
  const childrenOf = new Map<string, Set<string>>();
  const parentsOf = new Map<string, Set<string>>();
  const partnersOf = new Map<string, Set<string>>();
  const recordedPartners = new Set<string>();
  const derivedParentEdges = new Set<string>();
  const gender = new Map<string, Gender>();
  const siblings = new UnionFind();

  const setGender = (id: string, type: RelationshipType) => {
    if (FEMININE.has(type)) {
      gender.set(id, "f");
    } else if (MASCULINE.has(type)) {
      gender.set(id, "m");
    } else if (!gender.has(id)) {
      gender.set(id, null);
    }
  };

  for (const pair of pairs) {
    const { fromSquishId: a, toSquishId: b, forwardType, inverseType } = pair;
    setGender(a, forwardType);
    setGender(b, inverseType);

    if (relationshipEdgeClass(forwardType) !== "family") {
      continue;
    }

    if (forwardType === "mom" || forwardType === "dad") {
      addTo(childrenOf, a, b);
      addTo(parentsOf, b, a);
    } else if (forwardType === "son" || forwardType === "daughter") {
      addTo(childrenOf, b, a);
      addTo(parentsOf, a, b);
    } else if (forwardType === "partner") {
      addTo(partnersOf, a, b);
      addTo(partnersOf, b, a);
      recordedPartners.add(pairKey(a, b));
    } else if (SIBLING_TYPES.has(forwardType)) {
      siblings.union(a, b);
    }
  }

  // Children of one parent are siblings; siblings share parents. Run until
  // nothing changes (two passes is plenty for real collections).
  for (let pass = 0; pass < 3; pass += 1) {
    for (const kids of childrenOf.values()) {
      const [first, ...rest] = [...kids];
      for (const kid of rest) {
        siblings.union(first, kid);
      }
    }

    const groups = new Map<string, Set<string>>();
    for (const id of new Set([
      ...parentsOf.keys(),
      ...[...childrenOf.values()].flatMap((set) => [...set]),
    ])) {
      addTo(groups, siblings.find(id), id);
    }

    let changed = false;
    for (const group of groups.values()) {
      for (const g of ["f", "m"] as const) {
        const candidates = new Set<string>();
        for (const member of group) {
          for (const parent of parentsOf.get(member) ?? []) {
            if (gender.get(parent) === g) {
              candidates.add(parent);
            }
          }
        }
        // Only when the group agrees on a single mom (or dad) — half siblings
        // keep their own.
        if (candidates.size !== 1) {
          continue;
        }
        const [parent] = [...candidates];
        for (const member of group) {
          if (member === parent) {
            continue;
          }
          const hasOne = [...(parentsOf.get(member) ?? [])].some(
            (p) => gender.get(p) === g,
          );
          if (hasOne) {
            continue;
          }
          addTo(parentsOf, member, parent);
          addTo(childrenOf, parent, member);
          derivedParentEdges.add(`${parent}:${member}`);
          changed = true;
        }
      }
    }
    if (!changed) {
      break;
    }
  }

  // Two parents of the same child are a couple, recorded or not.
  for (const parents of parentsOf.values()) {
    const list = [...parents];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        addTo(partnersOf, list[i], list[j]);
        addTo(partnersOf, list[j], list[i]);
      }
    }
  }

  return {
    childrenOf,
    parentsOf,
    partnersOf,
    recordedPartners,
    derivedParentEdges,
    gender,
    siblings,
    pairs,
  };
}

function gendered(
  base:
    | "parent"
    | "child"
    | "sibling"
    | "grandparent"
    | "grandchild"
    | "auntOrUncle"
    | "nieceOrNephew",
  g: Gender | undefined,
): KinRole {
  const table: Record<typeof base, [RelationshipType, RelationshipType]> = {
    parent: ["mom", "dad"],
    child: ["daughter", "son"],
    sibling: ["sister", "brother"],
    grandparent: ["grandma", "grandpa"],
    grandchild: ["granddaughter", "grandson"],
    auntOrUncle: ["aunt", "uncle"],
    nieceOrNephew: ["niece", "nephew"],
  };
  if (g === "f") {
    return table[base][0];
  }
  if (g === "m") {
    return table[base][1];
  }
  return base;
}

/** Role of `other` as seen from `centerId` for a recorded pair. */
export function roleTowardCenter(
  centerId: string,
  pair: KinPair,
): RelationshipType | null {
  if (pair.fromSquishId === centerId) {
    return pair.inverseType;
  }
  if (pair.toSquishId === centerId) {
    return pair.forwardType;
  }
  return null;
}

export function siblingsOf(graph: KinGraph, id: string): Set<string> {
  const root = graph.siblings.find(id);
  const out = new Set<string>();
  for (const candidate of new Set([
    ...graph.parentsOf.keys(),
    ...graph.childrenOf.keys(),
    ...graph.pairs.flatMap((p) => [p.fromSquishId, p.toSquishId]),
  ])) {
    if (candidate !== id && graph.siblings.find(candidate) === root) {
      out.add(candidate);
    }
  }
  return out;
}

/**
 * Everyone related to `id`, recorded links first, then what the tree implies.
 * One entry per (other, kind): a cousin who is also a best friend appears twice.
 */
export function kinOf(graph: KinGraph, id: string): Kin[] {
  const family = new Map<string, Kin>();
  const friends = new Map<string, Kin>();

  for (const pair of graph.pairs) {
    const role = roleTowardCenter(id, pair);
    if (!role) {
      continue;
    }
    const otherId =
      pair.fromSquishId === id ? pair.toSquishId : pair.fromSquishId;
    const kind = relationshipEdgeClass(role);
    const entry: Kin = {
      otherId,
      role,
      kind,
      derived: false,
      pairId: pair.pairId,
    };
    (kind === "friendship" ? friends : family).set(otherId, entry);
  }

  const propose = (otherId: string, role: KinRole) => {
    if (otherId === id || family.has(otherId)) {
      return;
    }
    family.set(otherId, {
      otherId,
      role,
      kind: "family",
      derived: true,
      pairId: null,
    });
  };

  const g = (x: string) => graph.gender.get(x);
  const parents = graph.parentsOf.get(id) ?? new Set<string>();
  const children = graph.childrenOf.get(id) ?? new Set<string>();

  for (const p of parents) propose(p, gendered("parent", g(p)));
  for (const p of graph.partnersOf.get(id) ?? []) propose(p, "partner");
  for (const s of siblingsOf(graph, id)) propose(s, gendered("sibling", g(s)));
  for (const c of children) propose(c, gendered("child", g(c)));

  for (const p of parents) {
    for (const gp of graph.parentsOf.get(p) ?? []) {
      propose(gp, gendered("grandparent", g(gp)));
    }
  }
  for (const c of children) {
    for (const gc of graph.childrenOf.get(c) ?? []) {
      propose(gc, gendered("grandchild", g(gc)));
    }
  }

  const auntsUncles = new Set<string>();
  for (const p of parents) {
    for (const s of siblingsOf(graph, p)) {
      auntsUncles.add(s);
      for (const partner of graph.partnersOf.get(s) ?? []) {
        auntsUncles.add(partner);
      }
    }
  }
  for (const au of auntsUncles) {
    if (parents.has(au)) {
      continue;
    }
    propose(au, gendered("auntOrUncle", g(au)));
  }
  for (const s of siblingsOf(graph, id)) {
    for (const n of graph.childrenOf.get(s) ?? []) {
      propose(n, gendered("nieceOrNephew", g(n)));
    }
  }
  for (const au of auntsUncles) {
    for (const cousin of graph.childrenOf.get(au) ?? []) {
      propose(cousin, "cousin");
    }
  }

  const all = [...family.values(), ...friends.values()];
  const order = (kin: Kin) => KIN_GROUP_ORDER.indexOf(kinGroup(kin.role));
  return all.sort((a, b) => {
    const byGroup = order(a) - order(b);
    if (byGroup !== 0) {
      return byGroup;
    }
    return Number(a.derived) - Number(b.derived);
  });
}

/** Small helper for pages that only have a flat pair list. */
export function kinFor(id: string, pairs: KinPair[]): Kin[] {
  return kinOf(buildKinGraph(pairs), id);
}
