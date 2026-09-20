"use client";

import { useState } from "react";

import { clearMustChangePassword } from "./actions";
import { authClient } from "@/lib/auth-client";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const { error: changeError } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    if (changeError) {
      setError(
        changeError.message ??
          "Password didn't change — check your current password and try again.",
      );
      setPending(false);
      return;
    }

    try {
      await clearMustChangePassword();
    } catch {
      setError(
        "Password changed, but setup didn't finish — try signing in again.",
      );
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-night-deep px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-sheet bg-night-plum p-6"
      >
        <h1 className="text-lg text-lamplight">Change your password</h1>
        <p className="text-sm text-star-dim">
          Set a new password before continuing.
        </p>

        <label className="block space-y-1">
          <span className="text-sm text-star-dim">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-star-dim">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight"
          />
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
