"use client";

import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type KeyboardEvent,
  type Ref,
} from "react";

import { photoPublicUrl } from "@/lib/uploads/urls";

import {
  ORB_R,
  type Island,
  type SkyEdge,
  type SkyLayout,
  type SkyNode,
} from "./layout-islands";
import { StarCanvas } from "./star-canvas";
import type { SquishWithPhoto, Variant } from "./types";
import { useViewport, type Box } from "./use-viewport";
import { cn } from "@/lib/utils";

export type SkyInset = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type SkyHandle = {
  fitAll: (ms?: number) => void;
  fitIsland: (islandId: string, ms?: number) => void;
  focusNode: (id: string, ms?: number) => void;
  zoomBy: (factor: number) => void;
};

export type Lit = {
  /** squish id → caption shown under the orb ("Mom", "Twin"…) */
  roles: Map<string, string>;
};

function starPath(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return `${d}Z`;
}

function heartPath(x: number, y: number, s: number) {
  return `M${x} ${y + s * 0.9} C${x - s * 1.6} ${y - s * 0.2} ${x - s * 0.6} ${y - s * 1.3} ${x} ${y - s * 0.5} C${x + s * 0.6} ${y - s * 1.3} ${x + s * 1.6} ${y - s * 0.2} ${x} ${y + s * 0.9}Z`;
}

/* ---------- node ---------- */

