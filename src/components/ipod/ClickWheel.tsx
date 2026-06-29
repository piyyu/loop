"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useClickWheel } from "@/hooks/useClickWheel";
import { useHaptic } from "@/hooks/useHaptic";
import { useSounds } from "@/hooks/useSounds";
import { THEMES } from "@/types/settings";

/**
 * Interactive iPod Click Wheel.
 * Supports touch/mouse rotation for scrolling and quadrant buttons.
 */
export function ClickWheel() {
  const { scrollUp, scrollDown, select, pop } = useNavigationStore();
  const { togglePlay, next, previous } = usePlayerStore();
  const { theme, darkMode } = useSettingsStore();
  const haptic = useHaptic();
  const sounds = useSounds();

  const colors = THEMES[theme];
  const wheelOuter = darkMode ? "#2A2A2A" : colors.wheelOuter;
  const wheelInner = darkMode ? "#1A1A1A" : colors.wheelInner;
  const textColor = darkMode ? "#888888" : colors.wheelText;

  const [activeButton, setActiveButton] = useState<string | null>(null);

  const handleScrollUp = useCallback(() => {
    scrollUp();
    sounds.click();
  }, [scrollUp, sounds]);

  const handleScrollDown = useCallback(() => {
    scrollDown();
    sounds.click();
  }, [scrollDown, sounds]);

  const { wheelProps } = useClickWheel({
    onScrollUp: handleScrollUp,
    onScrollDown: handleScrollDown,
    sensitivity: 15,
  });

  const handleButtonPress = useCallback(
    (button: string) => {
      setActiveButton(button);
      haptic.select();
      sounds.select();

      switch (button) {
        case "menu":
          pop();
          break;
        case "play":
          togglePlay();
          break;
        case "next":
          next();
          break;
        case "prev":
          previous();
          break;
        case "center":
          select();
          break;
      }

      setTimeout(() => setActiveButton(null), 150);
    },
    [pop, togglePlay, next, previous, select, haptic, sounds]
  );

  const getWheelHandlers = wheelProps();

  return (
    <div
      className="relative touch-none"
      style={{ width: "220px", height: "220px" }}
    >
      {/* Outer wheel ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 40% 35%, ${adjustBrightness(wheelOuter, 12)}, ${wheelOuter}, ${adjustBrightness(wheelOuter, -15)})`,
          boxShadow: `
            0 4px 15px rgba(0,0,0,0.2),
            inset 0 1px 2px rgba(255,255,255,0.15),
            inset 0 -1px 2px rgba(0,0,0,0.15)
          `,
        }}
        {...getWheelHandlers}
        role="slider"
        aria-label="Click wheel - rotate to scroll"
        aria-orientation="vertical"
        tabIndex={0}
      >
        {/* MENU label — top */}
        <button
          className="absolute top-4 left-1/2 -translate-x-1/2 font-bold tracking-wider text-[11px] uppercase z-10 px-4 py-2 rounded-full transition-opacity"
          style={{
            color: textColor,
            opacity: activeButton === "menu" ? 0.5 : 1,
            fontFamily: "'Chicago', 'SF Pro Text', system-ui",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleButtonPress("menu");
          }}
          aria-label="Menu - go back"
        >
          MENU
        </button>

        {/* Previous — left */}
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 text-lg z-10 px-3 py-2 transition-opacity"
          style={{
            color: textColor,
            opacity: activeButton === "prev" ? 0.5 : 1,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleButtonPress("prev");
          }}
          aria-label="Previous track"
        >
          ⏮
        </button>

        {/* Next — right */}
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg z-10 px-3 py-2 transition-opacity"
          style={{
            color: textColor,
            opacity: activeButton === "next" ? 0.5 : 1,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleButtonPress("next");
          }}
          aria-label="Next track"
        >
          ⏭
        </button>

        {/* Play/Pause — bottom */}
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-lg z-10 px-4 py-2 transition-opacity"
          style={{
            color: textColor,
            opacity: activeButton === "play" ? 0.5 : 1,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleButtonPress("play");
          }}
          aria-label="Play or pause"
        >
          ⏯
        </button>
      </div>

      {/* Center select button */}
      <motion.button
        className="absolute rounded-full z-20"
        style={{
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
          width: "75px",
          height: "75px",
          background: `radial-gradient(circle at 40% 35%, ${adjustBrightness(wheelInner, 10)}, ${wheelInner})`,
          boxShadow: `
            0 2px 8px rgba(0,0,0,0.2),
            inset 0 1px 3px rgba(255,255,255,0.2),
            inset 0 -1px 2px rgba(0,0,0,0.1)
          `,
        }}
        whileTap={{ scale: 0.95 }}
        onPointerDown={(e) => {
          e.stopPropagation();
          handleButtonPress("center");
        }}
        aria-label="Select"
      />
    </div>
  );
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
