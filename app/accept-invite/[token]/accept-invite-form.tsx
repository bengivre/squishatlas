"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { acceptInviteAction } from "./actions";
import { authClient } from "@/lib/auth-client";

export function AcceptInviteForm({
  token,
  email,
  tenantDisplayName,
  tenantSlug,
}: {
  token: string;
  email: string;
  tenantDisplayName: string;
  tenantSlug: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    const result = await acceptInviteAction(token, formData);

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    const { error: signInError } = await authClient.signIn.email({
      email: result.email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message ??
          "Your account is ready — sign in from the login page to continue.",
      );
      setPending(false);
      return;
    }

    router.push(`/t/${tenantSlug}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm space-y-4 rounded-sheet bg-night-plum p-6"
    >
      <h1 className="text-lg text-lamplight">Join {tenantDisplayName}</h1>
      <p className="text-sm text-star-dim">
        Set a password for <span className="text-lamplight">{email}</span> to
        finish accepting your invite.
      </p>

      <label className="block space-y-1">
        <span className="text-sm text-star-dim">Password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-star-dim">Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight"
        />
      </label>

      {error ? <p className="text-sm text-blush">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Accept invite"}
      </button>
    </form>
  );
}
