"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingsState, ThemeId } from "@/types/settings";
import type { AudioQuality } from "@/types/music";

interface SettingsStore extends SettingsState {
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  setTheme: (theme: ThemeId) => void;
  setPlaybackQuality: (quality: AudioQuality) => void;
  setClickSounds: (enabled: boolean) => void;
  setHapticFeedback: (enabled: boolean) => void;
  setCacheSize: (size: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: SettingsState = {
  darkMode: false,
  theme: "classic",
  playbackQuality: "high",
  clickSounds: true,
  hapticFeedback: true,
  cacheSize: 500,
  sleepTimer: null,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setDarkMode: (enabled) => set({ darkMode: enabled }),
      toggleDarkMode: () =>
        set((state) => ({ darkMode: !state.darkMode })),
      setTheme: (theme) => set({ theme }),
      setPlaybackQuality: (quality) =>
        set({ playbackQuality: quality }),
      setClickSounds: (enabled) => set({ clickSounds: enabled }),
      setHapticFeedback: (enabled) => set({ hapticFeedback: enabled }),
      setCacheSize: (size) => set({ cacheSize: size }),
      setSleepTimer: (minutes) => set({ sleepTimer: minutes }),
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "loop-settings",
    }
  )
);
