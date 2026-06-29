"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/stores/player-store";
import { useNavigationStore } from "@/stores/navigation-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { Song } from "@/types/music";
import Image from "next/image";

/**
 * Cover Flow screen — 3D perspective album art carousel.
 * Classic iPod Cover Flow experience with reflections.
 */
export function CoverFlowScreen() {
  const { queue, currentSong, setQueue } = usePlayerStore();
  const { push } = useNavigationStore();
  const { darkMode } = useSettingsStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const songs = queue.length > 0 ? queue : [];
  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";

  // Sync with wheel scrolling
  const { selectedIndex } = useNavigationStore();

  useEffect(() => {
    if (songs.length > 0) {
      setActiveIndex(Math.max(0, Math.min(selectedIndex, songs.length - 1)));
    }
  }, [selectedIndex, songs.length]);

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: mutedColor }}>
          No songs in queue for Cover Flow
        </div>
      </div>
    );
  }

  const activeSong = songs[activeIndex];

  return (
    <div className="h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Cover Flow carousel */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: "280px",
          height: "120px",
          perspective: "500px",
        }}
      >
        {songs.slice(Math.max(0, activeIndex - 2), activeIndex + 3).map((song, idx) => {
          const realIndex = Math.max(0, activeIndex - 2) + idx;
          const offset = realIndex - activeIndex;
          const isActive = offset === 0;

          return (
            <motion.div
              key={song.id}
              className="absolute rounded overflow-hidden cursor-pointer"
              style={{
                width: "80px",
                height: "80px",
                boxShadow: isActive
                  ? "0 8px 25px rgba(0,0,0,0.4)"
                  : "0 4px 12px rgba(0,0,0,0.2)",
              }}
              animate={{
                x: offset * 70,
                z: isActive ? 50 : -30,
                rotateY: offset * -35,
                scale: isActive ? 1.15 : 0.85,
                opacity: Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.2,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={() => {
                if (isActive) {
                  setQueue(songs, realIndex);
                  push({ id: "now-playing", title: "Now Playing" });
                } else {
                  useNavigationStore.getState().setSelectedIndex(realIndex);
                }
              }}
            >
              {song.albumArt ? (
                <Image
                  src={song.albumArt}
                  alt={song.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-2xl"
                  style={{
                    background: darkMode ? "#1A2A1A" : "#8A9A7A",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  ♫
                </div>
              )}

              {/* Reflection */}
              {isActive && (
                <div
                  className="absolute top-full left-0 right-0"
                  style={{
                    height: "40px",
                    background: `linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)`,
                    transform: "scaleY(-1)",
                    opacity: 0.3,
                    filter: "blur(1px)",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Active song info */}
      {activeSong && (
        <div className="text-center mt-4 px-4">
          <div
            className="font-bold truncate"
            style={{
              color: textColor,
              fontSize: "12px",
              fontFamily: "Chicago, system-ui",
            }}
          >
            {activeSong.title}
          </div>
          <div
            className="truncate mt-0.5"
            style={{
              color: mutedColor,
              fontSize: "10px",
              fontFamily: "Chicago, system-ui",
            }}
          >
            {activeSong.artist}
          </div>
        </div>
      )}
    </div>
  );
}
