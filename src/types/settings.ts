// Settings types

export type ThemeId = "classic" | "black" | "pink" | "blue" | "green";

export interface SettingsState {
  darkMode: boolean;
  theme: ThemeId;
  playbackQuality: import("./music").AudioQuality;
  clickSounds: boolean;
  hapticFeedback: boolean;
  cacheSize: number; // MB
  sleepTimer: number | null; // minutes, null = off
}

export interface ThemeColors {
  body: string;
  screen: string;
  screenText: string;
  wheelOuter: string;
  wheelInner: string;
  wheelText: string;
  highlight: string;
  highlightText: string;
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  classic: {
    body: "#E8E8ED",
    screen: "#B8C9A3",
    screenText: "#1a1a1a",
    wheelOuter: "#E0E0E0",
    wheelInner: "#F5F5F5",
    wheelText: "#333333",
    highlight: "#4A90D9",
    highlightText: "#FFFFFF",
  },
  black: {
    body: "#1A1A1A",
    screen: "#0A0A0A",
    screenText: "#FFFFFF",
    wheelOuter: "#2A2A2A",
    wheelInner: "#1A1A1A",
    wheelText: "#CCCCCC",
    highlight: "#4A90D9",
    highlightText: "#FFFFFF",
  },
  pink: {
    body: "#F5C6D0",
    screen: "#B8C9A3",
    screenText: "#1a1a1a",
    wheelOuter: "#F0B8C4",
    wheelInner: "#F5D0D8",
    wheelText: "#333333",
    highlight: "#D94A7A",
    highlightText: "#FFFFFF",
  },
  blue: {
    body: "#A8C8E8",
    screen: "#B8C9A3",
    screenText: "#1a1a1a",
    wheelOuter: "#98B8D8",
    wheelInner: "#B8D0E8",
    wheelText: "#333333",
    highlight: "#2A6CB0",
    highlightText: "#FFFFFF",
  },
  green: {
    body: "#A8D8A8",
    screen: "#B8C9A3",
    screenText: "#1a1a1a",
    wheelOuter: "#98C898",
    wheelInner: "#B8D8B8",
    wheelText: "#333333",
    highlight: "#2A8B2A",
    highlightText: "#FFFFFF",
  },
};
