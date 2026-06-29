"use client";

import { useNavigationStore, SCREEN_DEFINITIONS } from "@/stores/navigation-store";
import { MenuList } from "@/components/ipod/MenuList";

/**
 * Home menu screen — the iPod's main menu.
 */
export function HomeMenu() {
  const screen = SCREEN_DEFINITIONS.home!;
  return <MenuList items={screen.items || []} />;
}
