"use client";

import { create } from "zustand";
import type { Song } from "@/types/music";
import type { RepeatMode } from "@/types/player";
import { shuffleArray } from "@/utils/format";

interface PlayerStore {
  // State
  currentSong: Song | null;
  queue: Song[];
  originalQueue: Song[]; // unshuffled queue for toggle
  queueIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number; // seconds
  duration: number; // seconds
  shuffle: boolean;
  repeat: RepeatMode;
  playbackSpeed: number;
  isLoading: boolean;
  error: string | null;
  seekTo: number | null; // seek target request channel

  // Actions
  play: (song?: Song) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (position: number) => void;
  requestSeek: (position: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  currentSong: null,
  queue: [],
  originalQueue: [],
  queueIndex: -1,
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",
  playbackSpeed: 1,
  isLoading: false,
  error: null,
  seekTo: null,

  // Actions
  play: (song) => {
    if (song) {
      const { queue, queueIndex } = get();
      const existingIndex = queue.findIndex((s) => s.id === song.id);

      if (existingIndex >= 0) {
        set({
          currentSong: song,
          queueIndex: existingIndex,
          isPlaying: true,
          progress: 0,
          error: null,
        });
      } else {
        // If no queue exists, create one with just this song
        set({
          currentSong: song,
          queue: queue.length > 0 ? queue : [song],
          queueIndex: queue.length > 0 ? queueIndex : 0,
          isPlaying: true,
          progress: 0,
          error: null,
        });
      }
    } else {
      set({ isPlaying: true });
    }
  },

  pause: () => set({ isPlaying: false }),

  togglePlay: () => {
    const { isPlaying, currentSong } = get();
    if (currentSong) {
      set({ isPlaying: !isPlaying });
    }
  },

  next: () => {
    const { queue, queueIndex, repeat } = get();
    if (queue.length === 0) return;

    let nextIndex: number;

    if (repeat === "one") {
      nextIndex = queueIndex;
      set({ progress: 0 });
    } else if (queueIndex >= queue.length - 1) {
      if (repeat === "all") {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    } else {
      nextIndex = queueIndex + 1;
    }

    set({
      queueIndex: nextIndex,
      currentSong: queue[nextIndex],
      isPlaying: true,
      progress: 0,
    });
  },

  previous: () => {
    const { queue, queueIndex, progress } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current song
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;

    set({
      queueIndex: prevIndex,
      currentSong: queue[prevIndex],
      isPlaying: true,
      progress: 0,
    });
  },

  seek: (position) => set({ progress: position }),
  requestSeek: (position) => set({ seekTo: position }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  setVolume: (volume) =>
    set({ volume: Math.max(0, Math.min(1, volume)), isMuted: false }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  toggleShuffle: () => {
    const { shuffle, queue, originalQueue, queueIndex, currentSong } =
      get();

    if (!shuffle) {
      // Enable shuffle — shuffle the queue but keep current song
      const otherSongs = queue.filter((_, i) => i !== queueIndex);
      const shuffled = [currentSong!, ...shuffleArray(otherSongs)].filter(
        Boolean
      );
      set({
        shuffle: true,
        originalQueue: [...queue],
        queue: shuffled,
        queueIndex: 0,
      });
    } else {
      // Disable shuffle — restore original order
      const currentId = currentSong?.id;
      const restored = originalQueue.length > 0 ? originalQueue : queue;
      const newIndex = restored.findIndex((s) => s.id === currentId);
      set({
        shuffle: false,
        queue: restored,
        queueIndex: Math.max(0, newIndex),
        originalQueue: [],
      });
    }
  },

  cycleRepeat: () => {
    const { repeat } = get();
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    set({ repeat: nextMode });
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setQueue: (songs, startIndex = 0) => {
    set({
      queue: songs,
      originalQueue: songs,
      queueIndex: startIndex,
      currentSong: songs[startIndex] || null,
      isPlaying: true,
      progress: 0,
      error: null,
    });
  },

  addToQueue: (song) => {
    set((state) => ({
      queue: [...state.queue, song],
      originalQueue: [...state.originalQueue, song],
    }));
  },

  removeFromQueue: (index) => {
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      const newIndex =
        index < state.queueIndex
          ? state.queueIndex - 1
          : state.queueIndex;
      return {
        queue: newQueue,
        queueIndex: Math.min(newIndex, newQueue.length - 1),
      };
    });
  },

  clearQueue: () =>
    set({
      queue: [],
      originalQueue: [],
      queueIndex: -1,
      currentSong: null,
      isPlaying: false,
      progress: 0,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
