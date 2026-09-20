"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  KIN_LABELS,
  kinGroup,
  type Kin,
  type KinGroup,
} from "@/lib/relationship/derive";
import { photoPublicUrl } from "@/lib/uploads/urls";

import type { SquishWithPhoto } from "./types";
import { cn } from "@/lib/utils";

const SIZE = 800;
const C = SIZE / 2;

/** Where each kind of relative sits around the centre, in degrees. */
const BANDS: Record<KinGroup, { radius: number; from: number; to: number }> = {
  grandparents: { radius: 265, from: -150, to: -30 },
  parents: { radius: 175, from: -125, to: -55 },
  partner: { radius: 175, from: -10, to: 10 },
  siblings: { radius: 175, from: 155, to: 205 },
  kids: { radius: 175, from: 55, to: 125 },
  grandkids: { radius: 265, from: 50, to: 130 },
  extended: { radius: 265, from: 150, to: 230 },
  friends: { radius: 330, from: -40, to: 220 },
};

function Orb({
  squish,
  tenantId,
  r,
  x,
  y,
  role,
  friend,
  center,
  delay,
  onPick,
}: {
  squish: SquishWithPhoto;
  tenantId: string;
  r: number;
  x: number;
  y: number;
  role?: string;
  friend?: boolean;
  center?: boolean;
  delay: number;
  onPick?: () => void;
}) {
  const clipId = `orbit-clip-${squish.id}-${r}`;
  return (
    <g
      className={cn(
        "star is-lit",
        center && "is-selected is-center",
        friend && "is-friend",
      )}
      transform={`translate(${x} ${y})`}
      role={onPick ? "button" : undefined}
      tabIndex={onPick ? 0 : -1}
      aria-label={role ? `${squish.name}, ${role}` : squish.name}
      onClick={onPick}
      onKeyDown={(e) => {
        if (onPick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPick();
        }
      }}
      style={{ cursor: onPick ? "pointer" : "default" }}
    >
      <g className="star-pop" style={{ animationDelay: `${delay}s` }}>
        <defs>
          <clipPath id={clipId}>
            <circle r={r} />
          </clipPath>
        </defs>
        {center ? <circle className="star-selring" r={r + 10} /> : null}
        <g className="star-body">
          <circle className="star-bg" r={r} />
          {squish.photo ? (
            <image
              href={photoPublicUrl(
                tenantId,
                squish.id,
                squish.photo.id,
                center ? "card" : "thumb",
              )}
              x={-r}
              y={-r}
              width={r * 2}
              height={r * 2}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId})`}
            />
          ) : (
            <text
              className="star-initial"
              y="0.36em"
              style={{ fontSize: r * 0.9 }}
            >
              {squish.name.slice(0, 1)}
            </text>
          )}
          <circle className="star-ring" r={r + 3} />
        </g>
        <text
          className="star-name"
          y={r + 22}
          style={center ? { fontSize: 22 } : undefined}
        >
          {squish.name}
        </text>
        {role ? (
          <text className="star-role" y={r + 38}>
            {role}
          </text>
        ) : null}
      </g>
    </g>
  );
}

export function OrbitView({
  tenantId,
  squish,
  kin,
  squishMap,
  onPick,
  onClose,
}: {
  tenantId: string;
  squish: SquishWithPhoto;
  kin: Kin[];
  squishMap: Map<string, SquishWithPhoto>;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const placed = useMemo(() => {
    const byGroup = new Map<KinGroup, Kin[]>();
    for (const k of kin) {
      if (!squishMap.has(k.otherId)) continue;
      const g = kinGroup(k.role);
      byGroup.set(g, [...(byGroup.get(g) ?? []), k]);
    }
    const out: { kin: Kin; x: number; y: number }[] = [];
    for (const [group, list] of byGroup) {
      const band = BANDS[group];
      const n = list.length;
      // Spread wide bands out; keep small groups near the band's middle.
      const span = Math.min(band.to - band.from, Math.max(0, (n - 1) * 34));
      const start = (band.from + band.to) / 2 - span / 2;
      list.forEach((k, i) => {
        const deg =
          n === 1 ? (band.from + band.to) / 2 : start + (span * i) / (n - 1);
        const a = (deg * Math.PI) / 180;
        out.push({
          kin: k,
          x: C + Math.cos(a) * band.radius,
          y: C + Math.sin(a) * band.radius,
        });
      });
    }
    return out;
  }, [kin, squishMap]);

  return (
    <div
      className="orbit"
      role="dialog"
      aria-modal="true"
      aria-label={`${squish.name}'s world`}
    >
      <button
        ref={closeRef}
        type="button"
        className="pill orbit-close"
        onClick={onClose}
      >
        ✕ Back to sky
      </button>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        preserveAspectRatio="xMidYMid meet"
        className="orbit-svg"
      >
        <defs>
          <filter
            id="orbit-glow"
            filterUnits="userSpaceOnUse"
            x="-200"
            y="-200"
            width="1200"
            height="1200"
          >
            <feGaussianBlur stdDeviation="1.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle className="orbit-ring" cx={C} cy={C} r={175} />
        <circle className="orbit-ring" cx={C} cy={C} r={265} />
        <circle className="orbit-ring is-friend" cx={C} cy={C} r={330} />
        <text className="orbit-eyebrow" x={C} y={52}>
          EVERYONE AROUND
        </text>
        <text className="orbit-title" x={C} y={86}>
          {squish.name}&rsquo;s world
        </text>
        {placed.map(({ kin: k, x, y }) => (
          <line
            key={`spoke-${k.otherId}-${k.kind}`}
            className={cn(
              "orbit-spoke",
              k.kind === "friendship" && "is-friend",
              k.role === "partner" && "is-couple",
              k.derived && "is-derived",
            )}
            x1={C}
            y1={C}
            x2={x}
            y2={y}
          />
        ))}
        <Orb
          squish={squish}
          tenantId={tenantId}
          r={56}
          x={C}
          y={C}
          center
          delay={0}
        />
        {placed.map(({ kin: k, x, y }, i) => {
          const other = squishMap.get(k.otherId)!;
          return (
            <Orb
              key={`${k.otherId}-${k.kind}`}
              squish={other}
              tenantId={tenantId}
              r={30}
              x={x}
              y={y}
              role={KIN_LABELS[k.role]}
              friend={k.kind === "friendship"}
              delay={0.08 + i * 0.05}
              onPick={() => onPick(k.otherId)}
            />
          );
        })}
        {placed.length === 0 ? (
          <text className="orbit-empty" x={C} y={C + 120}>
            Nobody linked yet
          </text>
        ) : null}
      </svg>
      <p className="orbit-hint">Tap any squish to put them in the middle</p>
    </div>
  );
}
