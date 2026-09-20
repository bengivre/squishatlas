"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { getPostLoginRedirect } from "@/lib/auth/post-login-redirect";
import { authClient } from "@/lib/auth-client";

const inputClassName =
  "w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight";

export function LoginForm({
  nextPath,
  resetSuccess = false,
}: {
  nextPath?: string;
  resetSuccess?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const { error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    if (signInError) {
      const message = signInError.message ?? "";
      const needsVerification =
        signInError.code === "EMAIL_NOT_VERIFIED" ||
        /email not verified/i.test(message);

      setError(
        needsVerification
          ? "Verify your email before signing in. Check your inbox for the link — we just sent another if this account still needs it."
          : message ||
              "That email and password did not match. Check both and try again.",
      );
      setPending(false);
      return;
    }

    const destination =
      nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
        ? nextPath
        : await getPostLoginRedirect();
    router.push(destination);
    router.refresh();
  }

  return (
    <AuthFormShell
      title="Sign in"
      description="Use the email and password for your Squishatlas account. Admins land in the control room; families land on their shelf."
      footer={
        <div className="space-y-1">
          <p>
            Forgot your password?{" "}
            <Link href="/forgot-password" className="text-lamplight underline">
              Reset it here
            </Link>
            .
          </p>
          <p>
            New here?{" "}
            <Link href="/register" className="text-lamplight underline">
              Create a shelf
            </Link>
            .
          </p>
        </div>
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

        <label className="block space-y-1">
          <span className="text-sm text-star-dim">Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
          />
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}
        {resetSuccess ? (
          <p className="text-sm text-lamplight">
            Your password was updated. Sign in with your new password.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthFormShell>
  );
}
