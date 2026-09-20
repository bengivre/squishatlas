"use client";

import Link from "next/link";

import type { FilterChip } from "./build-filter-chips";

export type { FilterChip };

export function FilterChips({
  chips,
  activeId,
}: {
  chips: FilterChip[];
  activeId: string;
}) {
  return (
    <div className="filter-chips" role="group" aria-label="Filter collection">
      {chips.map((chip) => {
        const isActive = chip.id === activeId;
        return (
          <Link
            key={chip.id}
            href={chip.href}
            className={`filter-chip${isActive ? " on" : ""}`}
            aria-current={isActive ? "true" : undefined}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}
