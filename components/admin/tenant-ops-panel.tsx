"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import {
  createTenantAction,
  deleteTenantAction,
  inviteOwnerAction,
  resetOwnerPasswordAction,
  type AdminActionResult,
  type AdminActionResultWithSecret,
} from "@/app/admin/actions";
import type { AdminTenantRow } from "@/lib/admin/platform-stats";

type Feedback =
  | { tone: "ok"; message: string; secret?: string }
  | { tone: "error"; message: string };

function applyResult(
  result: AdminActionResult | AdminActionResultWithSecret,
  setFeedback: (value: Feedback) => void,
) {
  if (!result.ok) {
    setFeedback({ tone: "error", message: result.message });
    return;
  }

  const secret =
    "inviteUrl" in result
      ? result.inviteUrl
      : "temporaryPassword" in result
        ? result.temporaryPassword
        : undefined;

  setFeedback({ tone: "ok", message: result.message, secret });
}

function SharingBadges({ sharing }: { sharing: AdminTenantRow["sharing"] }) {
  const flags = [
    sharing.hubEnabled ? "Hub" : null,
    sharing.galleryEnabled ? "Gallery" : null,
    sharing.treeEnabled ? "Tree" : null,
    sharing.allowIndexing ? "Indexable" : null,
  ].filter(Boolean);

  if (flags.length === 0) {
    return <span className="text-xs text-star-dim">Private</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <span
          key={flag}
          className="rounded-input border border-aurora/30 px-1.5 py-0.5 text-[10px] tracking-wide text-aurora uppercase"
        >
          {flag}
        </span>
      ))}
    </div>
  );
}

export function TenantOpsPanel({ tenants }: { tenants: AdminTenantRow[] }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.displayName.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.owner?.email.toLowerCase().includes(q) ||
        t.pendingInvite?.email.toLowerCase().includes(q),
    );
  }, [tenants, query]);

  function run(action: () => Promise<AdminActionResult | AdminActionResultWithSecret>) {
    startTransition(async () => {
      const result = await action();
      applyResult(result, setFeedback);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl text-lamplight">Tenants</h2>
        <p className="mt-1 text-sm text-star-dim">
          Create shelves, invite owners, and keep collections healthy.
        </p>
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

      <section className="rounded-card border border-star-dim/20 bg-night-plum shadow-glow-soft p-5">
        <h3 className="mb-4 font-display text-lg text-lamplight">Create tenant</h3>
        <form
          action={(formData) => run(() => createTenantAction(formData))}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="space-y-1">
            <span className="text-sm text-star-dim">Slug</span>
            <input
              name="slug"
              required
              placeholder="smith-family"
              className="w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-star-dim">Display name</span>
            <input
              name="displayName"
              required
              placeholder="Smith family"
              className="w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="sm:col-span-2 rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
          >
            Create tenant
          </button>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg text-lamplight">
          All tenants
          <span className="ml-2 text-sm font-sans text-star-dim">
            ({filtered.length})
          </span>
        </h3>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, slug, email…"
          className="w-full max-w-xs rounded-input border border-star-dim/30 bg-night-plum px-3 py-2 text-sm text-lamplight sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-star-dim">
          {tenants.length === 0
            ? "No tenants yet. Create one above to get started."
            : "No tenants match that search."}
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((row) => (
            <article
              key={row.id}
              className="rounded-card border border-star-dim/20 bg-night-plum shadow-glow-soft p-5"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-lg text-lamplight">
                    {row.displayName}
                  </h4>
                  <p className="text-sm text-star-dim">
                    <Link
                      href={`/t/${row.slug}`}
                      className="text-moon-gold underline-offset-2 hover:underline"
                    >
                      /t/{row.slug}
                    </Link>
                  </p>
                </div>
                <p className="text-xs text-star-dim">
                  Created {new Date(row.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-star-dim">Collection</p>
                  <p className="text-lamplight">
                    {row.squishCount} squish
                    {row.squishCount === 1 ? "" : "ies"}
                    <span className="text-star-dim">
                      {" "}
                      · {row.photoCount} photos · {row.familyCount} families
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-star-dim">Owner</p>
                  <p className="text-lamplight">
                    {row.owner ? row.owner.email : "None yet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-star-dim">Sharing</p>
                  <SharingBadges sharing={row.sharing} />
                </div>
                <div>
                  <p className="text-xs text-star-dim">Invite</p>
                  {row.pendingInvite ? (
                    <p className="text-lamplight">
                      {row.pendingInvite.email}
                      <span className="mt-1 block break-all font-mono text-[10px] text-star-dim">
                        {row.pendingInvite.inviteUrl}
                      </span>
                    </p>
                  ) : (
                    <p className="text-star-dim">—</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-star-dim/20 pt-4">
                {!row.owner ? (
                  <form
                    action={(formData) => run(() => inviteOwnerAction(formData))}
                    className="flex flex-col gap-2 sm:flex-row sm:items-end"
                  >
                    <input type="hidden" name="tenantId" value={row.id} />
                    <label className="grow space-y-1">
                      <span className="text-sm text-star-dim">Invite owner email</span>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="owner@example.com"
                        className="w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-input bg-moon-gold px-4 py-2 text-sm font-semibold text-night-deep disabled:opacity-60"
                    >
                      Invite owner
                    </button>
                  </form>
                ) : (
                  <form
                    action={(formData) =>
                      run(() => resetOwnerPasswordAction(formData))
                    }
                  >
                    <input type="hidden" name="tenantId" value={row.id} />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-input border border-star-dim/30 px-4 py-2 text-sm text-lamplight disabled:opacity-60"
                    >
                      Reset owner password
                    </button>
                  </form>
                )}

                <form
                  action={(formData) => {
                    if (
                      !confirm(
                        `Delete “${row.displayName}”? This removes the tenant, collection, settings, invites, and membership.`,
                      )
                    ) {
                      return;
                    }
                    run(() => deleteTenantAction(formData));
                  }}
                >
                  <input type="hidden" name="tenantId" value={row.id} />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-input border border-blush/40 px-4 py-2 text-sm text-blush disabled:opacity-60"
                  >
                    Delete tenant
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
