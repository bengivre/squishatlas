"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Card press: scale(0.96) spring ~150ms; no-op under reduced motion. */
export function Pressable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 500, damping: 30, duration: 0.15 }
      }
    >
      {children}
    </motion.div>
  );
}
