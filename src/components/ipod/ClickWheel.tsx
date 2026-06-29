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
      style={{ width: "230px", height: "230px" }}
    >
      {/* Outer wheel mechanical ring */}
      <div
        className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5"
        style={{
          background: darkMode
            ? "linear-gradient(145deg, #2b2b2b, #181818)"
            : "linear-gradient(145deg, #fdfdfd, #e2e2e2)",
          boxShadow: darkMode
            ? "0 15px 35px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -2px 3px rgba(0,0,0,0.4)"
            : "0 15px 35px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -3px 5px rgba(0,0,0,0.12)",
        }}
        {...getWheelHandlers}
        role="slider"
        aria-label="Click wheel - rotate to scroll"
        aria-orientation="vertical"
        tabIndex={0}
      >
        {/* MENU label — top */}
        <button
          className="absolute top-5 left-1/2 -translate-x-1/2 font-bold tracking-widest text-[11px] uppercase z-10 px-4 py-2 transition-opacity cursor-pointer active:scale-95"
          style={{
            color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            opacity: activeButton === "menu" ? 0.6 : 1,
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

        {/* Previous — left (Skeuomorphic print icon) */}
        <button
          className="absolute left-5 top-1/2 -translate-y-1/2 z-10 p-3 transition-opacity cursor-pointer active:scale-95"
          style={{
            color: darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            opacity: activeButton === "prev" ? 0.6 : 1,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleButtonPress("prev");
          }}
          aria-label="Previous track"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
            <path d="M1 1v12h2V1H1zm11 6L3 1v12l9-6zm5 0l-5-4v8l5-4z" />
          </svg>
        </button>

        {/* Next — right (Skeuomorphic print icon) */}
        <button
          className="absolute right-5 top-1/2 -translate-y-1/2 z-10 p-3 transition-opacity cursor-pointer active:scale-95"
          style={{
            color: darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            opacity: activeButton === "next" ? 0.6 : 1,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleButtonPress("next");
          }}
          aria-label="Next track"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
            <path d="M17 1v12h-2V1h2zM6 7l9-6v12L6 7zm-5 0l5-4v8l-5-4z" />
          </svg>
        </button>

        {/* Play/Pause — bottom (Skeuomorphic print icon) */}
        <button
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 p-3 transition-opacity cursor-pointer active:scale-95"
          style={{
            color: darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
            opacity: activeButton === "play" ? 0.6 : 1,
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleButtonPress("play");
          }}
          aria-label="Play or pause"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
            <path d="M2 1v12l8-6-8-6zm11 0h2v12h-2V1zm4 0h1v12h-1V1z" />
          </svg>
        </button>
      </div>

      {/* Center select button (Concave effect) */}
      <motion.button
        className="absolute rounded-full z-20 border border-black/5 dark:border-white/5"
        style={{
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
          width: "78px",
          height: "78px",
          background: darkMode
            ? "linear-gradient(145deg, #1c1c1c, #262626)"
            : "linear-gradient(145deg, #e6e6e6, #f8f8f8)",
          boxShadow: darkMode
            ? "0 4px 8px rgba(0,0,0,0.35), inset 0 2px 4px rgba(0,0,0,0.4), inset 0 -1px 2px rgba(255,255,255,0.08)"
            : "0 4px 8px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.06), inset 0 -2px 3px rgba(255,255,255,0.9)",
        }}
        whileTap={{ scale: 0.96 }}
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
