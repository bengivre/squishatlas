import Link from "next/link";

import type { PublicPageKey } from "@/lib/public/unlock-cookie";

const PAGE_LABEL: Record<PublicPageKey, string> = {
  hub: "Hub",
  gallery: "Gallery",
  tree: "Family tree",
};

export function PrivatePageNotice({
  slug,
  displayName,
  page,
}: {
  slug: string;
  displayName: string;
  page: PublicPageKey;
}) {
  const pageLabel = PAGE_LABEL[page];

  return (
    <main className="bg-night-deep flex min-h-screen items-center justify-center px-4">
      <div className="rounded-sheet border-star-dim/20 bg-night-plum shadow-glow-soft w-full max-w-md space-y-4 border p-6">
        <div>
          <p className="text-star-dim text-xs tracking-wide uppercase">
            {displayName}
          </p>
          <h1 className="text-lamplight text-xl">This page is private</h1>
          <p className="text-star-dim mt-2 text-sm">
            The {pageLabel} share link is not public yet. Only the owner can
            view it until they turn it Public in Settings.
          </p>
        </div>

        <div className="border-star-dim/20 space-y-2 border-t pt-4">
          <p className="text-lamplight text-sm font-semibold">
            If you own this collection
          </p>
          <ol className="text-star-dim list-decimal space-y-1 pl-5 text-sm">
            <li>Open Settings</li>
            <li>Go to Public pages</li>
            <li>
              Set <span className="text-lamplight">{pageLabel}</span> to Public
            </li>
            <li>Share the link again</li>
          </ol>
        </div>

        <Link
          href={`/t/${slug}/settings`}
          className="rounded-input border-star-dim/30 text-lamplight hover:border-moon-gold/40 focus-visible:outline-moon-gold inline-flex min-h-10 items-center justify-center border px-4 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Open Settings
        </Link>
      </div>
    </main>
  );
}
