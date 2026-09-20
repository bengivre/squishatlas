"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  removeOrbitAction,
  updateOrbitAction,
} from "@/app/t/[slug]/orbit/actions";
import { inputClassName, labelClassName } from "@/components/tenant/tenant-nav";
import type { OrbitPage } from "@/db/schema/orbit";

export type OrbitListItem = {
  id: string;
  label: string | null;
  preferredPage: OrbitPage;
  savedTenant: {
    slug: string;
    displayName: string;
  };
};

const PAGE_OPTIONS: { value: OrbitPage; label: string }[] = [
  { value: "hub", label: "Hub" },
  { value: "gallery", label: "Gallery" },
  { value: "tree", label: "Family tree" },
];

const PAGE_LABEL: Record<OrbitPage, string> = {
  hub: "Hub",
  gallery: "Gallery",
  tree: "Family tree",
};

function publicPath(slug: string, page: OrbitPage): string {
  switch (page) {
    case "hub":
      return `/t/${slug}`;
    case "gallery":
      return `/t/${slug}/gallery`;
    case "tree":
      return `/t/${slug}/tree`;
  }
}

const saveButtonClassName =
  "rounded-input bg-moon-gold text-night-deep px-3 py-1.5 text-sm font-semibold disabled:opacity-60";

const ghostButtonClassName =
  "rounded-input border border-star-dim/30 px-3 py-1.5 text-sm font-semibold text-lamplight disabled:opacity-60";

export function OrbitList({
  slug,
  entries,
}: {
  slug: string;
  entries: OrbitListItem[];
}) {
  if (entries.length === 0) {
    return (
      <div className="stat-panel mt-4">
        <p className="text-star-dim text-sm">
          No shelves in your orbit yet — open a friend&apos;s public page to add
          one.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {entries.map((entry) => (
        <li key={entry.id}>
          <OrbitEntryCard slug={slug} entry={entry} />
        </li>
      ))}
    </ul>
  );
}

function OrbitEntryCard({
  slug,
  entry,
}: {
  slug: string;
  entry: OrbitListItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayName = entry.label?.trim() || entry.savedTenant.displayName;
  const href = publicPath(entry.savedTenant.slug, entry.preferredPage);

  function onRemove() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await removeOrbitAction(slug, entry.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateOrbitAction(slug, entry.id, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message ?? "Saved.");
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="stat-panel space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lamplight truncate text-base font-bold">
            {displayName}
          </p>
          {entry.label ? (
            <p className="text-star-dim truncate text-xs">
              {entry.savedTenant.displayName}
            </p>
          ) : null}
          <p className="text-star-dim mt-1 text-xs font-bold tracking-wide uppercase">
            Opens {PAGE_LABEL[entry.preferredPage]}
          </p>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={ghostButtonClassName}
        >
          Open
        </a>
      </div>

      {editing ? (
        <form onSubmit={onSave} className="space-y-3">
          <label className="block space-y-1">
            <span className={labelClassName}>Nickname</span>
            <input
              name="label"
              defaultValue={entry.label ?? ""}
              placeholder={entry.savedTenant.displayName}
              className={inputClassName}
              maxLength={80}
            />
          </label>
          <label className="block space-y-1">
            <span className={labelClassName}>Open to</span>
            <select
              name="preferredPage"
              defaultValue={entry.preferredPage}
              className={inputClassName}
            >
              {PAGE_OPTIONS.map((page) => (
                <option key={page.value} value={page.value}>
                  {page.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={saveButtonClassName}
              disabled={isPending}
            >
              Save
            </button>
            <button
              type="button"
              className={ghostButtonClassName}
              disabled={isPending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={ghostButtonClassName}
            disabled={isPending}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className={ghostButtonClassName}
            disabled={isPending}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      )}

      {error ? <p className="text-blush text-sm">{error}</p> : null}
      {message ? <p className="text-aurora text-sm">{message}</p> : null}
    </div>
  );
}
