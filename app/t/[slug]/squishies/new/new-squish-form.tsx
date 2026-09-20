"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { TenantAppShell } from "@/components/tenant/tenant-app-shell";
import {
  inputClassName,
  labelClassName,
} from "@/components/tenant/tenant-nav";
import { createSquishAction } from "../actions";

export function NewSquishForm({
  slug,
  displayName,
}: {
  slug: string;
  displayName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [story, setStory] = useState("");
  const [adoptedAt, setAdoptedAt] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("story", story);
    formData.set("adopted_at", adoptedAt);
    if (isFavorite) {
      formData.set("is_favorite", "true");
    }

    startTransition(async () => {
      const result = await createSquishAction(slug, formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.push(`/t/${slug}/squishies/${result.squishId}?added=1`);
      router.refresh();
    });
  }

  return (
    <TenantAppShell
      slug={slug}
      eyebrow={`${displayName}'s shelf`}
      title="New squish"
      activeTab="collection"
      backHref={`/t/${slug}/squishies`}
    >
      <form onSubmit={onSubmit} className="stat-panel space-y-4">
        <label className="block space-y-1">
          <span className={labelClassName}>Name</span>
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>Story</span>
          <textarea
            rows={4}
            value={story}
            onChange={(event) => setStory(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block space-y-1">
          <span className={labelClassName}>Adopted date</span>
          <input
            type="date"
            value={adoptedAt}
            onChange={(event) => setAdoptedAt(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-star-dim">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(event) => setIsFavorite(event.target.checked)}
            className="rounded border-star-dim/30"
          />
          Mark as favourite
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
          >
            {isPending ? "Adding…" : "Add a squish"}
          </button>
          <Link
            href={`/t/${slug}/squishies`}
            className="rounded-input border border-star-dim/30 px-4 py-2 text-sm text-lamplight"
          >
            Cancel
          </Link>
        </div>
      </form>
    </TenantAppShell>
  );
}
