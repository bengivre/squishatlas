import Link from "next/link";

import { SquishPhotoImg } from "@/components/squish/squish-photo-img";
import type { SquishPhoto } from "@/db/schema/squish-photo";
import { KIN_LABELS, type KinRole } from "@/lib/relationship/derive";
import { cn } from "@/lib/utils";

export type RelationshipChipItem = {
  squishId: string;
  name: string;
  role: KinRole;
  kind: "family" | "friendship";
  /** Implied by the tree rather than linked by hand. */
  derived: boolean;
  photo: SquishPhoto | null;
};

export function RelationshipChips({
  slug,
  tenantId,
  relationships,
}: {
  slug: string;
  tenantId: string;
  relationships: RelationshipChipItem[];
}) {
  if (relationships.length === 0) {
    return (
      <p className="text-star-dim text-sm">
        No family or friends linked yet. Add connections on the Family page.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {relationships.map((rel) => (
        <Link
          key={`${rel.squishId}-${rel.kind}`}
          href={`/t/${slug}/squishies/${rel.squishId}`}
          className={cn(
            "rel-chip",
            rel.kind === "family" ? "fam" : "fr",
            rel.derived && "derived",
          )}
          title={
            rel.derived ? "The family tree figured this one out" : undefined
          }
        >
          <span className="rel-av">
            {rel.photo ? (
              <SquishPhotoImg
                photo={rel.photo}
                tenantId={tenantId}
                squishId={rel.squishId}
                size="thumb"
                alt={rel.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-star-dim text-[10px]">?</span>
            )}
          </span>
          <span>
            {rel.name}
            <small>{KIN_LABELS[rel.role]}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}
