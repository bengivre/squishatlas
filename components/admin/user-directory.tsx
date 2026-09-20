"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import {
  resetUserPasswordAction,
  type AdminUserActionResult,
} from "@/app/admin/users/actions";
import type { AdminUserRow } from "@/lib/admin/platform-stats";

type Feedback =
  | { tone: "ok"; message: string; secret?: string }
  | { tone: "error"; message: string };

export function UserDirectory({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.tenant?.slug.toLowerCase().includes(q) ||
        u.tenant?.displayName.toLowerCase().includes(q),
    );
  }, [users, query]);

  function runReset(formData: FormData) {
    startTransition(async () => {
      const result: AdminUserActionResult = await resetUserPasswordAction(formData);
      if (!result.ok) {
        setFeedback({ tone: "error", message: result.message });
        return;
      }
      setFeedback({
        tone: "ok",
        message: result.message,
        secret: result.temporaryPassword,
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-lamplight">Users</h2>
          <p className="mt-1 text-sm text-star-dim">
            Directory of accounts — reset passwords when someone gets locked out.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, name, tenant…"
          className="w-full max-w-xs rounded-input border border-star-dim/30 bg-night-plum px-3 py-2 text-sm text-lamplight sm:w-72"
        />
      </div>

      {feedback ? (
        <div
          className={`rounded-input border px-4 py-3 text-sm ${
            feedback.tone === "ok"
              ? "border-moon-gold/40 text-lamplight"
              : "border-blush/40 text-blush"
          }`}
        >
          <p>{feedback.message}</p>
          {feedback.tone === "ok" && feedback.secret ? (
            <p className="mt-2 break-all font-mono text-xs text-star-dim">
              {feedback.secret}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-card border border-star-dim/20 bg-night-plum/80">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-star-dim/20 text-xs tracking-wide text-star-dim uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sessions</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-star-dim/15">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-star-dim">
                  {users.length === 0
                    ? "No users yet."
                    : "No users match that search."}
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="text-lamplight">{u.email}</p>
                      <p className="text-xs text-star-dim">{u.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      {u.tenant ? (
                        <Link
                          href={`/t/${u.tenant.slug}`}
                          className="text-moon-gold underline-offset-2 hover:underline"
                        >
                          {u.tenant.displayName}
                        </Link>
                      ) : (
                        <span className="text-star-dim">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.isSuperadmin ? (
                          <span className="rounded-input border border-moon-gold/35 px-1.5 py-0.5 text-[10px] text-moon-gold uppercase">
                            Superadmin
                          </span>
                        ) : null}
                        {!u.emailVerified ? (
                          <span className="rounded-input border border-star-dim/40 px-1.5 py-0.5 text-[10px] text-star-dim uppercase">
                            Unverified
                          </span>
                        ) : null}
                        {u.mustChangePassword ? (
                          <span className="rounded-input border border-aurora/35 px-1.5 py-0.5 text-[10px] text-aurora uppercase">
                            Must change PW
                          </span>
                        ) : null}
                        {u.emailVerified &&
                        !u.isSuperadmin &&
                        !u.mustChangePassword ? (
                          <span className="text-xs text-star-dim">OK</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-lamplight">
                      {u.activeSessionCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-star-dim">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-star-dim">You</span>
                      ) : (
                        <form action={runReset}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-input border border-star-dim/30 px-3 py-1.5 text-xs text-lamplight disabled:opacity-60"
                          >
                            Reset password
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
