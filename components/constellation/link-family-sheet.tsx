"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SheetMode = "add" | "families" | "links";

export function LinkFamilySheet({
  open,
  mode,
  onOpenChange,
  onModeChange,
  children,
}: {
  open: boolean;
  mode: SheetMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: SheetMode) => void;
  children: ReactNode;
}) {
  const tabs: { mode: SheetMode; label: string }[] = [
    { mode: "add", label: "✦ Link" },
    { mode: "families", label: "Families" },
    { mode: "links", label: "All links" },
  ];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sky-sheet-overlay" />
        <Dialog.Content className="sky-sheet" aria-describedby={undefined}>
          <div className="sky-sheet-handle" aria-hidden />
          <div className="sky-sheet-head">
            <Dialog.Title className="sky-sheet-title">Link family</Dialog.Title>
            <Dialog.Close className="pill is-quiet">Done</Dialog.Close>
          </div>
          <div className="sky-sheet-tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.mode}
                type="button"
                role="tab"
                aria-selected={mode === t.mode}
                className={cn("pill", mode === t.mode && "is-on")}
                onClick={() => onModeChange(t.mode)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="sky-sheet-body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
