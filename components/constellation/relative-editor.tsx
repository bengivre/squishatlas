"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { createRelationshipAction } from "@/app/t/[slug]/family/actions";
import type { RelationshipType } from "@/db/schema/relationship";
import type { Gender } from "@/lib/relationship/derive";
import {
  RELATIONSHIP_TYPE_EMOJI,
  RELATIONSHIP_TYPE_LABELS,
  resolveInverseType,
} from "@/lib/relationship/inverse-resolution";

import { MiniAvatar } from "./focus-peek";
import type { SquishWithPhoto } from "./types";
import { cn } from "@/lib/utils";

const TILE_GROUPS: { label: string; types: RelationshipType[] }[] = [
  { label: "Parents", types: ["mom", "dad"] },
  { label: "Partner", types: ["partner"] },
  { label: "Siblings", types: ["sister", "brother", "twin"] },
  { label: "Kids", types: ["daughter", "son"] },
  { label: "Grandparents", types: ["grandma", "grandpa"] },
  {
    label: "More family",
    types: [
      "aunt",
      "uncle",
      "cousin",
      "niece",
      "nephew",
      "granddaughter",
      "grandson",
    ],
  },
  { label: "Friends", types: ["friend", "bestFriend"] },
];

function defaultInverse(
  type: RelationshipType,
  genderOfFrom: Gender | undefined,
): RelationshipType {
  const res = resolveInverseType(type);
  if (res.kind === "resolved") return res.inverseType;
  const [a, b] = res.options;
  if (genderOfFrom === "f") {
    return [
      "daughter",
      "sister",
      "granddaughter",
      "niece",
      "mom",
      "grandma",
      "aunt",
    ].includes(a)
      ? a
      : b;
  }
  if (genderOfFrom === "m") {
    return [
      "son",
      "brother",
      "grandson",
      "nephew",
      "dad",
      "grandpa",
      "uncle",
    ].includes(a)
      ? a
      : b;
  }
  return res.defaultOption;
}

/**
 * Two taps: who, then how. Reads as a sentence the whole way:
 * "Luna is Pip's … [Mom]".  When the other direction isn't obvious
 * (is Pip her son or daughter?) one more tap settles it.
 */