const SquishStar = memo(function SquishStar({
  node,
  squish,
  tenantId,
  index,
  selected,
  lit,
  dimmed,
  role,
}: {
  node: SkyNode;
  squish: SquishWithPhoto;
  tenantId: string;
  index: number;
  selected: boolean;
  lit: boolean;
  dimmed: boolean;
  role: string | null;
}) {
  const photo = squish.photo;
  const cls = [
    "star",
    selected ? "is-selected" : "",
    lit ? "is-lit" : "",
    dimmed ? "is-dim" : "",
    squish.isFavorite ? "is-fav" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <g
      className={cls}
      transform={`translate(${node.x} ${node.y})`}
      data-squish-id={node.id}
      tabIndex={0}
      role="button"
      aria-label={role ? `${squish.name}, ${role}` : squish.name}
      aria-pressed={selected}
    >
      <g
        className="star-bob"
        style={{
          animationDuration: `${3.6 + (index % 5) * 0.4}s`,
          animationDelay: `${-(index * 0.7)}s`,
        }}
      >
        <g
          className="star-pop"
          style={{ animationDelay: `${0.1 + index * 0.045}s` }}
        >
          <circle className="star-selring" r={ORB_R + 8} />
          <g className="star-body">
            <circle className="star-bg" r={ORB_R} />
            {photo ? (
              <image
                href={photoPublicUrl(tenantId, squish.id, photo.id, "thumb")}
                x={-ORB_R}
                y={-ORB_R}
                width={ORB_R * 2}
                height={ORB_R * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#orb-clip)"
              />
            ) : (
              <text className="star-initial" y="0.36em">
                {squish.name.slice(0, 1)}
              </text>
            )}
            <circle className="star-ring" r={ORB_R + 3} />
            {squish.isFavorite ? (
              <path
                className="star-fav"
                d={starPath(ORB_R * 0.74, -ORB_R * 0.74, 8)}
              />
            ) : null}
          </g>
          <text className="star-name" y={ORB_R + 23}>
            {squish.name}
          </text>
          {role ? (
            <text className="star-role" y={ORB_R + 40}>
              {role}
            </text>
          ) : null}
        </g>
      </g>
    </g>
  );
});

/* ---------- island backdrop ---------- */

const IslandBackdrop = memo(function IslandBackdrop({
  island,
  canName,
}: {
  island: Island;
  canName: boolean;
}) {
  const { x, y, w, h } = island.bounds;
  const count = island.memberIds.length;
  const sub =
    island.kind === "solo"
      ? `${count} waiting for a family`
      : `${count} ${count === 1 ? "squish" : "squishies"}`;
  return (
    <g className={`island is-${island.kind}`} data-island-id={island.id}>
      <ellipse
        className="island-nebula"
        cx={x + w / 2}
        cy={y + h / 2}
        rx={w / 2 + 30}
        ry={h / 2 + 20}
        fill={`url(#neb-${island.id})`}
      />
      <text className="island-label" x={x + 28} y={y + 34}>
        <tspan className="island-emoji">{island.emoji}</tspan>
        <tspan dx="8">{island.label}</tspan>
        <tspan className="island-sub" dx="10">
          {sub}
        </tspan>
      </text>
      {island.kind === "unnamed" && canName ? (
        <text
          className="island-name-cta"
          x={x + 28}
          y={y + 58}
          data-name-island={island.id}
          role="button"
          tabIndex={0}
        >
          ✎ Name this family
        </text>
      ) : null}
      {island.kind === "solo" ? (
        <text className="island-hint" x={x + w / 2} y={y + h - 30}>
          Tap one, then “Add a relative” to bring them home
        </text>
      ) : null}
    </g>
  );
});

/* ---------- edges ---------- */

function edgeState(
  edge: SkyEdge,
  selectedId: string | null,
  litIds: Set<string>,
) {
  if (!selectedId) return { lit: false, dim: false };
  const has = (id: string) => id === selectedId || litIds.has(id);
  let lit = false;
  switch (edge.kind) {
    case "couple":
      lit =
        edge.a === selectedId ||
        edge.b === selectedId ||
        (litIds.has(edge.a) && litIds.has(edge.b));
      break;
    case "trunk":
      lit =
        edge.parents.includes(selectedId) ||
        edge.kids.includes(selectedId) ||
        (edge.parents.some(has) && edge.kids.some(has));
      break;
    case "drop":
      lit =
        edge.child === selectedId ||
        edge.parents.includes(selectedId) ||
        (has(edge.child) && edge.parents.some(has));
      break;
    case "kin":
    case "bridge":
    case "friend":
      lit = edge.a === selectedId || edge.b === selectedId;
      break;
  }
  return { lit, dim: !lit };
}

const Edges = memo(function Edges({
  edges,
  selectedId,
  litIds,
  showFriends,
}: {
  edges: SkyEdge[];
  selectedId: string | null;
  litIds: Set<string>;
  showFriends: boolean;
}) {
  return (
    <g className="sky-edges">
      {edges.map((edge, i) => {
        const { lit, dim } = edgeState(edge, selectedId, litIds);
        const base = cn(
          "edge",
          `edge-${edge.kind}`,
          lit && "is-lit",
          dim && "is-dim",
        );
        const delay = { animationDelay: `${0.2 + i * 0.03}s` };
        switch (edge.kind) {
          case "couple":
            return (
              <g
                key={edge.id}
                className={cn(base, !edge.recorded && "is-derived")}
              >
                <path
                  d={edge.d}
                  className="edge-path edge-draw"
                  style={delay}
                />
                <path
                  className="edge-heart"
                  d={heartPath(edge.cx, edge.cy, 8)}
                />
              </g>
            );
          case "trunk":
          case "drop":
            return (
              <path
                key={edge.id}
                d={edge.d}
                className={cn(
                  base,
                  edge.derived && "is-derived",
                  "edge-path edge-draw",
                )}
                style={delay}
              />
            );
          case "kin":
          case "bridge":
            return (
              <g key={edge.id} className={base}>
                <path
                  d={edge.d}
                  className="edge-path edge-draw"
                  style={delay}
                />
                <text className="edge-label" x={edge.lx} y={edge.ly}>
                  {edge.label}
                </text>
              </g>
            );
          case "friend": {
            const visible =
              showFriends || edge.a === selectedId || edge.b === selectedId;
            return (
              <path
                key={edge.id}
                d={edge.d}
                className={cn(
                  base,
                  edge.best && "is-best",
                  visible && "is-visible",
                  "edge-path",
                )}
              />
            );
          }
        }
      })}
    </g>
  );
});

/* ---------- the sky ---------- */

export function Sky({
  layout,
  squishMap,
  tenantId,
  variant,
  selectedId,
  litIds,
  roles,
  showFriends,
  inset,
  handleRef,
  onSelect,
  onNameIsland,
}: {
  layout: SkyLayout;
  squishMap: Map<string, SquishWithPhoto>;
  tenantId: string;
  variant: Variant;
  selectedId: string | null;
  litIds: Set<string>;
  roles: Map<string, string>;
  showFriends: boolean;
  inset: () => SkyInset;
  handleRef: Ref<SkyHandle>;
  onSelect: (id: string | null) => void;
  onNameIsland?: (islandId: string) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const nodeById = useMemo(
    () => new Map(layout.nodes.map((n) => [n.id, n])),
    [layout.nodes],
  );

  const onTap = useCallback(
    (target: Element | null) => {
      const star = target?.closest?.("[data-squish-id]") as HTMLElement | null;
      if (star?.dataset.squishId) {
        const id = star.dataset.squishId;
        onSelect(id === selectedId ? null : id);
        return;
      }
      const cta = target?.closest?.("[data-name-island]") as HTMLElement | null;
      if (cta?.dataset.nameIsland) {
        onNameIsland?.(cta.dataset.nameIsland);
        return;
      }
      onSelect(null);
    },
    [onSelect, onNameIsland, selectedId],
  );

  const { viewRef, fitBox, centerOn, zoomBy, setInstant } = useViewport(
    stageRef,
    worldRef,
    { onTap },
  );

  const fitAll = useCallback(
    (ms = 550) => {
      const box: Box = {
        x: -40,
        y: -20,
        w: layout.width + 80,
        h: layout.height + 60,
      };
      fitBox(box, inset(), ms, 1.4);
    },
    [fitBox, inset, layout.height, layout.width],
  );

  const fitIsland = useCallback(
    (islandId: string, ms = 550) => {
      const island = layout.islands.find((i) => i.id === islandId);
      if (!island) return;
      const b = island.bounds;
      fitBox(
        { x: b.x - 20, y: b.y - 10, w: b.w + 40, h: b.h + 30 },
        inset(),
        ms,
        1.4,
      );
    },
    [fitBox, inset, layout.islands],
  );

  const focusNode = useCallback(
    (id: string, ms = 450) => {
      const node = nodeById.get(id);
      const stage = stageRef.current;
      if (!node || !stage) return;
      const narrow = stage.clientWidth < 640;
      const k = Math.max(viewRef.current.k, narrow ? 1 : 0.95);
      // Leave room for the peek card below the orb.
      centerOn(node.x, node.y, k, 0.5, narrow ? 0.3 : 0.42, ms);
    },
    [centerOn, nodeById, viewRef],
  );

  useImperativeHandle(
    handleRef,
    () => ({ fitAll, fitIsland, focusNode, zoomBy: (f) => zoomBy(f) }),
    [fitAll, fitIsland, focusNode, zoomBy],
  );

  // First paint: phones open on the biggest family so orbs stay readable.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current || layout.nodes.length === 0) return;
    booted.current = true;
    setInstant({ x: 0, y: 0, k: 0.05 });
    const stage = stageRef.current;
    const narrow = (stage?.clientWidth ?? 1000) < 720;
    const biggest = layout.islands
      .filter((i) => i.kind !== "solo")
      .sort((a, b) => b.memberIds.length - a.memberIds.length)[0];
    const raf = requestAnimationFrame(() => {
      if (narrow && biggest && layout.islands.length > 1) {
        fitIsland(biggest.id, 900);
      } else {
        fitAll(900);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [fitAll, fitIsland, layout.islands, layout.nodes.length, setInstant]);

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const target = e.target as HTMLElement;
    const id = target?.dataset?.squishId;
    if ((e.key === "Enter" || e.key === " ") && id) {
      e.preventDefault();
      onSelect(id === selectedId ? null : id);
    }
    if (e.key === "Escape") onSelect(null);
  };

  const focusMode = Boolean(selectedId);
  const pad = 2000;

  return (
    <div
      ref={stageRef}
      className={cn(
        "sky-stage",
        focusMode && "is-focus",
        showFriends && "friends-on",
      )}
      data-variant={variant}
    >
      <StarCanvas />
      <svg
        className="sky-svg"
        onKeyDown={onKeyDown}
        aria-label="Family constellation"
        role="group"
      >
        <defs>
          <clipPath id="orb-clip">
            <circle r={ORB_R} />
          </clipPath>
          {(["gold", "aqua", "pink"] as const).map((name) => (
            <filter
              key={name}
              id={`glow-${name}`}
              filterUnits="userSpaceOnUse"
              x={-pad}
              y={-pad}
              width={layout.width + pad * 2}
              height={layout.height + pad * 2}
            >
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
          {layout.islands.map((island) => (
            <radialGradient key={island.id} id={`neb-${island.id}`}>
              <stop
                offset="0"
                stopColor={island.color}
                stopOpacity={island.kind === "solo" ? 0.16 : 0.24}
              />
              <stop offset="0.6" stopColor={island.color} stopOpacity="0.07" />
              <stop offset="1" stopColor={island.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        <g ref={worldRef} className="sky-world">
          {layout.islands.map((island) => (
            <IslandBackdrop
              key={island.id}
              island={island}
              canName={variant === "app" && Boolean(onNameIsland)}
            />
          ))}
          <Edges
            edges={layout.edges}
            selectedId={selectedId}
            litIds={litIds}
            showFriends={showFriends}
          />
          <g className="sky-nodes">
            {layout.nodes.map((node, i) => {
              const squish = squishMap.get(node.id);
              if (!squish) return null;
              const isSel = node.id === selectedId;
              const isLit = litIds.has(node.id);
              return (
                <SquishStar
                  key={node.id}
                  node={node}
                  squish={squish}
                  tenantId={tenantId}
                  index={i}
                  selected={isSel}
                  lit={isLit}
                  dimmed={focusMode && !isSel && !isLit}
                  role={isLit ? (roles.get(node.id) ?? null) : null}
                />
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
