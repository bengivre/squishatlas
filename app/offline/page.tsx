import Link from "next/link";

export const metadata = {
  title: "You're offline · Squishatlas",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-wide text-star-dim">Squishatlas</p>
      <h1 className="mt-2 font-display text-2xl text-lamplight">
        You&apos;re offline
      </h1>
      <p className="mt-3 max-w-sm text-sm text-star-dim">
        The night sky will wait. Reconnect, then refresh to open your collection
        again.
      </p>
      <Link
        href="/"
        className="pressable-card mt-8 inline-flex min-h-11 items-center justify-center rounded-input bg-moon-gold px-5 text-sm font-semibold text-night-deep"
      >
        Try again
      </Link>
    </main>
  );
}
