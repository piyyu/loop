"use client";

import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useOffline } from "@/hooks/useOffline";
import { formatSeconds } from "@/utils/format";

/**
 * iPod status bar — shows at the top of the LCD screen.
 * Displays: screen title, play indicator, battery, time.
 */
export function StatusBar() {
  const { currentScreen } = useNavigationStore();
  const { isPlaying, currentSong } = usePlayerStore();
  const { darkMode } = useSettingsStore();
  const { isOffline } = useOffline();

  const textColor = darkMode ? "#C8D8B8" : "#2A3A1A";
  const bgColor = darkMode ? "rgba(20,30,15,0.9)" : "rgba(160,180,140,0.9)";

  return (
    <div
      className="flex items-center justify-between px-3 py-1 relative z-10"
      style={{
        background: bgColor,
        borderBottom: darkMode
          ? "1px solid rgba(100,120,80,0.2)"
          : "1px solid rgba(100,130,80,0.3)",
        fontSize: "11px",
        fontWeight: 600,
        color: textColor,
        fontFamily: "'Chicago', 'SF Pro Text', system-ui, sans-serif",
      }}
    >
      {/* Left: Title */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="truncate">{currentScreen.title}</span>
      </div>

      {/* Center: Play indicator */}
      <div className="flex items-center gap-1">
        {isPlaying && (
          <span className="text-[10px] animate-pulse" aria-label="Playing">
            ▶
          </span>
        )}
        {isOffline && (
          <span className="text-[10px]" aria-label="Offline">
            ✈
          </span>
        )}
      </div>

      {/* Right: Battery */}
      <div className="flex items-center gap-1">
        <BatteryIcon color={textColor} />
      </div>
    </div>
  );
}

function BatteryIcon({ color }: { color: string }) {
  return (
    <svg
      width="20"
      height="10"
      viewBox="0 0 20 10"
      fill="none"
      aria-label="Battery"
    >
      <rect
        x="0.5"
        y="0.5"
        width="16"
        height="9"
        rx="1.5"
        stroke={color}
        strokeWidth="1"
      />
      <rect x="17" y="3" width="2" height="4" rx="0.5" fill={color} />
      <rect
        x="2"
        y="2"
        width="12"
        height="6"
        rx="0.5"
        fill={color}
        opacity="0.7"
      />
    </svg>
  );
}
