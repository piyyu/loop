"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { formatSeconds } from "@/utils/format";
import { getAudioFile, saveAudioFile, deleteAudioFile } from "@/utils/storage";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  Download,
  Loader2,
} from "lucide-react";
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
    next,
    previous,
  } = usePlayerStore();
  const { darkMode } = useSettingsStore();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";
  const progressBg = darkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
  const progressFill = darkMode ? "#7AA05A" : "#4A7A2A";

  // Check favorited & downloaded states when currentSong changes
  useEffect(() => {
    if (!currentSong) return;

    // Check IndexedDB
    getAudioFile(currentSong.id).then((file) => {
      setIsDownloaded(!!file);
    });

    // Check Database Favorites
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        const favs = data.songs || [];
        setIsFavorite(favs.some((s: any) => s.id === currentSong.id));
      })
      .catch(() => {});
  }, [currentSong]);

  const toggleFavoriteState = async () => {
    if (!currentSong) return;

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: currentSong.id,
          song: currentSong,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.favorited);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const toggleDownloadState = async () => {
    if (!currentSong) return;

    if (isDownloaded) {
      try {
        await deleteAudioFile(currentSong.id);
        await fetch(`/api/downloads?songId=${currentSong.id}`, {
          method: "DELETE",
        });
        setIsDownloaded(false);
      } catch (err) {
        console.error("Failed to delete download:", err);
      }
    } else {
      setIsDownloading(true);
      try {
        let downloadUrl = currentSong.streamUrl;
        if (!downloadUrl) {
          const resStream = await fetch(
            `/api/music/stream?id=${encodeURIComponent(currentSong.id)}&provider=jiosaavn`
          );
          if (resStream.ok) {
            const dataStream = await resStream.json();
            downloadUrl = dataStream.streamUrl;
          }
        }

        if (!downloadUrl) throw new Error("No stream URL found");

        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error("Network error downloading file");

        const buffer = await response.arrayBuffer();
        await saveAudioFile(currentSong.id, buffer, "audio/mp4");

        await fetch("/api/downloads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            songId: currentSong.id,
            fileKey: `audio-${currentSong.id}`,
            fileSize: buffer.byteLength,
            song: {
              ...currentSong,
              streamUrl: downloadUrl,
            },
          }),
        });

        setIsDownloaded(true);
      } catch (err) {
        console.error("Failed to download song:", err);
      } finally {
        setIsDownloading(false);
      }
    }
  };

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
    <div className="h-full flex flex-col px-4 py-3 justify-between select-none">
      {/* Song details + album art section */}
      <div className="flex gap-4 items-center flex-1 min-h-0">
        {/* Album art with subtle rotate on play */}
        <div
          className="relative flex-shrink-0 rounded-lg overflow-hidden shadow-md"
          style={{
            width: "105px",
            height: "105px",
            background: darkMode ? "#1A2A1A" : "#8A9A7A",
          }}
        >
          {currentSong.albumArt ? (
            <Image
              src={currentSong.albumArt}
              alt={`${currentSong.album || currentSong.title} album art`}
              width={105}
              height={105}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
              ♫
            </div>
          )}
        </div>

        {/* Text information */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2
            className="font-bold truncate leading-tight hover:underline cursor-pointer"
            onClick={togglePlay}
            style={{
              color: textColor,
              fontSize: "15px",
              fontFamily: "Chicago, system-ui",
            }}
          >
            {currentSong.title}
          </h2>
          <div
            className="truncate mt-1 text-xs"
            style={{
              color: mutedColor,
              fontFamily: "Chicago, system-ui",
            }}
          >
            {currentSong.artist}
          </div>
          <div
            className="truncate mt-0.5 text-[10px]"
            style={{
              color: mutedColor,
              fontFamily: "Chicago, system-ui",
              opacity: 0.8,
            }}
          >
            {currentSong.album}
          </div>

          {/* Favorites & Downloads buttons */}
          <div className="flex gap-3 mt-2 flex-wrap">
            <button
              onClick={toggleFavoriteState}
              className="flex items-center gap-1 text-[10px] cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
              style={{
                color: isFavorite ? "#D94A4A" : mutedColor,
                fontFamily: "Chicago, system-ui",
              }}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={11} fill={isFavorite ? "currentColor" : "none"} />
              <span>{isFavorite ? "Liked" : "Like"}</span>
            </button>
            <button
              onClick={toggleDownloadState}
              disabled={isDownloading}
              className="flex items-center gap-1 text-[10px] cursor-pointer hover:opacity-80 transition-opacity active:scale-95 disabled:opacity-50"
              style={{
                color: isDownloaded ? progressFill : mutedColor,
                fontFamily: "Chicago, system-ui",
              }}
              title={isDownloaded ? "Delete offline file" : "Download song"}
            >
              {isDownloading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Download size={11} />
              )}
              <span>
                {isDownloading
                  ? "Downloading..."
                  : isDownloaded
                  ? "Offline"
                  : "Download"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="text-center py-1 text-[10px] font-bold"
          style={{
            color: "#D94A4A",
            fontFamily: "Chicago, system-ui",
          }}
        >
          {error}
        </div>
      )}

      {/* Progress controls */}
      <div className="w-full mt-2">
        <div
          className="w-full rounded-full overflow-hidden cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-800"
          onClick={handleProgressBarClick}
          style={{ background: progressBg }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              background: progressFill,
              width: `${progressPercent}%`,
            }}
          />
        </div>

        {/* Time values */}
        <div className="flex justify-between mt-1 text-[10px]" style={{ color: mutedColor }}>
          <span style={{ fontFamily: "Chicago, system-ui" }}>
            {formatSeconds(progress)}
          </span>
          <span style={{ fontFamily: "Chicago, system-ui" }}>
            -{formatSeconds(Math.max(0, duration - progress))}
          </span>
        </div>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-2 mt-2 px-1">
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          className="cursor-pointer text-[10px]"
          style={{ color: mutedColor }}
        >
          {volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
        <div
          className="flex-1 rounded-full overflow-hidden cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800"
          onClick={handleVolumeBarClick}
          style={{ background: progressBg }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: progressFill,
              width: `${volume * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Dedicated hardware buttons row */}
      <div className="flex items-center justify-between mt-4 px-2">
        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-90"
          style={{ color: shuffle ? progressFill : mutedColor }}
          aria-label="Shuffle"
        >
          <Shuffle size={16} />
        </button>

        {/* Previous */}
        <button
          onClick={previous}
          className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-90"
          style={{ color: textColor }}
          aria-label="Previous"
        >
          <SkipBack size={18} fill="currentColor" />
        </button>

        {/* Play / Pause - Large */}
        <button
          onClick={togglePlay}
          className="p-3 rounded-full cursor-pointer transition-all active:scale-95 shadow"
          style={{
            background: darkMode ? "#C8D8B8" : "#1a1a1a",
            color: darkMode ? "#0F1410" : "#B8C9A3",
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={next}
          className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-90"
          style={{ color: textColor }}
          aria-label="Next"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>

        {/* Repeat */}
        <button
          onClick={cycleRepeat}
          className="p-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:scale-90"
          style={{ color: repeat !== "off" ? progressFill : mutedColor }}
          aria-label="Repeat"
        >
          <Repeat size={16} />
        </button>
      </div>
    </div>
  );
}
