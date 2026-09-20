"use client";

import { useEffect } from "react";

/** Registers the Squishatlas service worker for installability + offline shell. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration can fail on unsupported origins; ignore silently.
    });
  }, []);

  return null;
}
