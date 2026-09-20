import type { FamilyColor } from "@/db/schema/family";
import type { Squish } from "@/db/schema/squish";
import type { SquishPhoto } from "@/db/schema/squish-photo";
import type { RelationshipPair } from "@/lib/dal";

export type SquishWithPhoto = Squish & { photo: SquishPhoto | null };

export type FamilyInfo = {
  id: string;
  name: string;
  emoji: string;
  color: FamilyColor;
};

export type ConstellationData = {
  tenantId: string;
  squishies: SquishWithPhoto[];
  pairs: RelationshipPair[];
  families: FamilyInfo[];
};

export type Variant = "app" | "public";
