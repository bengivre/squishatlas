"use client";

import { useState, useTransition } from "react";

import { inputClassName, labelClassName } from "@/components/tenant/tenant-nav";

import { unlockPublicPageAction } from "./actions";

export function UnlockForm({
  slug,
  next,
  displayName,
}: {
  slug: string;
  next: string;
  displayName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("password", password);
    formData.set("next", next);

    startTransition(async () => {
      const result = await unlockPublicPageAction(slug, formData);
      if (result && !result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-night-deep px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-sheet border border-star-dim/20 bg-night-plum shadow-glow-soft p-6"
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-star-dim">
            {displayName}
          </p>
          <h1 className="text-xl text-lamplight">A little password, please</h1>
          <p className="mt-2 text-sm text-star-dim">
            This page is shared gently — enter the password to peek inside.
          </p>
        </div>

        <label className="block space-y-1">
          <span className={labelClassName}>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {isPending ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
