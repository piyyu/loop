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
import { THEMES } from "@/types/settings";

/**
 * iPod status bar — shows at the top of the LCD screen.
 * Displays: screen title, play indicator, battery, time.
 */
export function StatusBar() {
  const { currentScreen } = useNavigationStore();
  const { isPlaying, currentSong } = usePlayerStore();
  const { theme, darkMode } = useSettingsStore();
  const { isOffline } = useOffline();

  const colors = THEMES[theme];
  const textColor = darkMode ? "#C8D8B8" : colors.screenText;
  const bgColor = darkMode ? "rgba(20,30,15,0.95)" : "rgba(0,0,0,0.06)";

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 relative z-10"
      style={{
        background: bgColor,
        borderBottom: darkMode
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(0,0,0,0.08)",
        fontSize: "11px",
        fontWeight: 700,
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
