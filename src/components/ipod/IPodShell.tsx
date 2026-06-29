"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { Screen } from "./Screen";
import { MobileHeader, MobileBottomPlayer } from "./MobileControls";

/**
 * The main application shell — renders the responsive mobile interface.
 * Stretches full-bleed on mobile screens and presents as a centered phone on desktop.
 */
export function IPodShell() {
  const { darkMode } = useSettingsStore();

  return (
    <div className="flex items-center justify-center min-h-screen p-0 md:p-6 select-none bg-neutral-950 w-full">
      <div
        className="relative flex flex-col w-full h-screen md:h-[88vh] md:max-w-[390px] md:rounded-[40px] md:border-[10px] md:border-neutral-800 md:shadow-2xl overflow-hidden transition-all"
        style={{
          background: darkMode ? "#0F1410" : "#B8C9A3",
          boxShadow: darkMode
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Navigation header */}
        <MobileHeader />

        {/* Dynamic Screen viewport */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <Screen />
        </div>

        {/* Sticky bottom media player */}
        <MobileBottomPlayer />
      </div>
    </div>
  );
}
