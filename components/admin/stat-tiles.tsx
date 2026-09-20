"use client";

import { motion, useReducedMotion } from "motion/react";

import type { PlatformCounters } from "@/lib/admin/platform-stats";
import { cn } from "@/lib/utils";

type Tile = {
  key: keyof PlatformCounters;
  label: string;
  accent: "gold" | "aurora" | "blush" | "lilac";
};

const TILES: Tile[] = [
  { key: "tenants", label: "Tenants", accent: "gold" },
  { key: "users", label: "Accounts", accent: "aurora" },
  { key: "squishies", label: "Squishies", accent: "gold" },
  { key: "photos", label: "Photos", accent: "lilac" },
  { key: "families", label: "Families", accent: "aurora" },
  { key: "activeSessions", label: "Active sessions", accent: "gold" },
  { key: "publicSurfaces", label: "Public shelves", accent: "aurora" },
  { key: "pendingInvites", label: "Pending invites", accent: "blush" },
];

const accentClass: Record<Tile["accent"], string> = {
  gold: "border-moon-gold/25 text-moon-gold",
  aurora: "border-aurora/25 text-aurora",
  blush: "border-blush/25 text-blush",
  lilac: "border-star-dim/40 text-star-dim",
};

export function StatTiles({ counters }: { counters: PlatformCounters }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {TILES.map((tile, index) => (
        <motion.div
          key={tile.key}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : index * 0.04, duration: 0.35 }}
          className={cn(
            "rounded-card border bg-night-plum/80 px-4 py-4 shadow-glow-soft",
            accentClass[tile.accent],
          )}
        >
          <p className="text-xs tracking-wide text-star-dim uppercase">
            {tile.label}
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums text-lamplight">
            {counters[tile.key].toLocaleString()}
          </p>
          {tile.key === "users" && counters.superadmins > 0 ? (
            <p className="mt-1 text-xs text-star-dim">
              {counters.superadmins} superadmin
              {counters.superadmins === 1 ? "" : "s"}
            </p>
          ) : null}
        </motion.div>
      ))}
    </div>
  );
}
