// Player types

export type RepeatMode = "off" | "one" | "all";
export type ShuffleMode = "off" | "on";

export interface PlayerState {
  currentSong: import("./music").Song | null;
  queue: import("./music").Song[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number; // 0-1
  isMuted: boolean;
  progress: number; // seconds
  duration: number; // seconds
  shuffle: boolean;
  repeat: RepeatMode;
  playbackSpeed: number;
  isLoading: boolean;
  error: string | null;
}

export interface QueueItem {
  song: import("./music").Song;
  index: number;
  isCurrentlyPlaying: boolean;
}
