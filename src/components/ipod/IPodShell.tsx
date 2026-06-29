"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { Screen } from "./Screen";
import { ClickWheel } from "./ClickWheel";

/**
 * The main iPod device shell — renders a split interface:
 * - Top 45%: Screen bezel containing the LCD Screen.
 * - Bottom 55%: Skeuomorphic casing containing the mechanical click wheel.
 * Optimized to fit full-screen on mobile devices and a sleek smartphone mockup on desktop.
 */
export function IPodShell() {
  const { darkMode } = useSettingsStore();

  return (
    <div className="flex items-center justify-center min-h-screen p-0 md:p-6 select-none bg-neutral-950 w-full">
      {/* Container mock (fills mobile viewports, smartphone mock on desktop) */}
      <div
        className="relative flex flex-col w-full h-screen md:h-[88vh] md:max-w-[390px] md:rounded-[40px] md:border-[10px] md:border-neutral-800 md:shadow-2xl overflow-hidden transition-all"
        style={{
          background: darkMode
            ? "linear-gradient(180deg, #1f1f1f 0%, #0c0c0c 100%)"
            : "linear-gradient(180deg, #eaeaea 0%, #d5d5d5 100%)",
          boxShadow: darkMode
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.75)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Top half: Bezel + LCD Screen */}
        <div
          className="w-full flex-[4.5] flex flex-col overflow-hidden relative"
          style={{
            background: darkMode ? "#0c0d0c" : "#1a1e17",
            padding: "10px 10px 6px 10px", // Bezel width
          }}
        >
          {/* LCD Screen container */}
          <div
            className="flex-1 w-full rounded-lg overflow-hidden relative flex flex-col"
            style={{
              boxShadow: "inset 0 3px 10px rgba(0,0,0,0.8)",
            }}
          >
            {/* Screen Viewport */}
            <Screen />
          </div>
        </div>

        {/* Bottom half: Click Wheel Casing Faceplate */}
        <div
          className="w-full flex-[5.5] flex flex-col items-center justify-center relative px-6"
          style={{
            background: darkMode
              ? "linear-gradient(180deg, #242424 0%, #141414 100%)"
              : "linear-gradient(180deg, #f7f7f7 0%, #dfdfdf 100%)",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {/* Subtle separator line between screen bezel and casing */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: darkMode
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            }}
          />

          {/* Skeuomorphic click wheel */}
          <ClickWheel />

          {/* Device branding */}
          <div
            className="absolute bottom-4 text-center select-none"
            style={{
              color: darkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "4px",
              textTransform: "uppercase",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Loop
          </div>
        </div>
      </div>
    </div>
  );
}
