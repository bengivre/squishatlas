"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Page transition: 200ms fade-and-rise; opacity-only under reduced motion. */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
