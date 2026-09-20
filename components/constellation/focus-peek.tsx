"use client";

import Link from "next/link";

import { SquishPhotoImg } from "@/components/squish/squish-photo-img";
import {
  KIN_GROUP_LABELS,
  KIN_GROUP_ORDER,
  KIN_LABELS,
  kinGroup,
  type Kin,
} from "@/lib/relationship/derive";

import type { Island } from "./layout-islands";
import type { SquishWithPhoto, Variant } from "./types";
import { cn } from "@/lib/utils";

export function MiniAvatar({
  squish,
  tenantId,
  className = "",
}: {
  squish: SquishWithPhoto;
  tenantId: string;
  className?: string;
}) {
  return (
    <span className={`mini-av ${className}`}>
      {squish.photo ? (
        <SquishPhotoImg
          photo={squish.photo}
          tenantId={tenantId}
          squishId={squish.id}
          size="thumb"
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{squish.name.slice(0, 1)}</span>
      )}
    </span>
  );
}

export function FocusPeek({
  tenantId,
  slug,
  variant,
  squish,
  island,
  kin,
  squishMap,
  onSelect,
  onOrbit,
  onAddRelative,
  onEditLinks,
  onClose,
}: {
  tenantId: string;
  slug?: string;
  variant: Variant;
  squish: SquishWithPhoto;
  island: Island | null;
  kin: Kin[];
  squishMap: Map<string, SquishWithPhoto>;
  onSelect: (id: string) => void;
  onOrbit: () => void;
  onAddRelative?: () => void;
  onEditLinks?: () => void;
  onClose: () => void;
}) {
  const groups = KIN_GROUP_ORDER.map((group) => ({
    group,
    items: kin.filter(
      (k) => kinGroup(k.role) === group && squishMap.has(k.otherId),
    ),
  })).filter((g) => g.items.length > 0);

  const familyLine = island
    ? island.kind === "solo"
      ? "✦ Solo star · no family yet"
      : `${island.emoji} ${island.label}`
    : null;

  return (
    <aside
      className="peek is-open"
      aria-live="polite"
      aria-label={`${squish.name} details`}
    >
      <div className="peek-head">
        <MiniAvatar
          squish={squish}
          tenantId={tenantId}
          className="peek-avatar"
        />
        <div className="min-w-0 flex-1">
          <h3 className="peek-name">
            {squish.name}
            {squish.isFavorite ? (
              <span className="peek-fav" aria-label="favourite">
                {" "}
                ★
              </span>
            ) : null}
          </h3>
          {familyLine ? (
            <p className="peek-family">
              {island && island.kind !== "solo" ? (
                <span
                  className="dot"
                  style={{
                    background: island.color,
                    boxShadow: `0 0 8px ${island.color}`,
                  }}
                />
              ) : null}
              {familyLine}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="peek-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="peek-empty">
          {squish.name} hasn&apos;t met anyone yet.
          {variant === "app"
            ? " Link a mom, a twin or a best friend to light them up."
            : ""}
        </p>
      ) : (
        <div className="peek-groups">
          {groups.map(({ group, items }) => (
            <div key={group} className="peek-group">
              <div
                className={cn("peek-k", group === "friends" && "is-friends")}
              >
                {KIN_GROUP_LABELS[group]}
              </div>
              <div className="chips">
                {items.map((k) => {
                  const other = squishMap.get(k.otherId)!;
                  return (
                    <button
                      key={`${k.otherId}-${k.kind}`}
                      type="button"
                      className={cn(
                        "chip",
                        k.kind === "friendship" && "is-friend",
                        k.derived && "is-derived",
                      )}
                      onClick={() => onSelect(k.otherId)}
                      title={
                        k.derived
                          ? "The tree figured this one out"
                          : "Linked by you"
                      }
                    >
                      <MiniAvatar squish={other} tenantId={tenantId} />
                      <span className="chip-name">{other.name}</span>
                      <b>· {KIN_LABELS[k.role]}</b>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="peek-actions">
        <button type="button" className="pill" onClick={onOrbit}>
          ◎ {squish.name}&rsquo;s world
        </button>
        {variant === "app" && onAddRelative ? (
          <button type="button" className="pill" onClick={onAddRelative}>
            ✦ Add a relative
          </button>
        ) : null}
        {variant === "app" && onEditLinks && kin.some((k) => !k.derived) ? (
          <button type="button" className="pill is-quiet" onClick={onEditLinks}>
            Edit links
          </button>
        ) : null}
        {variant === "app" && slug ? (
          <Link
            href={`/t/${slug}/squishies/${squish.id}`}
            className="pill is-primary"
          >
            Open {squish.name}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
