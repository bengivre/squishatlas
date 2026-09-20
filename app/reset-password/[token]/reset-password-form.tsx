"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { authClient } from "@/lib/auth-client";

const inputClassName =
  "w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password needs at least 8 characters — try a longer one.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Those passwords don't match — enter the same one twice.");
      return;
    }

    setPending(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (resetError) {
      setError(
        resetError.message ??
          "This reset link is invalid or has expired. Request a new one and try again.",
      );
      setPending(false);
      return;
    }

    const destination = "/login?reset=success";
    router.push(destination);
    router.refresh();
  }

  return (
    <AuthFormShell
      title="Choose a new password"
      description="Enter a new password for your account."
      footer={
        <p>
          <Link href="/login" className="text-lamplight underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-star-dim">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
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
            className={inputClassName}
          />
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthFormShell>
  );
}
