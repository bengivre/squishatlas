"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

export type View = { x: number; y: number; k: number };
export type Box = { x: number; y: number; w: number; h: number };

const MIN_K = 0.18;
const MAX_K = 2.6;

function clampK(k: number) {
  return Math.min(MAX_K, Math.max(MIN_K, k));
}

/**
 * Pan / pinch / wheel zoom for an SVG world group, plus animated camera moves.
 * Keeps the transform in a ref and writes it straight to the DOM so dragging
 * never re-renders React; `view` state is only updated when a gesture ends.
 */
export function useViewport(
  stageRef: RefObject<HTMLElement | null>,
  worldRef: RefObject<SVGGElement | null>,
  options: {
    onTap?: (target: Element | null) => void;
    onGestureStart?: () => void;
  } = {},
) {
  const viewRef = useRef<View>({ x: 0, y: 0, k: 1 });
  const [view, setView] = useState<View>(() => ({ x: 0, y: 0, k: 1 }));
  const animRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const apply = useCallback(() => {
    const v = viewRef.current;
    worldRef.current?.setAttribute(
      "transform",
      `translate(${v.x} ${v.y}) scale(${v.k})`,
    );
  }, [worldRef]);

  const commit = useCallback(() => {
    setView({ ...viewRef.current });
  }, []);

  const stopAnimation = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (target: View, ms = 550) => {
      stopAnimation();
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || ms <= 0) {
        viewRef.current = target;
        apply();
        commit();
        return;
      }
      const from = { ...viewRef.current };
      const t0 = performance.now();
      const step = (t: number) => {
        const u = Math.min(1, (t - t0) / ms);
        const e = 1 - Math.pow(1 - u, 3);
        viewRef.current = {
          x: from.x + (target.x - from.x) * e,
          y: from.y + (target.y - from.y) * e,
          k: from.k + (target.k - from.k) * e,
        };
        apply();
        if (u < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          animRef.current = null;
          commit();
        }
      };
      animRef.current = requestAnimationFrame(step);
    },
    [apply, commit, stopAnimation],
  );

  /** Fit a world-space box into the stage, leaving room for overlays. */
  const fitBox = useCallback(
    (
      box: Box,
      inset: { top: number; bottom: number; left: number; right: number },
      ms = 550,
      maxK = 1.6,
    ) => {
      const stage = stageRef.current;
      if (!stage) return;
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const availW = Math.max(80, W - inset.left - inset.right);
      const availH = Math.max(80, H - inset.top - inset.bottom);
      const k = clampK(Math.min(maxK, availW / box.w, availH / box.h));
      animateTo(
        {
          k,
          x: inset.left + (availW - box.w * k) / 2 - box.x * k,
          y: inset.top + (availH - box.h * k) / 2 - box.y * k,
        },
        ms,
      );
    },
    [animateTo, stageRef],
  );

  /** Put a world point at a given stage fraction, at zoom k. */
  const centerOn = useCallback(
    (wx: number, wy: number, k: number, fx = 0.5, fy = 0.5, ms = 450) => {
      const stage = stageRef.current;
      if (!stage) return;
      const kk = clampK(k);
      animateTo(
        {
          k: kk,
          x: stage.clientWidth * fx - wx * kk,
          y: stage.clientHeight * fy - wy * kk,
        },
        ms,
      );
    },
    [animateTo, stageRef],
  );

  const zoomBy = useCallback(
    (factor: number, ms = 220) => {
      const stage = stageRef.current;
      if (!stage) return;
      const v = viewRef.current;
      const px = stage.clientWidth / 2;
      const py = stage.clientHeight / 2;
      const k = clampK(v.k * factor);
      animateTo(
        { k, x: px - (px - v.x) * (k / v.k), y: py - (py - v.y) * (k / v.k) },
        ms,
      );
    },
    [animateTo, stageRef],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointers = new Map<number, { x: number; y: number }>();
    let last: { x: number; y: number } | null = null;
    let lastDist = 0;
    let moved = false;
    let downTarget: Element | null = null;

    const zoomAt = (factor: number, px: number, py: number) => {
      const v = viewRef.current;
      const k = clampK(v.k * factor);
      viewRef.current = {
        k,
        x: px - (px - v.x) * (k / v.k),
        y: py - (py - v.y) * (k / v.k),
      };
      apply();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopAnimation();
      const r = stage.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        // trackpad pinch arrives as ctrl+wheel
        zoomAt(
          Math.exp(-e.deltaY * 0.01),
          e.clientX - r.left,
          e.clientY - r.top,
        );
      } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        viewRef.current = {
          ...viewRef.current,
          x: viewRef.current.x - (e.shiftKey ? e.deltaY : e.deltaX),
        };
        apply();
      } else {
        zoomAt(
          Math.exp(-e.deltaY * 0.0015),
          e.clientX - r.left,
          e.clientY - r.top,
        );
      }
      commit();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      stopAnimation();
      optionsRef.current.onGestureStart?.();
      downTarget = e.target as Element;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      stage.setPointerCapture?.(e.pointerId);
      last = { x: e.clientX, y: e.clientY };
      moved = false;
      stage.classList.add("is-dragging");
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = [...pointers.values()];
      if (pts.length >= 2) {
        const [a, b] = pts;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const r = stage.getBoundingClientRect();
        const mx = (a.x + b.x) / 2 - r.left;
        const my = (a.y + b.y) / 2 - r.top;
        if (lastDist > 0) {
          zoomAt(dist / lastDist, mx, my);
        }
        if (last) {
          const cur = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          viewRef.current = {
            ...viewRef.current,
            x: viewRef.current.x + cur.x - last.x,
            y: viewRef.current.y + cur.y - last.y,
          };
          last = cur;
          apply();
        }
        lastDist = dist;
        moved = true;
        return;
      }
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      viewRef.current = {
        ...viewRef.current,
        x: viewRef.current.x + dx,
        y: viewRef.current.y + dy,
      };
      last = { x: e.clientX, y: e.clientY };
      apply();
    };

    const onUp = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size === 1) {
        const [p] = [...pointers.values()];
        last = { x: p.x, y: p.y };
        lastDist = 0;
        return;
      }
      if (pointers.size > 0) return;
      lastDist = 0;
      last = null;
      stage.classList.remove("is-dragging");
      if (!moved) {
        optionsRef.current.onTap?.(downTarget);
      }
      downTarget = null;
      commit();
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    return () => {
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stopAnimation();
    };
  }, [apply, commit, stageRef, stopAnimation]);

  const setInstant = useCallback(
    (v: View) => {
      viewRef.current = v;
      apply();
      commit();
    },
    [apply, commit],
  );

  return { view, viewRef, fitBox, centerOn, zoomBy, setInstant };
}
