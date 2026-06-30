"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true; // assume online during SSR
}

/**
 * Hook to detect online/offline status for PWA offline support.
 */
export function useOffline() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isOnline, isOffline: !isOnline };
}
