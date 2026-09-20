"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MiniAvatar } from "./focus-peek";
import type { Island } from "./layout-islands";
import type { SquishWithPhoto } from "./types";

export function SkySearch({
  squishies,
  islands,
  tenantId,
  onPick,
}: {
  squishies: SquishWithPhoto[];
  islands: Island[];
  tenantId: string;
  onPick: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return squishies
      .filter((s) => s.name.toLowerCase().includes(query))
      .slice(0, 6);
  }, [q, squishies]);

  useEffect(() => {
    const onDoc = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  const islandOf = (id: string) =>
    islands.find((i) => i.memberIds.includes(id));

  function pick(id: string) {
    setQ("");
    setOpen(false);
    onPick(id);
  }

  return (
    <div className="sky-search" ref={wrap}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="sky-search"
        type="search"
        value={q}
        placeholder="Find a squish…"
        aria-label="Find a squish"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls="sky-search-hits"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(hits.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && hits[active]) {
            e.preventDefault();
            pick(hits[active].id);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && hits.length > 0 ? (
        <ul className="sky-search-hits" id="sky-search-hits" role="listbox">
          {hits.map((s, i) => {
            const island = islandOf(s.id);
            return (
              <li key={s.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  className={i === active ? "is-active" : ""}
                  onClick={() => pick(s.id)}
                >
                  <MiniAvatar squish={s} tenantId={tenantId} />
                  <span>{s.name}</span>
                  <small>
                    {island ? `${island.emoji} ${island.label}` : ""}
                  </small>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {open && q.trim() && hits.length === 0 ? (
        <p className="sky-search-error">No squish matches that name.</p>
      ) : null}
    </div>
  );
}
