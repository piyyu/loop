// Navigation types for iPod menu system

export type ScreenId =
  | "home"
  | "music"
  | "playlists"
  | "playlist-detail"
  | "albums"
  | "artists"
  | "artist-detail"
  | "songs"
  | "favorites"
  | "downloads"
  | "recently-played"
  | "search"
  | "settings"
  | "now-playing"
  | "cover-flow"
  | "equalizer"
  | "lyrics"
  | "stats";

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  screen?: ScreenId;
  action?: () => void;
  hasArrow?: boolean;
  subtitle?: string;
  data?: Record<string, unknown>;
}

export interface Screen {
  id: ScreenId;
  title: string;
  items?: MenuItem[];
  data?: Record<string, unknown>;
}

export type TransitionDirection = "left" | "right" | "none";
