"use client";

import { create } from "zustand";
import type {
  ScreenId,
  Screen,
  TransitionDirection,
} from "@/types/navigation";

interface NavigationStore {
  // State
  screenStack: Screen[];
  currentScreen: Screen;
  selectedIndex: number;
  transitionDirection: TransitionDirection;
  isTransitioning: boolean;

  // Actions
  push: (screen: Screen) => void;
  pop: () => void;
  goHome: () => void;
  scrollUp: () => void;
  scrollDown: () => void;
  select: () => void;
  setSelectedIndex: (index: number) => void;
  setScreen: (screen: Screen) => void;
}

const HOME_SCREEN: Screen = {
  id: "home",
  title: "Loop",
  items: [
    {
      id: "playlists",
      label: "Playlists",
      icon: "☰",
      screen: "playlists",
      hasArrow: true,
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: "♥",
      screen: "favorites",
      hasArrow: true,
    },
    {
      id: "search",
      label: "Search",
      icon: "⌕",
      screen: "search",
      hasArrow: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙",
      screen: "settings",
      hasArrow: true,
    },
  ],
};

const MUSIC_SCREEN: Screen = {
  id: "music",
  title: "Music",
  items: [
    {
      id: "playlists",
      label: "Playlists",
      icon: "☰",
      screen: "playlists",
      hasArrow: true,
    },
    {
      id: "albums",
      label: "Albums",
      icon: "◉",
      screen: "albums",
      hasArrow: true,
    },
    {
      id: "artists",
      label: "Artists",
      icon: "♪",
      screen: "artists",
      hasArrow: true,
    },
    {
      id: "songs",
      label: "Songs",
      icon: "♬",
      screen: "songs",
      hasArrow: true,
    },
    {
      id: "cover-flow",
      label: "Cover Flow",
      icon: "❖",
      screen: "cover-flow",
      hasArrow: true,
    },
  ],
};

export const SCREEN_DEFINITIONS: Partial<Record<ScreenId, Screen>> = {
  home: HOME_SCREEN,
  music: MUSIC_SCREEN,
};

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  // Initial state
  screenStack: [HOME_SCREEN],
  currentScreen: HOME_SCREEN,
  selectedIndex: 0,
  transitionDirection: "none",
  isTransitioning: false,

  // Actions
  push: (screen) => {
    set((state) => ({
      screenStack: [...state.screenStack, screen],
      currentScreen: screen,
      selectedIndex: 0,
      transitionDirection: "left",
      isTransitioning: true,
    }));

    // Reset transition flag
    setTimeout(() => set({ isTransitioning: false }), 350);
  },

  pop: () => {
    const { screenStack } = get();
    if (screenStack.length <= 1) return;

    const newStack = screenStack.slice(0, -1);
    const previousScreen = newStack[newStack.length - 1];

    set({
      screenStack: newStack,
      currentScreen: previousScreen,
      selectedIndex: 0,
      transitionDirection: "right",
      isTransitioning: true,
    });

    setTimeout(() => set({ isTransitioning: false }), 350);
  },

  goHome: () => {
    set({
      screenStack: [HOME_SCREEN],
      currentScreen: HOME_SCREEN,
      selectedIndex: 0,
      transitionDirection: "right",
      isTransitioning: true,
    });

    setTimeout(() => set({ isTransitioning: false }), 350);
  },

  scrollUp: () => {
    set((state) => ({
      selectedIndex: Math.max(0, state.selectedIndex - 1),
    }));
  },

  scrollDown: () => {
    const { currentScreen, selectedIndex } = get();
    const itemCount = currentScreen.items?.length || 0;
    if (itemCount === 0) return;

    set({
      selectedIndex: Math.min(itemCount - 1, selectedIndex + 1),
    });
  },

  select: () => {
    const { currentScreen, selectedIndex, push } = get();
    const items = currentScreen.items;
    if (!items || !items[selectedIndex]) return;

    const item = items[selectedIndex];

    // Execute action if provided
    if (item.action) {
      item.action();
      return;
    }

    // Navigate to screen if provided
    if (item.screen) {
      const screenDef = SCREEN_DEFINITIONS[item.screen];
      if (screenDef) {
        push(screenDef);
      } else {
        // Dynamic screen — push with just the ID and title
        push({
          id: item.screen,
          title: item.label,
          data: item.data,
        });
      }
    }
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  setScreen: (screen) => set({ currentScreen: screen }),
}));
