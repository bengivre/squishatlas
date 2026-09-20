"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { RelationshipPair } from "@/lib/dal";
import { KIN_LABELS, kinOf } from "@/lib/relationship/derive";

import { FamilyManager, LinkList } from "./family-manager";
import { FocusPeek } from "./focus-peek";
import { layoutSky } from "./layout-islands";
import { LinkFamilySheet, type SheetMode } from "./link-family-sheet";
import { OrbitView } from "./orbit-view";
import { RelativeEditor } from "./relative-editor";
import { Sky, type SkyHandle } from "./sky";
import { SkySearch } from "./sky-search";
import type { FamilyInfo, SquishWithPhoto, Variant } from "./types";
import { cn } from "@/lib/utils";

export function ConstellationView({
  tenantId,
  slug,
  variant = "app",
  squishies,
  pairs,
  families,
}: {
  tenantId: string;
  slug?: string;
  variant?: Variant;
  squishies: SquishWithPhoto[];
  pairs: RelationshipPair[];
  families: FamilyInfo[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [orbitOpen, setOrbitOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("add");
  const [editorFromId, setEditorFromId] = useState<string | null>(null);
  const [namingIsland, setNamingIsland] = useState<string | null>(null);
  const [activeIsland, setActiveIsland] = useState<string | null>(null);
  const skyRef = useRef<SkyHandle>(null);
  const chromeRef = useRef<HTMLDivElement>(null);

  const squishMap = useMemo(
    () => new Map(squishies.map((s) => [s.id, s])),
    [squishies],
  );
  const layout = useMemo(
    () => layoutSky(squishies, pairs, families),
    [squishies, pairs, families],
  );

  // A squish deleted elsewhere simply drops out of the selection.
  const selected = selectedId ? (squishMap.get(selectedId) ?? null) : null;
  const activeId = selected ? selected.id : null;

  // Cheap enough to recompute on every render; keeps the compiler happy.
  const kin = activeId ? kinOf(layout.graph, activeId) : [];
  const litIds = new Set(kin.map((k) => k.otherId));
  const roles = new Map<string, string>();
  // family roles win over "friend" when both apply
  for (const k of [...kin].reverse()) roles.set(k.otherId, KIN_LABELS[k.role]);
  const selectedIsland = activeId
    ? (layout.islands.find((i) => i.memberIds.includes(activeId)) ?? null)
    : null;

  const inset = useCallback(() => {
    const h = chromeRef.current?.getBoundingClientRect().height ?? 120;
    const narrow = typeof window !== "undefined" && window.innerWidth < 640;
    return {
      top: Math.round(h) + 20,
      bottom: narrow ? 90 : 70,
      left: 20,
      right: 20,
    };
  }, []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) skyRef.current?.focusNode(id);
  }, []);

  const openSheet = (
    mode: SheetMode,
    fromId: string | null = null,
    island: string | null = null,
  ) => {
    setSheetMode(mode);
    setEditorFromId(fromId);
    setNamingIsland(island);
    setSheetOpen(true);
  };

  if (squishies.length === 0) {
    return (
      <section className={`sky sky--${variant}`}>
        <div className="sky-empty">
          <p className="app-eyebrow">Family map</p>
          <h2 className="app-title">Constellation</h2>
          <p className="text-star-dim mt-3 text-sm">
            Add a few squishies and link their family to light up the sky.
          </p>
        </div>
      </section>
    );
  }

  const familyCount = layout.islands.filter((i) => i.kind !== "solo").length;

  return (
    <section className={`sky sky--${variant}`}>
      <Sky
        layout={layout}
        squishMap={squishMap}
        tenantId={tenantId}
        variant={variant}
        selectedId={activeId}
        litIds={litIds}
        roles={roles}
        showFriends={showFriends}
        inset={inset}
        handleRef={skyRef}
        onSelect={select}
        onNameIsland={
          variant === "app" && slug
            ? (id) => openSheet("families", null, id)
            : undefined
        }
      />

      <div className="sky-chrome" ref={chromeRef}>
        <div className="sky-chrome-row">
          <div className="min-w-0">
            <div className="app-eyebrow">Family map</div>
            <h2 className="sky-title">
              Constellation
              <small>
                {squishies.length} squishies · {familyCount}{" "}
                {familyCount === 1 ? "family" : "families"}
              </small>
            </h2>
          </div>
          <SkySearch
            squishies={squishies}
            islands={layout.islands}
            tenantId={tenantId}
            onPick={select}
          />
          <div className="sky-chrome-actions">
            <button
              type="button"
              className={cn("pill", showFriends && "is-on")}
              aria-pressed={showFriends}
              onClick={() => setShowFriends((v) => !v)}
            >
              <span
                className="dot"
                style={{
                  background: "var(--aurora)",
                  boxShadow: "0 0 8px var(--aurora)",
                }}
              />
              Friends
            </button>
            {variant === "app" && slug ? (
              <button
                type="button"
                className="pill is-primary"
                onClick={() => openSheet("add", activeId)}
              >
                ✦ Link family
              </button>
            ) : null}
          </div>
        </div>
        {layout.islands.length > 1 ? (
          <div className="sky-rail" role="group" aria-label="Families">
            <button
              type="button"
              className={cn("pill", activeIsland === null && "is-on")}
              onClick={() => {
                setActiveIsland(null);
                skyRef.current?.fitAll();
              }}
            >
              All <span className="count">{squishies.length}</span>
            </button>
            {layout.islands.map((island) => (
              <button
                key={island.id}
                type="button"
                className={cn("pill", activeIsland === island.id && "is-on")}
                onClick={() => {
                  setActiveIsland(island.id);
                  skyRef.current?.fitIsland(island.id);
                }}
              >
                <span
                  className="dot"
                  style={{
                    background: island.color,
                    boxShadow: `0 0 8px ${island.color}`,
                  }}
                />
                {island.emoji} {island.label}{" "}
                <span className="count">{island.memberIds.length}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="sky-legend" aria-hidden>
        <span>
          <i /> Family
        </span>
        <span>
          <i className="is-heart">♥</i> Couple
        </span>
        <span>
          <i className="is-friend" /> Friends
        </span>
      </div>

      <div
        className={cn("sky-zoom", selected && "is-lifted")}
        role="group"
        aria-label="Zoom"
      >
        <button
          type="button"
          onClick={() => skyRef.current?.zoomBy(1.3)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => skyRef.current?.zoomBy(1 / 1.3)}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="is-fit"
          onClick={() => {
            setActiveIsland(null);
            skyRef.current?.fitAll();
          }}
          aria-label="Fit everything"
        >
          FIT
        </button>
      </div>

      {selected ? (
        <FocusPeek
          tenantId={tenantId}
          slug={slug}
          variant={variant}
          squish={selected}
          island={selectedIsland}
          kin={kin}
          squishMap={squishMap}
          onSelect={select}
          onOrbit={() => setOrbitOpen(true)}
          onAddRelative={
            variant === "app" && slug
              ? () => openSheet("add", selected.id)
              : undefined
          }
          onEditLinks={
            variant === "app" && slug
              ? () => openSheet("links", selected.id)
              : undefined
          }
          onClose={() => setSelectedId(null)}
        />
      ) : null}

      {orbitOpen && selected ? (
        <OrbitView
          tenantId={tenantId}
          squish={selected}
          kin={kin}
          squishMap={squishMap}
          onPick={(id) => select(id)}
          onClose={() => setOrbitOpen(false)}
        />
      ) : null}

      {variant === "app" && slug ? (
        <LinkFamilySheet
          open={sheetOpen}
          mode={sheetMode}
          onOpenChange={setSheetOpen}
          onModeChange={setSheetMode}
        >
          {sheetMode === "add" ? (
            <RelativeEditor
              key={editorFromId ?? "any"}
              slug={slug}
              tenantId={tenantId}
              squishies={squishies}
              gender={layout.graph.gender}
              initialFromId={editorFromId}
            />
          ) : sheetMode === "families" ? (
            <FamilyManager
              key={namingIsland ?? "families"}
              slug={slug}
              tenantId={tenantId}
              families={families}
              islands={layout.islands}
              squishMap={squishMap}
              startCreatingFor={namingIsland}
            />
          ) : (
            <LinkList
              slug={slug}
              tenantId={tenantId}
              pairs={pairs}
              squishMap={squishMap}
              filterId={editorFromId}
            />
          )}
        </LinkFamilySheet>
      ) : null}
    </section>
  );
}
