import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { OrbitToggleButton } from "@/components/public/orbit-toggle-button";
import type { OrbitPage } from "@/db/schema/orbit";
import type { ViewerOwnTenant } from "@/lib/public/access-control";

const segmentClassName =
  "inline-flex min-h-10 min-w-[7.5rem] items-center justify-center rounded-full px-4 text-sm font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-gold";

const actionClassName =
  "inline-flex min-h-10 items-center rounded-input border border-star-dim/30 px-3 text-sm font-bold text-lamplight transition hover:border-moon-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-gold disabled:opacity-60";

const PAGE_FALLBACK: Record<"gallery" | "tree", string> = {
  gallery: "A quiet look at the collection — photos, names, and stories.",
  tree: "A read-only peek at how everyone connects — no editing here.",
};

export function PublicShareHeader({
  slug,
  displayName,
  title,
  hubIntro,
  active,
  galleryEnabled,
  treeEnabled,
  isMember,
  viewerOwnTenant = null,
  isInOrbit = false,
}: {
  slug: string;
  displayName: string;
  title: string;
  hubIntro: string | null;
  active: "gallery" | "tree";
  galleryEnabled: boolean;
  treeEnabled: boolean;
  isMember: boolean;
  viewerOwnTenant?: ViewerOwnTenant | null;
  isInOrbit?: boolean;
}) {
  const showGallery = galleryEnabled || isMember;
  const showTree = treeEnabled || isMember;
  const showNav = showGallery && showTree;
  const preferredPage: OrbitPage = active;

  return (
    <header className="mb-8">
      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <p className="text-star-dim text-xs tracking-wide uppercase sm:justify-self-start">
          {displayName}
        </p>

        {showNav ? (
          <nav className="justify-self-center" aria-label="Public pages">
            <div className="border-star-dim/20 bg-night-plum shadow-glow-soft inline-flex rounded-full border p-1">
              <Link
                href={`/t/${slug}/gallery`}
                className={`${segmentClassName} ${
                  active === "gallery"
                    ? "bg-moon-gold text-night-deep"
                    : "text-star-dim hover:text-lamplight"
                }`}
                aria-current={active === "gallery" ? "page" : undefined}
              >
                Gallery
              </Link>
              <Link
                href={`/t/${slug}/tree`}
                className={`${segmentClassName} ${
                  active === "tree"
                    ? "bg-moon-gold text-night-deep"
                    : "text-star-dim hover:text-lamplight"
                }`}
                aria-current={active === "tree" ? "page" : undefined}
              >
                Family tree
              </Link>
            </div>
          </nav>
        ) : (
          <span className="hidden sm:block" />
        )}

        {isMember ? (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-self-end">
            <Link href={`/t/${slug}/dashboard`} className={actionClassName}>
              Dashboard
            </Link>
            <SignOutButton className={actionClassName} />
          </div>
        ) : viewerOwnTenant ? (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-self-end">
            <OrbitToggleButton
              ownerSlug={viewerOwnTenant.slug}
              savedSlug={slug}
              preferredPage={preferredPage}
              initialInOrbit={isInOrbit}
            />
          </div>
        ) : (
          <span className="hidden sm:block" />
        )}
      </div>

      <div className="mt-6 text-center">
        <h1 className="text-lamplight text-2xl">{title}</h1>
        {hubIntro ? (
          <p className="text-star-dim mt-2 text-sm whitespace-pre-wrap">
            {hubIntro}
          </p>
        ) : (
          <p className="text-star-dim mt-2 text-sm">{PAGE_FALLBACK[active]}</p>
        )}
      </div>
    </header>
  );
}
