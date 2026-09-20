"use client";

import { motion, useReducedMotion } from "motion/react";

/** CSS mockups of the app — swap for real screenshots later. */
export function HeroAppPreview() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-[340px]"
    >
      <div className="absolute -inset-8 rounded-full bg-moon-gold/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-moon-gold/25 bg-night-plum shadow-glow">
        <div className="flex items-center gap-1.5 border-b border-star-dim/15 px-4 py-3">
          <span className="size-2 rounded-full bg-blush/80" />
          <span className="size-2 rounded-full bg-moon-gold/80" />
          <span className="size-2 rounded-full bg-aurora/80" />
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-star-dim">
            Collection
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {[
            { name: "Pip", hue: "from-[#ffe6c9] to-[#ffb8d9]" },
            { name: "Luna", hue: "from-[#d9f6ff] to-[#a8e8ff]" },
            { name: "Toast", hue: "from-[#fff0c2] to-[#ffc96b]" },
            { name: "Mochi", hue: "from-[#e8d9ff] to-[#c9b0ff]" },
          ].map((squish) => (
            <div key={squish.name} className="space-y-2">
              <div
                className={`aspect-square rounded-[18px] bg-gradient-to-br ${squish.hue} p-3`}
              >
                <div className="flex h-full items-end justify-center">
                  <div className="h-[70%] w-[78%] rounded-[40%] bg-white/35 shadow-inner" />
                </div>
              </div>
              <p className="px-1 font-display text-sm font-semibold text-lamplight">
                {squish.name}
              </p>
              <p className="px-1 text-[10px] font-bold text-star-dim">
                Adopted 2024
              </p>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        className="absolute -right-4 bottom-10 w-[42%] overflow-hidden rounded-2xl border border-aurora/30 bg-night-deep/95 p-3 shadow-glow-aurora"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[9px] font-extrabold uppercase tracking-wide text-aurora">
          Constellation
        </p>
        <div className="relative mt-2 aspect-square">
          <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-lamplight to-[#ffe6c9]" />
          <div className="absolute left-[12%] top-[18%] size-6 rounded-full bg-gradient-to-br from-[#d9f6ff] to-aurora/60" />
          <div className="absolute right-[10%] top-[28%] size-6 rounded-full bg-gradient-to-br from-[#ffb8d9] to-blush/70" />
          <div className="absolute bottom-[14%] left-[28%] size-6 rounded-full bg-gradient-to-br from-moon-gold to-[#ffb84d]" />
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            <line
              x1="50%"
              y1="50%"
              x2="18%"
              y2="24%"
              stroke="#FFC96B"
              strokeWidth="1.5"
              strokeOpacity="0.55"
            />
            <line
              x1="50%"
              y1="50%"
              x2="82%"
              y2="34%"
              stroke="#6FE3D0"
              strokeWidth="1.5"
              strokeOpacity="0.55"
              strokeDasharray="3 4"
            />
            <line
              x1="50%"
              y1="50%"
              x2="36%"
              y2="82%"
              stroke="#FFC96B"
              strokeWidth="1.5"
              strokeOpacity="0.55"
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FeaturePreviews() {
  const reduce = useReducedMotion();

  const panels = [
    {
      label: "Shelf",
      title: "Your collection at a glance",
      body: "Soft polaroid cards for every squish — name, photo, and when they were adopted.",
      visual: "shelf" as const,
    },
    {
      label: "Family map",
      title: "A glowing constellation",
      body: "Tap a squish to see moms, brothers, and best friends — travel the night sky.",
      visual: "map" as const,
    },
    {
      label: "Gallery",
      title: "Share a soft public window",
      body: "Optional gallery and tree pages for grandparents — gated when you want.",
      visual: "gallery" as const,
    },
  ];

  return (
    <div className="mt-10 space-y-14">
      {panels.map((panel, index) => (
        <motion.div
          key={panel.label}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
          className={`flex flex-col gap-6 md:items-center md:gap-10 ${
            index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          <div className="flex-1 space-y-2">
            <p className="app-eyebrow">{panel.label}</p>
            <h3 className="font-display text-2xl font-semibold text-lamplight">
              {panel.title}
            </h3>
            <p className="max-w-md text-base leading-relaxed text-star-dim">
              {panel.body}
            </p>
          </div>
          <div className="flex-1">
            <PreviewFrame visual={panel.visual} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PreviewFrame({
  visual,
}: {
  visual: "shelf" | "map" | "gallery";
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-star-dim/20 bg-night-plum/80 p-4 shadow-glow-soft">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-star-dim">
          Preview
        </span>
        <span className="text-[10px] text-star-dim/70">Screenshot soon</span>
      </div>
      {visual === "shelf" ? <ShelfMock /> : null}
      {visual === "map" ? <MapMock /> : null}
      {visual === "gallery" ? <GalleryMock /> : null}
    </div>
  );
}

function ShelfMock() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["#ffe6c9", "#d9f6ff", "#ffd6e8", "#e8d9ff", "#fff0c2", "#c9f5e8"].map(
        (color, index) => (
          <div key={color} className="rounded-xl bg-lamplight p-1.5">
            <div
              className="aspect-square rounded-lg"
              style={{ background: `linear-gradient(165deg, ${color}, #fff4e2)` }}
            />
            <p className="mt-1 truncate px-0.5 text-[10px] font-bold text-night-deep">
              {["Pip", "Luna", "Mochi", "Toast", "Bean", "Nori"][index]}
            </p>
          </div>
        ),
      )}
    </div>
  );
}

function MapMock() {
  return (
    <div className="relative mx-auto aspect-[4/3] max-w-sm">
      <div className="absolute left-1/2 top-[42%] size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-lamplight to-moon-gold shadow-glow" />
      <div className="absolute left-[8%] top-[18%] size-11 rounded-full bg-gradient-to-br from-[#d9f6ff] to-aurora" />
      <div className="absolute right-[10%] top-[22%] size-11 rounded-full bg-gradient-to-br from-[#ffb8d9] to-blush" />
      <div className="absolute bottom-[12%] left-[22%] size-11 rounded-full bg-gradient-to-br from-[#fff0c2] to-moon-gold" />
      <div className="absolute bottom-[16%] right-[18%] size-11 rounded-full bg-gradient-to-br from-[#e8d9ff] to-[#c9b0ff]" />
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <line x1="50%" y1="42%" x2="14%" y2="24%" stroke="#FFC96B" strokeWidth="2" strokeOpacity="0.5" />
        <line x1="50%" y1="42%" x2="86%" y2="28%" stroke="#6FE3D0" strokeWidth="2" strokeOpacity="0.5" strokeDasharray="5 5" />
        <line x1="50%" y1="42%" x2="28%" y2="82%" stroke="#FFC96B" strokeWidth="2" strokeOpacity="0.5" />
        <line x1="50%" y1="42%" x2="78%" y2="78%" stroke="#6FE3D0" strokeWidth="2" strokeOpacity="0.5" strokeDasharray="5 5" />
      </svg>
      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 font-display text-sm font-semibold text-lamplight">
        Luna&apos;s constellation
      </p>
    </div>
  );
}

function GalleryMock() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {["#ffe6c9", "#d9f6ff", "#ffd6e8", "#fff0c2", "#e8d9ff", "#c9f5e8"].map(
        (color) => (
          <div
            key={color}
            className="aspect-square overflow-hidden rounded-xl"
            style={{ background: `linear-gradient(165deg, ${color}, #241a47)` }}
          />
        ),
      )}
    </div>
  );
}
