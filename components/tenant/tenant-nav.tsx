import Link from "next/link";

const inputClassName =
  "min-h-11 w-full rounded-input border border-star-dim/30 bg-night-deep px-3 py-2 text-lamplight focus-visible:border-moon-gold focus-visible:ring-[3px] focus-visible:ring-moon-gold";

const labelClassName = "text-sm text-lamplight";

const navPillClassName =
  "inline-flex min-h-11 items-center rounded-input border px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-gold";

export function TenantNav({
  slug,
  displayName,
  title = "Squishies",
  active = "collection",
}: {
  slug: string;
  displayName: string;
  title?: string;
  active?: "dashboard" | "collection" | "family" | "settings";
}) {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-star-dim">{displayName}</p>
        <h1 className="text-xl text-lamplight">{title}</h1>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href={`/t/${slug}/dashboard`}
          className={`${navPillClassName} ${
            active === "dashboard"
              ? "border-moon-gold/40 text-lamplight"
              : "border-star-dim/30 text-lamplight"
          }`}
        >
          Dashboard
        </Link>
        <Link
          href={`/t/${slug}/squishies`}
          className={`${navPillClassName} ${
            active === "collection"
              ? "border-moon-gold/40 text-lamplight"
              : "border-star-dim/30 text-lamplight"
          }`}
        >
          Collection
        </Link>
        <Link
          href={`/t/${slug}/family`}
          className={`${navPillClassName} ${
            active === "family"
              ? "border-moon-gold/40 text-lamplight"
              : "border-star-dim/30 text-lamplight"
          }`}
        >
          Family
        </Link>
        <Link
          href={`/t/${slug}/settings`}
          className={`${navPillClassName} ${
            active === "settings"
              ? "border-moon-gold/40 text-lamplight"
              : "border-star-dim/30 text-lamplight"
          }`}
        >
          Settings
        </Link>
        <Link
          href={`/t/${slug}/squishies/new`}
          className={`${navPillClassName} border-transparent bg-moon-gold font-semibold text-night-deep`}
        >
          Add a squish
        </Link>
      </nav>
    </header>
  );
}

export { inputClassName, labelClassName };
