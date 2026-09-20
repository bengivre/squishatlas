"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { authClient } from "@/lib/auth-client";
import { normalizeSlug } from "@/lib/admin/tenant-utils";
import { registerAction } from "./actions";

const inputClassName =
  "w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight";

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const slug = useMemo(() => normalizeSlug(slugInput), [slugInput]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);
    formData.set("displayName", displayName);
    formData.set("slug", slugInput);

    const result = await registerAction(formData);

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    setSuccess(true);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setResendMessage(null);
    setResendError(null);
    setPending(false);
  }

  async function onResendVerification() {
    if (resendCooldown > 0 || resendPending) {
      return;
    }

    setResendPending(true);
    setResendMessage(null);
    setResendError(null);

    const callbackURL = `${window.location.origin}/login`;
    const { error: sendError } = await authClient.sendVerificationEmail({
      email: email.trim(),
      callbackURL,
    });

    if (sendError) {
      setResendError(
        sendError.message ??
          "Verification email didn't send — try again in a moment.",
      );
      setResendPending(false);
      return;
    }

    setResendMessage("Another verification link is on its way. Check your inbox.");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setResendPending(false);
  }

  if (success) {
    return (
      <AuthFormShell
        title="Check your email"
        description="We sent a verification link. Confirm your email, then sign in to open your shelf."
        footer={
          <p>
            Already verified?{" "}
            <Link href="/login" className="text-lamplight underline">
              Sign in
            </Link>
            .
          </p>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-lamplight">
            Didn&apos;t get it? Check spam, then resend the link below.
          </p>
          {resendMessage ? (
            <p className="text-sm text-aurora">{resendMessage}</p>
          ) : null}
          {resendError ? (
            <p className="text-sm text-blush">{resendError}</p>
          ) : null}
          <button
            type="button"
            onClick={onResendVerification}
            disabled={resendPending || resendCooldown > 0}
            className="w-full rounded-input border border-star-dim/40 px-4 py-2 text-sm font-semibold text-lamplight disabled:opacity-60"
          >
            {resendPending
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend link in ${resendCooldown}s`
                : "Resend verification link"}
          </button>
        </div>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      title="Create your shelf"
      description="Register with email, choose your public address, then verify before signing in."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="text-lamplight underline">
            Sign in
          </Link>
          .
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-star-dim">Your name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClassName}
          />
        </label>

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
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-star-dim">Shelf name</span>
          <input
            type="text"
            name="displayName"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Smith family"
            className={inputClassName}
          />
          <span className="block text-xs text-star-dim">
            Friendly title shown in the app (your collection home).
          </span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-star-dim">Public shelf address</span>
          <input
            type="text"
            name="slug"
            required
            value={slugInput}
            onChange={(event) => setSlugInput(event.target.value)}
            placeholder="smith-family"
            className={inputClassName}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <span className="block text-xs leading-relaxed text-star-dim">
            This is the public URL people use to reach your gallery and family
            tree. Lowercase letters, numbers, and hyphens only.
          </span>
          {slug ? (
            <span className="mt-1 block space-y-0.5 font-mono text-xs text-aurora">
              <span className="block">/t/{slug}/gallery</span>
              <span className="block">/t/{slug}/tree</span>
            </span>
          ) : null}
        </label>

        {error ? <p className="text-sm text-blush">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
        >
          {pending ? "Creating shelf…" : "Create shelf"}
        </button>
      </form>
    </AuthFormShell>
  );
}
