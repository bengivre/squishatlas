"use client";

import { useState, useTransition } from "react";

import { toggleOrbitAction } from "@/app/t/[slug]/orbit/actions";
import type { OrbitPage } from "@/db/schema/orbit";

const actionClassName =
  "inline-flex min-h-10 items-center rounded-input border border-star-dim/30 px-3 text-sm font-bold text-lamplight transition hover:border-moon-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-gold disabled:opacity-60";

const savedClassName =
  "inline-flex min-h-10 items-center rounded-input border border-moon-gold/50 bg-moon-gold/15 px-3 text-sm font-bold text-moon-gold transition hover:border-moon-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-gold disabled:opacity-60";

export function OrbitToggleButton({
  ownerSlug,
  savedSlug,
  preferredPage,
  initialInOrbit,
}: {
  ownerSlug: string;
  savedSlug: string;
  preferredPage: OrbitPage;
  initialInOrbit: boolean;
}) {
  const [inOrbit, setInOrbit] = useState(initialInOrbit);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    setError(null);
    startTransition(async () => {
      const result = await toggleOrbitAction(
        ownerSlug,
        savedSlug,
        preferredPage,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (typeof result.inOrbit === "boolean") {
        setInOrbit(result.inOrbit);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className={inOrbit ? savedClassName : actionClassName}
        disabled={isPending}
        onClick={onToggle}
        aria-pressed={inOrbit}
      >
        {isPending
          ? "…"
          : inOrbit
            ? "In your orbit"
            : "Add to your orbit"}
      </button>
      {error ? (
        <p className="text-blush max-w-[12rem] text-right text-xs">{error}</p>
      ) : null}
    </div>
  );
}
