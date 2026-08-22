"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { usePlayerStore } from "@/stores/player-store";
import { THEMES } from "@/types/settings";
import { formatTime } from "@/utils/format";
import { Screen } from "./Screen";
import { ClickWheel } from "./ClickWheel";

/**
 * Landscape console shell for large screens — the same iPod design
 * language rotated sideways:
 * - Left: wide LCD screen (same Screen viewport as portrait mode).
 * - Right: casing panel with a now-playing mini display and click wheel.
 * Shares all state/stores with the mobile shell, so behavior is identical.
 */
export function DesktopShell() {
  const { theme, darkMode } = useSettingsStore();
  const { currentSong, isPlaying } = usePlayerStore();
  const colors = THEMES[theme];

  return (
    <div className="flex items-center justify-center min-h-screen p-6 select-none bg-neutral-950 w-full">
      {/* Console device */}
      <div
        className="relative flex w-full max-w-[1080px] h-[min(720px,90vh)] overflow-hidden transition-all"
        style={{
          borderRadius: "44px",
          border: "12px solid #171717",
          background: darkMode
            ? "linear-gradient(120deg, #1f1f1f 0%, #0c0c0c 100%)"
            : `linear-gradient(120deg, ${colors.body} 0%, ${adjustBrightness(colors.body, -10)} 100%)`,
          boxShadow: darkMode
            ? "0 30px 60px -15px rgba(0, 0, 0, 0.8)"
            : "0 30px 60px -15px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Left: Bezel + wide LCD Screen */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative min-w-0"
          style={{
            background: darkMode ? "#0c0d0c" : adjustBrightness(colors.body, -25),
            padding: "16px",
          }}
        >
          {/* LCD Screen container */}
          <div
            className="flex-1 w-full rounded-xl overflow-hidden relative flex flex-col"
            style={{
              boxShadow: "inset 0 3px 14px rgba(0,0,0,0.8)",
            }}
          >
            <Screen />
          </div>
        </div>

        {/* Seam between bezel and casing */}
        <div
          className="w-[2px] self-stretch"
          style={{
            background: darkMode
              ? "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)"
              : "linear-gradient(180deg, transparent, rgba(0,0,0,0.12), transparent)",
          }}
        />

        {/* Right: Casing faceplate — fixed width like a real iPod face */}
        <div
          className="relative flex flex-col items-center justify-center gap-9 shrink-0 px-6"
          style={{
            width: "340px",
            background: darkMode
              ? "linear-gradient(180deg, #242424 0%, #141414 100%)"
              : `linear-gradient(180deg, ${colors.body} 0%, ${adjustBrightness(colors.body, -15)} 100%)`,
            boxShadow: "inset 2px 0 8px rgba(0,0,0,0.12)",
          }}
        >
          {/* Branding pinned to the top of the faceplate */}
          <div
            className="absolute top-5 text-center select-none"
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

          {/* Now-playing mini LCD sits right above the wheel as one cluster */}
          <MiniDisplay
            title={currentSong?.title}
            artist={currentSong?.artist}
            duration={currentSong?.duration}
            isPlaying={isPlaying}
            darkMode={darkMode}
            screenColor={darkMode ? "#0F1410" : colors.screen}
          />

          {/* Skeuomorphic click wheel */}
          <ClickWheel />
        </div>
      </div>
    </div>
  );
}

function MiniDisplay({
  title,
  artist,
  duration,
  isPlaying,
  darkMode,
  screenColor,
}: {
  title?: string;
  artist?: string;
  duration?: number;
  isPlaying: boolean;
  darkMode: boolean;
  screenColor: string;
}) {
  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";

  return (
    <div
      className="w-full max-w-[264px] rounded-lg overflow-hidden"
      style={{
        background: screenColor,
        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(255,255,255,0.06)",
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-3 py-1"
        style={{
          background: darkMode ? "rgba(20,30,15,0.95)" : "rgba(0,0,0,0.06)",
          borderBottom: darkMode
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.08)",
          fontFamily: "'Chicago', 'SF Pro Text', system-ui, sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          color: textColor,
        }}
      >
        <span>Now Playing</span>
        {isPlaying && (
          <span className="animate-pulse" aria-label="Playing">
            ▶
          </span>
        )}
      </div>

      {/* Track info */}
      <div
        className="px-3 py-2.5"
        style={{ fontFamily: "'Chicago', 'SF Pro Text', system-ui, sans-serif" }}
      >
        {title ? (
          <>
            <div
              className="truncate font-semibold text-[13px]"
              style={{ color: textColor }}
              title={title}
            >
              {title}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span
                className="truncate text-[10px]"
                style={{ color: mutedColor }}
                title={artist}
              >
                {artist}
              </span>
              {duration != null && duration > 0 && (
                <span
                  className="text-[10px] flex-shrink-0"
                  style={{ color: mutedColor }}
                >
                  {formatTime(duration)}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-1.5 text-[11px]" style={{ color: mutedColor }}>
            Select a song to play
          </div>
        )}
      </div>
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
