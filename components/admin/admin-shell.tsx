"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/users", label: "Users" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-night-deep">
      <header className="sticky top-0 z-40 border-b border-star-dim/20 bg-night-deep/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-display text-xs tracking-[0.18em] text-moon-gold uppercase">
              Squishatlas
            </p>
            <h1 className="font-display text-xl text-lamplight sm:text-2xl">
              Control Room
            </h1>
          </div>
          <SignOutButton className="inline-flex min-h-10 items-center rounded-input border border-star-dim/30 px-3 py-1.5 text-sm text-lamplight transition hover:border-moon-gold/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-gold disabled:opacity-60" />
        </div>
        <nav
          aria-label="Admin sections"
          className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6"
        >
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-input px-3 py-2 text-sm transition",
                  active
                    ? "text-lamplight"
                    : "text-star-dim hover:text-lamplight",
                )}
              >
                {item.label}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-moon-gold"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
