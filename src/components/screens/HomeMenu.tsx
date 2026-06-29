"use client";

import { useNavigationStore, SCREEN_DEFINITIONS } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";

/**
 * Home menu screen — the iPod's main menu.
 * Dynamically shows "Now Playing" when a song is active.
 */
export function HomeMenu() {
  const { push } = useNavigationStore();
  const { currentSong, isPlaying } = usePlayerStore();
  const screen = SCREEN_DEFINITIONS.home!;
  const baseItems = screen.items || [];

  const items: MenuItem[] = [...baseItems];

  // Add "Now Playing" at the top when a song is loaded
  if (currentSong) {
    items.unshift({
      id: "now-playing",
      label: "Now Playing",
      icon: isPlaying ? "▶" : "⏸",
      subtitle: `${currentSong.title} — ${currentSong.artist}`,
      screen: "now-playing",
      hasArrow: true,
    });
  }

  return <MenuList items={items} />;
}
