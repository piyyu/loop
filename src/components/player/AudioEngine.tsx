"use client";

import { useEffect } from "react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSettingsStore } from "@/stores/settings-store";
import { usePlayerStore } from "@/stores/player-store";

/**
 * AudioEngine — hidden component that manages the HTML5 Audio element
 * and bridges it with the player store. Also handles keyboard shortcuts.
 */
export function AudioEngine() {
  useAudioPlayer();
  useKeyboard();

  const { sleepTimer } = useSettingsStore();
  const { pause, isPlaying } = usePlayerStore();

  // Sleep timer
  useEffect(() => {
    if (!sleepTimer || !isPlaying) return;

    const timeout = setTimeout(() => {
      pause();
      useSettingsStore.getState().setSleepTimer(null);
    }, sleepTimer * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [sleepTimer, isPlaying, pause]);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed — non-critical
      });
    }
  }, []);

  return null;
}
