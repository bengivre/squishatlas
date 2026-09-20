import type { DayBucket } from "@/lib/admin/platform-stats";

export function Sparkline({
  label,
  data,
  accent = "gold",
}: {
  label: string;
  data: DayBucket[];
  accent?: "gold" | "aurora";
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const stroke = accent === "aurora" ? "var(--aurora)" : "var(--moon-gold)";

  const width = 160;
  const height = 40;
  const pad = 2;
  const points = data
    .map((d, i) => {
      const x =
        pad + (i / Math.max(1, data.length - 1)) * (width - pad * 2);
      const y =
        height - pad - (d.count / max) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-card border border-star-dim/20 bg-night-plum/80 px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-xs tracking-wide text-star-dim uppercase">{label}</p>
        <p className="font-display text-lg tabular-nums text-lamplight">
          {total}
          <span className="ml-1 text-xs font-sans text-star-dim">/ 7d</span>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-10 w-full"
        role="img"
        aria-label={`${label}: ${total} in the last 7 days`}
      >
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
          opacity={0.9}
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-star-dim">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}
