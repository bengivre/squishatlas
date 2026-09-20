"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createFamilyAction,
  deleteFamilyAction,
  deleteRelationshipAction,
  moveToFamilyAction,
  updateFamilyAction,
} from "@/app/t/[slug]/family/actions";
import {
  FAMILY_COLOR_HEX,
  FAMILY_COLORS,
  type FamilyColor,
} from "@/db/schema/family";
import type { RelationshipPair } from "@/lib/dal";
import { RELATIONSHIP_TYPE_LABELS } from "@/lib/relationship/inverse-resolution";

import { MiniAvatar } from "./focus-peek";
import type { Island } from "./layout-islands";
import type { FamilyInfo, SquishWithPhoto } from "./types";
import { cn } from "@/lib/utils";

const EMOJI_CHOICES = [
  "🌙",
  "⭐",
  "🌈",
  "🫐",
  "🍓",
  "🌸",
  "🐝",
  "🦄",
  "🐳",
  "🍩",
  "🎈",
  "🪐",
];

function ColorPicker({
  value,
  onChange,
}: {
  value: FamilyColor;
  onChange: (c: FamilyColor) => void;
}) {
  return (
    <div className="swatches" role="radiogroup" aria-label="Family colour">
      {FAMILY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          className={cn("swatch", value === c && "is-on")}
          style={{
            background: FAMILY_COLOR_HEX[c],
            boxShadow: `0 0 10px ${FAMILY_COLOR_HEX[c]}`,
          }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: string) => void;
}) {
  return (
    <div className="emojis" role="radiogroup" aria-label="Family emoji">
      {EMOJI_CHOICES.map((e) => (
        <button
          key={e}
          type="button"
          role="radio"
          aria-checked={value === e}
          className={cn("emoji", value === e && "is-on")}
          onClick={() => onChange(e)}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function FamilyForm({
  slug,
  initial,
  memberIds,
  onSaved,
  onCancel,
}: {
  slug: string;
  initial?: FamilyInfo;
  memberIds?: string[];
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🌙");
  const [color, setColor] = useState<FamilyColor>(initial?.color ?? "gold");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = initial
        ? await updateFamilyAction(slug, initial.id, { name, emoji, color })
        : await createFamilyAction(
            slug,
            { name, emoji, color },
            memberIds ?? [],
          );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
      onSaved?.();
    });
  }

  return (
    <form
      className="family-form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <label className="field">
        <span>Family name</span>
        <input
          id={`family-name-${initial?.id ?? "new"}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Moonbeams"
          maxLength={40}
          required
        />
      </label>
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <ColorPicker value={color} onChange={setColor} />
      {error ? <p className="editor-error">{error}</p> : null}
      <div className="editor-actions">
        <button
          type="submit"
          className="pill is-primary"
          disabled={isPending || !name.trim()}
        >
          {isPending ? "Saving…" : initial ? "Save" : "Create family"}
        </button>
        {onCancel ? (
          <button type="button" className="pill" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function FamilyManager({
  slug,
  tenantId,
  families,
  islands,
  squishMap,
  startCreatingFor,
}: {
  slug: string;
  tenantId: string;
  families: FamilyInfo[];
  islands: Island[];
  squishMap: Map<string, SquishWithPhoto>;
  /** Island whose members should seed a new family. */
  startCreatingFor?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [creatingFor, setCreatingFor] = useState<string | null | "new">(
    startCreatingFor ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const unnamed = islands.filter((i) => i.kind === "unnamed");
  const seedIsland =
    creatingFor && creatingFor !== "new"
      ? islands.find((i) => i.id === creatingFor)
      : null;

  function remove(familyId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteFamilyAction(slug, familyId);
      if (!result.ok) setError(result.message);
      router.refresh();
    });
  }

  function leave(squishId: string) {
    startTransition(async () => {
      await moveToFamilyAction(slug, [squishId], null);
      router.refresh();
    });
  }

  return (
    <div className="families">
      {creatingFor ? (
        <div className="family-card is-new">
          <p className="family-card-title">
            {seedIsland ? `Name ${seedIsland.label}’s family` : "New family"}
          </p>
          {seedIsland ? (
            <div className="avatar-row">
              {seedIsland.memberIds.map((id) => {
                const s = squishMap.get(id);
                return s ? (
                  <MiniAvatar key={id} squish={s} tenantId={tenantId} />
                ) : null;
              })}
            </div>
          ) : null}
          <FamilyForm
            slug={slug}
            memberIds={seedIsland?.memberIds ?? []}
            onSaved={() => setCreatingFor(null)}
            onCancel={() => setCreatingFor(null)}
          />
        </div>
      ) : null}

      {families.map((f) => {
        const island = islands.find((i) => i.familyId === f.id);
        const members = island?.memberIds ?? [];
        return (
          <div key={f.id} className="family-card">
            {editing === f.id ? (
              <FamilyForm
                slug={slug}
                initial={f}
                onSaved={() => setEditing(null)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <>
                <div className="family-card-head">
                  <span
                    className="dot"
                    style={{
                      background: FAMILY_COLOR_HEX[f.color],
                      boxShadow: `0 0 8px ${FAMILY_COLOR_HEX[f.color]}`,
                    }}
                  />
                  <p className="family-card-title">
                    {f.emoji} {f.name}
                  </p>
                  <span className="family-card-count">{members.length}</span>
                  <button
                    type="button"
                    className="pill is-quiet"
                    onClick={() => setEditing(f.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="pill is-danger"
                    disabled={isPending}
                    onClick={() => remove(f.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="avatar-row">
                  {members.map((id) => {
                    const s = squishMap.get(id);
                    if (!s) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        className="avatar-btn"
                        title={`${s.name} — tap to make a solo star`}
                        disabled={isPending}
                        onClick={() => leave(id)}
                      >
                        <MiniAvatar squish={s} tenantId={tenantId} />
                        <small>{s.name}</small>
                      </button>
                    );
                  })}
                  {members.length === 0 ? (
                    <p className="picker-empty">
                      No squishies yet — link two and they’ll join.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        );
      })}

      {unnamed.map((island) => (
        <div key={island.id} className="family-card is-unnamed">
          <div className="family-card-head">
            <p className="family-card-title">✦ {island.label}</p>
            <span className="family-card-count">{island.memberIds.length}</span>
            <button
              type="button"
              className="pill is-primary"
              onClick={() => setCreatingFor(island.id)}
            >
              Name this family
            </button>
          </div>
        </div>
      ))}

      {!creatingFor ? (
        <button
          type="button"
          className="pill"
          onClick={() => setCreatingFor("new")}
        >
          + New empty family
        </button>
      ) : null}
      {error ? <p className="editor-error">{error}</p> : null}
    </div>
  );
}

export function LinkList({
  slug,
  tenantId,
  pairs,
  squishMap,
  filterId,
}: {
  slug: string;
  tenantId: string;
  pairs: RelationshipPair[];
  squishMap: Map<string, SquishWithPhoto>;
  filterId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const shown = pairs.filter(
    (p) =>
      !filterId || p.fromSquishId === filterId || p.toSquishId === filterId,
  );

  function remove(pairId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteRelationshipAction(slug, pairId);
      if (!result.ok) setError(result.message);
      setConfirm(null);
      router.refresh();
    });
  }

  if (shown.length === 0) {
    return <p className="picker-empty">No links yet.</p>;
  }

  return (
    <ul className="links">
      {shown.map((p) => {
        const from = squishMap.get(p.fromSquishId);
        const to = squishMap.get(p.toSquishId);
        if (!from || !to) return null;
        return (
          <li key={p.pairId} className="link-row">
            <MiniAvatar squish={from} tenantId={tenantId} />
            <span className="link-text">
              <b>{from.name}</b> is {to.name}&rsquo;s{" "}
              {RELATIONSHIP_TYPE_LABELS[p.forwardType].toLowerCase()}
            </span>
            <MiniAvatar squish={to} tenantId={tenantId} />
            {confirm === p.pairId ? (
              <>
                <button
                  type="button"
                  className="pill is-danger"
                  disabled={isPending}
                  onClick={() => remove(p.pairId)}
                >
                  {isPending ? "…" : "Yes, remove"}
                </button>
                <button
                  type="button"
                  className="pill is-quiet"
                  onClick={() => setConfirm(null)}
                >
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pill is-quiet"
                onClick={() => setConfirm(p.pairId)}
                aria-label={`Remove link between ${from.name} and ${to.name}`}
              >
                Remove
              </button>
            )}
          </li>
        );
      })}
      {error ? <li className="editor-error">{error}</li> : null}
    </ul>
  );
}
