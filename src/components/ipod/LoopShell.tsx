"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MobileShell } from "./MobileShell";
import { DesktopShell } from "./DesktopShell";

/**
 * The main Loop device shell — renders a split interface:
 * - Top 45%: Screen bezel containing the LCD Screen.
 * - Bottom 55%: Skeuomorphic casing containing the mechanical click wheel.
 * Optimized to fit full-screen on mobile devices and a sleek smartphone mockup on desktop.
 */
export function LoopShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return isDesktop ? <DesktopShell /> : <MobileShell />;
}
