"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { authClient } from "@/lib/auth-client";

const inputClassName =
  "w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error: resetError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo,
    });

    if (resetError) {
      setError(
        resetError.message ??
          "Reset email didn't send — try again in a moment.",
      );
      setPending(false);
      return;
    }

    setMessage(
      "If that email has an account, a reset link is on its way. Check your inbox and choose a new password.",
    );
    setPending(false);
  }

  return (
    <AuthFormShell
      title="Reset your password"
      description="Enter your email to get a link to choose a new password."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="text-lamplight underline">
            Back to sign in
          </Link>
          .
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-star-dim">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
          />
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}
        {message ? <p className="text-sm text-lamplight">{message}</p> : null}

        <button
          type="submit"
          disabled={pending || Boolean(message)}
          className="w-full rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthFormShell>
  );
}
