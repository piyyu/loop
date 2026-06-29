"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronLeft,
  Music,
  Search,
} from "lucide-react";
import Image from "next/image";

export function MobileHeader() {
  const { currentScreen, screenStack, pop, push } = useNavigationStore();
  const { currentSong, isPlaying } = usePlayerStore();
  const { darkMode } = useSettingsStore();

  const handleBack = () => {
    if (screenStack.length > 1) {
      pop();
    }
  };

  const showBackButton = screenStack.length > 1;

  return (
    <header
      className="w-full flex items-center justify-between px-4 py-3 border-b backdrop-blur-md transition-colors"
      style={{
        background: darkMode ? "rgba(15, 20, 16, 0.9)" : "rgba(184, 201, 163, 0.9)",
        borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        color: darkMode ? "#C8D8B8" : "#1a1a1a",
      }}
    >
      <div className="w-10">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center gap-0.5 text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
            style={{ fontFamily: "Chicago, system-ui" }}
          >
            <ChevronLeft size={16} />
            Menu
          </button>
        )}
      </div>

      <h1
        className="font-bold text-sm tracking-wider uppercase text-center flex-1 truncate"
        style={{ fontFamily: "Chicago, system-ui" }}
      >
        {currentScreen.title}
      </h1>

      <div className="w-10 flex justify-end gap-2">
        {currentScreen.id !== "search" && (
          <button
            onClick={() => push({ id: "search", title: "Search" })}
            className="cursor-pointer active:scale-90 transition-transform"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        )}
        {currentSong && currentScreen.id !== "now-playing" && (
          <button
            onClick={() => push({ id: "now-playing", title: "Now Playing" })}
            className="cursor-pointer active:scale-90 transition-transform flex items-center"
            aria-label="Now playing"
          >
            <Music size={16} className={isPlaying ? "animate-pulse" : ""} />
          </button>
        )}
      </div>
    </header>
  );
}

export function MobileBottomPlayer() {
  const { currentSong, isPlaying, togglePlay, next, previous } = usePlayerStore();
  const { push, currentScreen } = useNavigationStore();
  const { darkMode } = useSettingsStore();

  if (!currentSong || currentScreen.id === "now-playing") {
    return null;
  }

  return (
    <div
      onClick={() => push({ id: "now-playing", title: "Now Playing" })}
      className="w-full flex items-center justify-between px-4 py-2 border-t backdrop-blur-md cursor-pointer transition-all duration-150 active:bg-black/5 dark:active:bg-white/5"
      style={{
        background: darkMode ? "rgba(15, 20, 16, 0.95)" : "rgba(184, 201, 163, 0.95)",
        borderColor: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        color: darkMode ? "#C8D8B8" : "#1a1a1a",
      }}
    >
      {/* Song details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {currentSong.albumArt ? (
          <Image
            src={currentSong.albumArt}
            alt={currentSong.title}
            width={36}
            height={36}
            className="w-9 h-9 rounded object-cover shadow"
            unoptimized
          />
        ) : (
          <div
            className="w-9 h-9 rounded flex items-center justify-center text-sm shadow"
            style={{
              background: darkMode ? "#2A2A2A" : "#D8E8C8",
              color: darkMode ? "#C8D8B8" : "#5A6A4A",
            }}
          >
            ♫
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="text-[12px] font-bold truncate leading-tight"
            style={{ fontFamily: "Chicago, system-ui" }}
          >
            {currentSong.title}
          </div>
          <div
            className="text-[10px] truncate leading-tight mt-0.5"
            style={{
              fontFamily: "Chicago, system-ui",
              color: darkMode ? "#8A9A7A" : "#5A6A4A",
            }}
          >
            {currentSong.artist}
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div
        className="flex items-center gap-3 ml-4"
        onClick={(e) => e.stopPropagation()} // Stop navigation trigger
      >
        <button
          onClick={previous}
          className="p-1 cursor-pointer active:scale-90 transition-transform"
          aria-label="Previous song"
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={togglePlay}
          className="p-1.5 rounded-full cursor-pointer active:scale-90 transition-transform"
          style={{
            background: darkMode ? "#C8D8B8" : "#1a1a1a",
            color: darkMode ? "#0F1410" : "#B8C9A3",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={14} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={next}
          className="p-1 cursor-pointer active:scale-90 transition-transform"
          aria-label="Next song"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  );
}
