"use client";

import Link from "next/link";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { formatStarCount } from "@/lib/github/repo";

const NAV = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#open-source", label: "Open source" },
] as const;

export function SiteHeader({
  githubUrl,
  starCount,
  signedInHref,
}: {
  githubUrl: string;
  starCount: number | null;
  signedInHref?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-star-dim/15 bg-night-deep/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <a
          href="#home"
          className="font-display text-lg font-semibold tracking-tight text-lamplight"
        >
          Squish<span className="text-moon-gold">atlas</span>
        </a>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Primary"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-star-dim transition hover:text-lamplight"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-input border border-star-dim/30 px-3 text-xs font-bold text-lamplight transition hover:border-moon-gold/40"
          >
            <GithubMark className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
            {starCount !== null ? (
              <span className="rounded-full bg-moon-gold/15 px-2 py-0.5 text-moon-gold">
                ★ {formatStarCount(starCount)}
              </span>
            ) : null}
          </a>

          {signedInHref ? (
            <>
              <Link
                href={signedInHref}
                className="hidden min-h-10 items-center rounded-input bg-moon-gold px-3 text-xs font-extrabold text-night-deep sm:inline-flex"
              >
                Open shelf
              </Link>
              <SignOutButton className="hidden min-h-10 items-center rounded-input border border-star-dim/30 px-3 text-xs font-extrabold text-lamplight transition hover:border-moon-gold/40 sm:inline-flex disabled:opacity-60" />
            </>
          ) : (
            <Link
              href="/login"
              className="hidden min-h-10 items-center rounded-input bg-moon-gold px-3 text-xs font-extrabold text-night-deep sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-input border border-star-dim/30 text-lamplight md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden className="text-lg leading-none">
              {open ? "×" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-star-dim/15 px-5 py-3 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block rounded-input px-3 py-2.5 text-sm font-bold text-lamplight hover:bg-night-plum"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
            {signedInHref ? (
              <>
                <li>
                  <Link
                    href={signedInHref}
                    className="block rounded-input px-3 py-2.5 text-sm font-bold text-moon-gold hover:bg-night-plum"
                    onClick={() => setOpen(false)}
                  >
                    Open shelf
                  </Link>
                </li>
                <li>
                  <SignOutButton className="w-full rounded-input px-3 py-2.5 text-left text-sm font-bold text-lamplight hover:bg-night-plum disabled:opacity-60" />
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="block rounded-input px-3 py-2.5 text-sm font-bold text-moon-gold hover:bg-night-plum"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
