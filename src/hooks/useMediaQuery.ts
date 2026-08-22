"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Reactive media query hook.
 * SSR-safe: renders with the server snapshot during hydration,
 * then updates live as the viewport changes.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // Default to portrait layout on the server
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
