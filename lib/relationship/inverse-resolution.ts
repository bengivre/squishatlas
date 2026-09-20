import type { RelationshipType } from "@/db/schema/relationship";

export type InverseResolution =
  | {
      kind: "resolved";
      inverseType: RelationshipType;
    }
  | {
      kind: "prompt";
      prompt: string;
      options: [RelationshipType, RelationshipType];
      defaultOption: RelationshipType;
    };

const SYMMETRIC_TYPES = new Set<RelationshipType>([
  "cousin",
  "friend",
  "bestFriend",
  "twin",
  "partner",
]);

const PROMPT_TABLE: Partial<
  Record<
    RelationshipType,
    {
      prompt: string;
      options: [RelationshipType, RelationshipType];
      defaultOption: RelationshipType;
    }
  >
> = {
  brother: {
    prompt: "brother or sister?",
    options: ["brother", "sister"],
    defaultOption: "brother",
  },
  sister: {
    prompt: "brother or sister?",
    options: ["brother", "sister"],
    defaultOption: "sister",
  },
  mom: {
    prompt: "son or daughter?",
    options: ["son", "daughter"],
    defaultOption: "daughter",
  },
  dad: {
    prompt: "son or daughter?",
    options: ["son", "daughter"],
    defaultOption: "son",
  },
  son: {
    prompt: "mom or dad?",
    options: ["mom", "dad"],
    defaultOption: "mom",
  },
  daughter: {
    prompt: "mom or dad?",
    options: ["mom", "dad"],
    defaultOption: "dad",
  },
  grandma: {
    prompt: "grandson or granddaughter?",
    options: ["grandson", "granddaughter"],
    defaultOption: "granddaughter",
  },
  grandpa: {
    prompt: "grandson or granddaughter?",
    options: ["grandson", "granddaughter"],
    defaultOption: "grandson",
  },
  aunt: {
    prompt: "nephew or niece?",
    options: ["nephew", "niece"],
    defaultOption: "niece",
  },
  uncle: {
    prompt: "nephew or niece?",
    options: ["nephew", "niece"],
    defaultOption: "nephew",
  },
  grandson: {
    prompt: "grandma or grandpa?",
    options: ["grandma", "grandpa"],
    defaultOption: "grandma",
  },
  granddaughter: {
    prompt: "grandma or grandpa?",
    options: ["grandma", "grandpa"],
    defaultOption: "grandpa",
  },
  nephew: {
    prompt: "aunt or uncle?",
    options: ["aunt", "uncle"],
    defaultOption: "aunt",
  },
  niece: {
    prompt: "aunt or uncle?",
    options: ["aunt", "uncle"],
    defaultOption: "uncle",
  },
};

export function resolveInverseType(
  forwardType: RelationshipType,
): InverseResolution {
  if (SYMMETRIC_TYPES.has(forwardType)) {
    return {
      kind: "resolved",
      inverseType: forwardType,
    };
  }

  const promptConfig = PROMPT_TABLE[forwardType];

  if (!promptConfig) {
    throw new Error(`No inverse resolution defined for type: ${forwardType}`);
  }

  return {
    kind: "prompt",
    ...promptConfig,
  };
}

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  mom: "Mom",
  dad: "Dad",
  son: "Son",
  daughter: "Daughter",
  partner: "Partner",
  brother: "Brother",
  sister: "Sister",
  twin: "Twin",
  grandma: "Grandma",
  grandpa: "Grandpa",
  grandson: "Grandson",
  granddaughter: "Granddaughter",
  aunt: "Aunt",
  uncle: "Uncle",
  nephew: "Nephew",
  niece: "Niece",
  cousin: "Cousin",
  friend: "Friend",
  bestFriend: "Best friend",
};

/** Emoji used on the big role tiles in the link editor. */
export const RELATIONSHIP_TYPE_EMOJI: Record<RelationshipType, string> = {
  mom: "👩",
  dad: "👨",
  son: "👦",
  daughter: "👧",
  partner: "💞",
  brother: "🧑",
  sister: "👧",
  twin: "👯",
  grandma: "👵",
  grandpa: "👴",
  grandson: "🧒",
  granddaughter: "🧒",
  aunt: "👩‍🦱",
  uncle: "🧔",
  nephew: "🧒",
  niece: "🧒",
  cousin: "🤝",
  friend: "⭐",
  bestFriend: "💫",
};

export const RELATIONSHIP_TYPE_GROUPS: {
  label: string;
  types: RelationshipType[];
}[] = [
  {
    label: "Parents & children",
    types: ["mom", "dad", "son", "daughter"],
  },
  {
    label: "Partner",
    types: ["partner"],
  },
  {
    label: "Siblings",
    types: ["brother", "sister", "twin"],
  },
  {
    label: "Grandparents & grandchildren",
    types: ["grandma", "grandpa", "grandson", "granddaughter"],
  },
  {
    label: "Extended family",
    types: ["aunt", "uncle", "nephew", "niece", "cousin"],
  },
  {
    label: "Friends",
    types: ["friend", "bestFriend"],
  },
];
