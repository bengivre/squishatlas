"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { FeaturePreviews, HeroAppPreview } from "@/components/marketing/app-previews";
import { SiteHeader } from "@/components/marketing/site-header";
import { formatStarCount } from "@/lib/github/repo";

const STEPS = [
  {
    title: "Snap their photo",
    body: "Take a picture of each squish. Crop it just right. Name them. Write the silly story only your family knows.",
  },
  {
    title: "Draw their family",
    body: "Link moms, cousins, and best friends. Watch a glowing constellation grow under the night sky.",
  },
  {
    title: "Share the shelf",
    body: "Parents keep the collection private, or open a soft public window for grandparents to peek.",
  },
];

export function HomeLanding({
  signedInHref,
  githubUrl,
  githubRepo,
  starCount,
}: {
  signedInHref?: string | null;
  githubUrl: string;
  githubRepo: string;
  starCount: number | null;
}) {
  const reduce = useReducedMotion();

  return (
    <div className="relative text-lamplight">
      <SiteHeader
        githubUrl={githubUrl}
        starCount={starCount}
        signedInHref={signedInHref}
      />

      <main>
        {/* Hero — brand first, one composition */}
        <section
          id="home"
          className="relative mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-5xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:gap-12 md:pb-20 md:pt-14"
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="space-y-5"
          >
            <p className="app-eyebrow">For kids · For parents · For the shelf</p>
            <h1 className="font-display text-[clamp(2.75rem,11vw,4.25rem)] font-semibold leading-[0.95] tracking-tight text-lamplight">
              Squishatlas
            </h1>
            <p className="max-w-md text-lg font-semibold leading-snug text-star-dim sm:text-xl">
              A cozy night-sky home for every Squishmallow — photos, stories, and
              glowing family trees.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {signedInHref ? (
                <Link
                  href={signedInHref}
                  className="inline-flex min-h-12 items-center rounded-input bg-moon-gold px-5 text-sm font-extrabold text-night-deep"
                >
                  Open your shelf
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex min-h-12 items-center rounded-input bg-moon-gold px-5 text-sm font-extrabold text-night-deep"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex min-h-12 items-center rounded-input border border-star-dim/40 px-5 text-sm font-extrabold text-lamplight"
                  >
                    Create a shelf
                  </Link>
                </>
              )}
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center rounded-input border border-star-dim/40 px-5 text-sm font-extrabold text-lamplight"
              >
                How it works
              </a>
            </div>
          </motion.div>

          <HeroAppPreview />

          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-8 top-10 h-48 w-48 rounded-full bg-moon-gold/15 blur-3xl md:top-20 md:h-72 md:w-72"
            animate={
              reduce ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }
            }
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-10 bottom-16 h-40 w-40 rounded-full bg-aurora/10 blur-3xl"
            animate={
              reduce ? undefined : { opacity: [0.25, 0.55, 0.25], y: [0, -12, 0] }
            }
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </section>

        {/* About */}
        <section id="about" className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <p className="app-eyebrow">About</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-lamplight">
            Why a whole atlas?
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-star-dim md:text-lg">
            Squishies pile up fast. Names get mixed up. Stories disappear.
            Squishatlas turns the pile into a soft little world kids can explore —
            and parents can keep tidy. Self-host it, invite your family, share only
            what you choose.
          </p>

          <FeaturePreviews />
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-5xl px-5 py-12 md:py-16"
        >
          <p className="app-eyebrow">Getting started</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-lamplight">
            How it works
          </h2>
          <ol className="mt-8 space-y-8">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="border-t border-star-dim/20 pt-6"
              >
                <p className="app-eyebrow">Step {index + 1}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-moon-gold">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-lg text-base leading-relaxed text-star-dim">
                  {step.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Kids + parents */}
        <section className="mx-auto grid max-w-5xl gap-10 px-5 py-16 md:grid-cols-2">
          <div>
            <p className="app-eyebrow">For kids</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-lamplight">
              Tap the stars
            </h2>
            <p className="mt-3 text-base leading-relaxed text-star-dim">
              Browse a glowing shelf, open a favourite, and travel through their
              constellation of friends and family.
            </p>
          </div>
          <div>
            <p className="app-eyebrow">For parents</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-lamplight">
              Keep it gentle
            </h2>
            <p className="mt-3 text-base leading-relaxed text-star-dim">
              Invite-only homes, optional share pages, and no public browsing by
              default. You decide who gets a peek.
            </p>
          </div>
        </section>

        {/* Open source */}
        <section
          id="open-source"
          className="mx-auto max-w-5xl px-5 py-12 md:py-16"
        >
          <div className="overflow-hidden rounded-[1.5rem] border border-moon-gold/25 bg-gradient-to-br from-night-plum to-night-deep px-6 py-10 shadow-glow-soft md:px-10">
            <p className="app-eyebrow">Open source</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-lamplight">
              Built in the open
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-star-dim">
              Squishatlas is free to self-host and open on GitHub. Star the repo,
              file an issue, or contribute a cozy improvement.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-input bg-moon-gold px-5 text-sm font-extrabold text-night-deep"
              >
                View on GitHub
                {starCount !== null ? (
                  <span className="rounded-full bg-night-deep/15 px-2.5 py-0.5 text-xs">
                    ★ {formatStarCount(starCount)}
                  </span>
                ) : null}
              </a>
              <span className="text-sm text-star-dim">
                Repository{" "}
                <span className="font-bold text-lamplight">{githubRepo}</span>
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-star-dim/15 px-5 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-display text-sm font-semibold text-lamplight">
            Squish<span className="text-moon-gold">atlas</span>
          </p>
          <p className="text-xs text-star-dim">
            A cozy night-sky home for every Squishmallow ·{" "}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-moon-gold underline-offset-2 hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
