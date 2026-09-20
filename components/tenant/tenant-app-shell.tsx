import Link from "next/link";

export type TenantTab =
  | "collection"
  | "family"
  | "orbit"
  | "stats"
  | "settings";

const NAV_ITEMS: { tab: TenantTab; href: string; icon: string; label: string }[] =
  [
    { tab: "collection", href: "squishies", icon: "✧", label: "Collection" },
    { tab: "family", href: "family", icon: "◈", label: "Family" },
    { tab: "orbit", href: "orbit", icon: "◎", label: "Orbit" },
    { tab: "stats", href: "dashboard", icon: "◑", label: "Stats" },
    { tab: "settings", href: "settings", icon: "⚙", label: "Settings" },
  ];

export function TenantAppShell({
  slug,
  eyebrow,
  title,
  activeTab,
  showFab = false,
  backHref,
  hideHeader = false,
  fullBleed = false,
  children,
}: {
  slug: string;
  eyebrow: string;
  title: string;
  activeTab: TenantTab;
  showFab?: boolean;
  backHref?: string;
  hideHeader?: boolean;
  fullBleed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main
      className={
        fullBleed
          ? "tenant-shell tenant-shell--bleed bg-night-deep"
          : "tenant-shell bg-night-deep px-5 pt-7"
      }
    >
      <div className={fullBleed ? "h-full w-full" : "mx-auto w-full max-w-[520px]"}>
        {backHref && !hideHeader ? (
          <Link href={backHref} className="detail-back relative left-0 top-0 mb-3">
            ‹
          </Link>
        ) : null}
        {!hideHeader ? (
          <header className="mb-1">
            <div className="app-eyebrow">{eyebrow}</div>
            <h1 className="app-title">{title}</h1>
          </header>
        ) : null}
        {children}
      </div>

      {showFab ? (
        <Link href={`/t/${slug}/squishies/new`} className="fab" aria-label="Add a squish">
          +
        </Link>
      ) : null}

      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.tab}
            href={`/t/${slug}/${item.href}`}
            className={activeTab === item.tab ? "on" : undefined}
          >
            <em>{item.icon}</em>
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