export function RelativeEditor({
  slug,
  tenantId,
  squishies,
  gender,
  initialFromId,
  onLinked,
}: {
  slug: string;
  tenantId: string;
  squishies: SquishWithPhoto[];
  gender: Map<string, Gender>;
  initialFromId: string | null;
  onLinked?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fromId, setFromId] = useState<string | null>(initialFromId);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [type, setType] = useState<RelationshipType | null>(null);
  const [inverse, setInverse] = useState<RelationshipType | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const byId = useMemo(
    () => new Map(squishies.map((s) => [s.id, s])),
    [squishies],
  );
  const from = fromId ? byId.get(fromId) : null;
  const other = otherId ? byId.get(otherId) : null;

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return squishies.filter(
      (s) => s.id !== fromId && (!q || s.name.toLowerCase().includes(q)),
    );
  }, [search, squishies, fromId]);

  const step: "from" | "who" | "how" | "confirm" = !from
    ? "from"
    : !other
      ? "who"
      : !type
        ? "how"
        : "confirm";
  const resolution = type ? resolveInverseType(type) : null;

  function pickType(t: RelationshipType) {
    setType(t);
    const inv = defaultInverse(t, fromId ? gender.get(fromId) : undefined);
    setInverse(inv);
    const res = resolveInverseType(t);
    if (res.kind === "resolved") {
      submit(t, inv);
    }
  }

  function submit(t = type, inv = inverse) {
    if (!fromId || !otherId || !t || !inv) return;
    setError(null);
    startTransition(async () => {
      // "Other is From's Mom": the forward type belongs to Other → From.
      const result = await createRelationshipAction(
        slug,
        otherId,
        fromId,
        t,
        inv,
      );
      if (!result.ok) {
        setError(result.message);
        setType(null);
        setInverse(null);
        return;
      }
      setDone(
        `${other?.name} is now ${from?.name}’s ${RELATIONSHIP_TYPE_LABELS[t].toLowerCase()} ✨`,
      );
      setOtherId(null);
      setType(null);
      setInverse(null);
      setSearch("");
      router.refresh();
      onLinked?.();
    });
  }

  return (
    <div className="editor">
      <p className="editor-sentence" aria-live="polite">
        {other ? (
          <>
            <b>{other.name}</b> is <b>{from?.name}</b>&rsquo;s
            {type ? (
              <>
                {" "}
                <b>{RELATIONSHIP_TYPE_LABELS[type].toLowerCase()}</b>
              </>
            ) : (
              <span className="editor-blank"> …</span>
            )}
          </>
        ) : from ? (
          <>
            Who is <b>{from.name}</b>&rsquo;s relative or friend?
          </>
        ) : (
          <>Who do you want to link?</>
        )}
      </p>

      {done ? <p className="editor-done">{done}</p> : null}
      {error ? <p className="editor-error">{error}</p> : null}

      {(step === "from" || step === "who") && (
        <>
          <input
            id="editor-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a squish…"
            aria-label="Find a squish"
            className="editor-search"
          />
          <ul
            className="picker"
            aria-label={
              step === "from"
                ? "Pick a squish"
                : `Pick ${from?.name}'s relative`
            }
          >
            {candidates.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={isPending}
                  className="picker-item"
                  onClick={() => {
                    setDone(null);
                    setError(null);
                    setSearch("");
                    if (step === "from") setFromId(s.id);
                    else setOtherId(s.id);
                  }}
                >
                  <MiniAvatar
                    squish={s}
                    tenantId={tenantId}
                    className="picker-av"
                  />
                  <span>{s.name}</span>
                </button>
              </li>
            ))}
            {candidates.length === 0 ? (
              <li className="picker-empty">No squish matches that name.</li>
            ) : null}
          </ul>
          {from && step === "who" ? (
            <button
              type="button"
              className="editor-link"
              onClick={() => setFromId(null)}
            >
              Start from someone else
            </button>
          ) : null}
        </>
      )}

      {step === "how" && (
        <div className="tiles-wrap">
          {TILE_GROUPS.map((g) => (
            <div key={g.label} className="tile-group">
              <p className="tile-k">{g.label}</p>
              <div className="tiles">
                {g.types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={isPending}
                    className={cn(
                      "tile",
                      (t === "friend" || t === "bestFriend") && "is-friend",
                    )}
                    onClick={() => pickType(t)}
                  >
                    <span className="tile-emoji" aria-hidden>
                      {RELATIONSHIP_TYPE_EMOJI[t]}
                    </span>
                    {RELATIONSHIP_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="editor-link"
            onClick={() => setOtherId(null)}
          >
            Pick someone else
          </button>
        </div>
      )}

      {step === "confirm" && resolution?.kind === "prompt" && type && (
        <div className="confirm">
          <p className="editor-sentence">
            And <b>{from?.name}</b> is <b>{other?.name}</b>&rsquo;s…
          </p>
          <div className="tiles">
            {resolution.options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={cn("tile", inverse === opt && "is-on")}
                onClick={() => setInverse(opt)}
              >
                <span className="tile-emoji" aria-hidden>
                  {RELATIONSHIP_TYPE_EMOJI[opt]}
                </span>
                {RELATIONSHIP_TYPE_LABELS[opt]}
              </button>
            ))}
          </div>
          <div className="editor-actions">
            <button
              type="button"
              className="pill is-primary"
              disabled={isPending || !inverse}
              onClick={() => submit()}
            >
              {isPending ? "Linking…" : "Link them ✨"}
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => {
                setType(null);
                setInverse(null);
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
      {isPending && step !== "confirm" ? (
        <p className="editor-pending">Linking…</p>
      ) : null}
    </div>
  );
}
