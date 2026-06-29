"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { THEMES } from "@/types/settings";
import { Screen } from "./Screen";
import { ClickWheel } from "./ClickWheel";
import { StatusBar } from "./StatusBar";

/**
 * The main iPod device shell — renders the entire device frame
 * containing the screen and click wheel.
 */
export function IPodShell() {
  const { theme, darkMode } = useSettingsStore();
  const colors = THEMES[theme];

  const bodyColor = darkMode ? "#1A1A1A" : colors.body;
  const bezelColor = darkMode ? "#0D0D0D" : "#2A2A2A";

  return (
    <div className="flex items-center justify-center min-h-screen p-4 select-none">
      <div
        className="relative flex flex-col items-center w-full max-w-[320px]"
        style={{
          background: `linear-gradient(145deg, ${bodyColor}, ${adjustBrightness(bodyColor, -8)})`,
          borderRadius: "32px",
          padding: "20px 16px 24px",
          boxShadow: `
            0 20px 60px rgba(0,0,0,0.35),
            0 0 0 1px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.1)
          `,
        }}
      >
        {/* Screen bezel */}
        <div
          className="w-full overflow-hidden"
          style={{
            background: bezelColor,
            borderRadius: "8px",
            padding: "2px",
            boxShadow: `
              inset 0 2px 6px rgba(0,0,0,0.5),
              0 1px 0 rgba(255,255,255,0.08)
            `,
          }}
        >
          {/* LCD Screen */}
          <div
            className="relative overflow-hidden flex flex-col"
            style={{
              background: darkMode ? "#0F1410" : "#B8C9A3",
              borderRadius: "6px",
              height: "240px",
            }}
          >
            <StatusBar />
            <Screen />
          </div>
        </div>

        {/* Direct Action Buttons */}
        <div className="flex gap-3 w-full px-1 mt-4">
          <button
            onClick={() => {
              useNavigationStore.getState().push({ id: "search", title: "Search" });
            }}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            style={{
              background: darkMode ? "#2A2A1A" : "#FFFFFF",
              color: darkMode ? "#C8D8B8" : "#2A3A1A",
              border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #D0D0D8",
              fontFamily: "Chicago, system-ui",
            }}
          >
            🔍 Direct Search
          </button>
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/music/search?type=all");
                if (res.ok) {
                  const data = await res.json();
                  const songs = data.songs || [];
                  if (songs.length > 0) {
                    const randomIndex = Math.floor(Math.random() * songs.length);
                    const { setQueue } = usePlayerStore.getState();
                    setQueue(songs, randomIndex);
                    useNavigationStore.getState().push({ id: "now-playing", title: "Now Playing" });
                  } else {
                    // Try to sync mock data first if no songs exist
                    const syncRes = await fetch("/api/spotify/sync", { method: "POST" });
                    if (syncRes.ok) {
                      const resRetry = await fetch("/api/music/search?type=all");
                      if (resRetry.ok) {
                        const dataRetry = await resRetry.json();
                        const songsRetry = dataRetry.songs || [];
                        if (songsRetry.length > 0) {
                          const randomIndex = Math.floor(Math.random() * songsRetry.length);
                          const { setQueue } = usePlayerStore.getState();
                          setQueue(songsRetry, randomIndex);
                          useNavigationStore.getState().push({ id: "now-playing", title: "Now Playing" });
                        }
                      }
                    }
                  }
                }
              } catch (err) {
                console.error("Direct play error:", err);
              }
            }}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1"
            style={{
              background: darkMode ? "#2A2A1A" : "#FFFFFF",
              color: darkMode ? "#C8D8B8" : "#2A3A1A",
              border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #D0D0D8",
              fontFamily: "Chicago, system-ui",
            }}
          >
            🔀 Direct Play
          </button>
        </div>

        {/* Spacer */}
        <div className="h-4" />

        {/* Click Wheel */}
        <ClickWheel />

        {/* iPod branding */}
        <div
          className="mt-3 text-center"
          style={{
            color: darkMode
              ? "rgba(255,255,255,0.15)"
              : "rgba(0,0,0,0.12)",
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          Loop
        </div>
      </div>
    </div>
  );
}

/**
 * Slightly adjust hex color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + percent));
  const g = Math.min(
    255,
    Math.max(0, ((num >> 8) & 0xff) + percent)
  );
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
