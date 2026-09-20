"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

const defaultClassName =
  "inline-flex min-h-11 items-center rounded-input border border-star-dim/30 px-4 py-2 text-sm text-lamplight transition hover:border-moon-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-gold disabled:opacity-60";

export function SignOutButton({
  className = defaultClassName,
}: {
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);

    const { error } = await authClient.signOut();

    if (error) {
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={pending}
      className={className}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
