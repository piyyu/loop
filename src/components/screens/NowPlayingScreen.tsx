"use client";

import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { formatSeconds } from "@/utils/format";
import Image from "next/image";

/**
 * Now Playing screen — shows album art, song info, progress, and controls.
 * This is the iPod's main playback display.
 */
export function NowPlayingScreen() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    shuffle,
    repeat,
    volume,
    isLoading,
    error,
    requestSeek,
    togglePlay,
    toggleShuffle,
    cycleRepeat,
    setVolume,
  } = usePlayerStore();
  const { darkMode } = useSettingsStore();

  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";
  const progressBg = darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const progressFill = darkMode ? "#7AA05A" : "#4A7A2A";

  if (!currentSong) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          style={{
            fontFamily: "Chicago, system-ui",
            fontSize: "12px",
            color: mutedColor,
          }}
        >
          No song playing
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newProgress = Math.max(0, Math.min(duration, (clickX / width) * duration));
    requestSeek(newProgress);
  };

  const handleVolumeBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.max(0, Math.min(1, clickX / width));
    setVolume(newVolume);
  };

  return (
    <div className="h-full flex flex-col px-3 py-2">
      {/* Song info + album art row */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Album art */}
        <motion.div
          className="flex-shrink-0 rounded overflow-hidden cursor-pointer"
          onClick={() => togglePlay()}
          style={{
            width: "90px",
            height: "90px",
            background: darkMode ? "#1A2A1A" : "#8A9A7A",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{
            duration: 20,
            repeat: isPlaying ? Infinity : 0,
            ease: "linear",
          }}
        >
          {currentSong.albumArt ? (
            <Image
              src={currentSong.albumArt}
              alt={`${currentSong.album || currentSong.title} album art`}
              width={90}
              height={90}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">
              ♫
            </div>
          )}
        </motion.div>

        {/* Song details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div
            className="font-bold truncate cursor-pointer hover:underline"
            onClick={() => togglePlay()}
            style={{
              color: textColor,
              fontSize: "13px",
              fontFamily: "Chicago, system-ui",
            }}
          >
            {currentSong.title}
          </div>
          <div
            className="truncate mt-0.5"
            style={{
              color: mutedColor,
              fontSize: "11px",
              fontFamily: "Chicago, system-ui",
            }}
          >
            {currentSong.artist}
          </div>
          <div
            className="truncate mt-0.5"
            style={{
              color: mutedColor,
              fontSize: "10px",
              fontFamily: "Chicago, system-ui",
              opacity: 0.7,
            }}
          >
            {currentSong.album}
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-2 mt-2">
            {isLoading && (
              <span
                className="animate-spin text-xs"
                style={{ color: mutedColor }}
              >
                ⟳
              </span>
            )}
            {isPlaying && !isLoading && (
              <span
                className="cursor-pointer text-[10px]"
                style={{ color: progressFill }}
                onClick={() => togglePlay()}
                aria-label="Pause"
              >
                ▶
              </span>
            )}
            {!isPlaying && !isLoading && (
              <span
                className="cursor-pointer text-[10px]"
                style={{ color: mutedColor }}
                onClick={() => togglePlay()}
                aria-label="Play"
              >
                ⏸
              </span>
            )}
            <span
              className="cursor-pointer text-[10px] hover:scale-110 transition-transform"
              style={{ color: shuffle ? progressFill : mutedColor }}
              onClick={() => toggleShuffle()}
              aria-label="Toggle shuffle"
            >
              ⤮
            </span>
            <span
              className="cursor-pointer text-[10px] hover:scale-110 transition-transform"
              style={{ color: repeat !== "off" ? progressFill : mutedColor }}
              onClick={() => cycleRepeat()}
              aria-label="Toggle repeat"
            >
              {repeat === "one" ? "🔂" : "🔁"}
            </span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="text-center mt-1"
          style={{
            fontSize: "10px",
            color: "#D94A4A",
            fontFamily: "Chicago, system-ui",
          }}
        >
          {error}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-2">
        <div
          className="w-full rounded-full overflow-hidden cursor-pointer hover:h-[6px] transition-all"
          style={{ height: "4px", background: progressBg }}
          onClick={handleProgressBarClick}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: progressFill,
              width: `${progressPercent}%`,
            }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </div>

        {/* Time indicators */}
        <div className="flex justify-between mt-1">
          <span
            style={{
              fontSize: "9px",
              color: mutedColor,
              fontFamily: "Chicago, system-ui",
            }}
          >
            {formatSeconds(progress)}
          </span>
          <span
            style={{
              fontSize: "9px",
              color: mutedColor,
              fontFamily: "Chicago, system-ui",
            }}
          >
            -{formatSeconds(Math.max(0, duration - progress))}
          </span>
        </div>
      </div>

      {/* Volume bar */}
      <div className="flex items-center gap-2 mt-1">
        <span style={{ fontSize: "8px", color: mutedColor }}>🔈</span>
        <div
          className="flex-1 rounded-full overflow-hidden cursor-pointer hover:h-[5px] transition-all"
          style={{ height: "3px", background: progressBg }}
          onClick={handleVolumeBarClick}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: progressFill,
              width: `${volume * 100}%`,
            }}
          />
        </div>
        <span style={{ fontSize: "8px", color: mutedColor }}>🔊</span>
      </div>
    </div>
  );
}
