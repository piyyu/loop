"use client";

import { SCREEN_DEFINITIONS } from "@/stores/navigation-store";
import { MenuList } from "@/components/ipod/MenuList";

/**
 * Music sub-menu screen.
 */
export function MusicMenu() {
  const screen = SCREEN_DEFINITIONS.music!;
  return <MenuList items={screen.items || []} />;
}
