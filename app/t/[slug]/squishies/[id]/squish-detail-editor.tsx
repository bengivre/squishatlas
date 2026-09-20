"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  inputClassName,
  labelClassName,
} from "@/components/tenant/tenant-nav";
import type { Squish } from "@/db/schema/squish";
import { deleteSquishAction, updateSquishAction } from "../actions";

export function SquishDetailEditor({
  slug,
  squish,
  showAddedMessage = false,
}: {
  slug: string;
  squish: Squish;
  showAddedMessage?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(
    showAddedMessage ? "Squish added." : null,
  );
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(squish.name);
  const [story, setStory] = useState(squish.story ?? "");
  const [adoptedAt, setAdoptedAt] = useState(squish.adoptedAt ?? "");
  const [isFavorite, setIsFavorite] = useState(squish.isFavorite);

  function buildFormData(overrides?: { isFavorite?: boolean }) {
    const formData = new FormData();
    formData.set("name", name);
    formData.set("story", story);
    formData.set("adopted_at", adoptedAt);
    if (overrides?.isFavorite ?? isFavorite) {
      formData.set("is_favorite", "true");
    }
    return formData;
  }

  function saveChanges(overrides?: { isFavorite?: boolean }) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateSquishAction(
        slug,
        squish.id,
        buildFormData(overrides),
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.message ?? "Changes saved.");
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm(`Delete “${squish.name}”? This cannot be undone.`)) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await deleteSquishAction(slug, squish.id);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.push(`/t/${slug}/squishies`);
      router.refresh();
    });
  }

  return (
    <section className="stat-panel space-y-4">
      <h2 className="stat-k">Edit this squish</h2>

      {message ? <p className="text-sm text-aurora">{message}</p> : null}
      {error ? <p className="text-sm text-blush">{error}</p> : null}

      <label className="block space-y-1">
        <span className={labelClassName}>Name</span>
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => saveChanges()}
          className={inputClassName}
          aria-label="Squish name"
        />
      </label>

      <label className="block space-y-1">
        <span className={labelClassName}>Story</span>
        <textarea
          rows={5}
          value={story}
          onChange={(event) => setStory(event.target.value)}
          onBlur={() => saveChanges()}
          placeholder="Tell their story…"
          className={`${inputClassName} resize-y`}
          aria-label="Story"
        />
      </label>

      <label className="block space-y-1">
        <span className={labelClassName}>Adopted date</span>
        <input
          type="date"
          value={adoptedAt}
          onChange={(event) => setAdoptedAt(event.target.value)}
          onBlur={() => saveChanges()}
          className={inputClassName}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-star-dim">
        <input
          type="checkbox"
          checked={isFavorite}
          onChange={(event) => {
            const checked = event.target.checked;
            setIsFavorite(checked);
            saveChanges({ isFavorite: checked });
          }}
          className="rounded border-star-dim/30"
        />
        Favourite
      </label>

      <div className="flex flex-wrap gap-2 border-t border-star-dim/20 pt-4">
        <button
          type="button"
          onClick={() => saveChanges()}
          disabled={isPending}
          className="rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="rounded-input border border-blush/40 px-4 py-2 text-sm text-blush disabled:opacity-60"
        >
          Delete squish
        </button>
      </div>
    </section>
  );
}
