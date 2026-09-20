import Link from "next/link";

import type { AttentionItem } from "@/lib/admin/platform-stats";
import { cn } from "@/lib/utils";

const kindLabel: Record<AttentionItem["kind"], string> = {
  no_owner: "Owner needed",
  expired_invite: "Invite expired",
  must_change_password: "Password reset",
  unverified_email: "Unverified",
};

const kindTone: Record<AttentionItem["kind"], string> = {
  no_owner: "border-blush/40 text-blush",
  expired_invite: "border-moon-gold/40 text-moon-gold",
  must_change_password: "border-aurora/40 text-aurora",
  unverified_email: "border-star-dim/40 text-star-dim",
};

export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-aurora/20 bg-night-plum/60 px-5 py-6">
        <p className="text-sm text-aurora">All clear — nothing needs attention.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const className = cn(
          "block rounded-card border bg-night-plum/80 px-4 py-3 transition",
          kindTone[item.kind],
          item.href ? "hover:border-moon-gold/35" : "",
        );
        const content = (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-lamplight">{item.title}</p>
              <span className="text-[11px] tracking-wide uppercase opacity-80">
                {kindLabel[item.kind]}
              </span>
            </div>
            <p className="mt-1 text-xs text-star-dim">{item.detail}</p>
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className={className}>
                {content}
              </Link>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
