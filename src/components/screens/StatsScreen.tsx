"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";

interface Stats {
  totalSongs: number;
  totalPlaylists: number;
  totalFavorites: number;
  totalDownloads: number;
  recentlyPlayed: number;
  totalListeningTime: number; // minutes
}

/**
 * Statistics screen — shows listening stats and library info.
 */
export function StatsScreen() {
  const { darkMode } = useSettingsStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";
  const highlightColor = darkMode ? "#7AA05A" : "#4A7A2A";

  useEffect(() => {
    // For now, fetch from API or show placeholder stats
    setStats({
      totalSongs: 0,
      totalPlaylists: 0,
      totalFavorites: 0,
      totalDownloads: 0,
      recentlyPlayed: 0,
      totalListeningTime: 0,
    });
    setLoading(false);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: mutedColor }}>
          Loading stats...
        </div>
      </div>
    );
  }

  const statItems = [
    { label: "Songs", value: stats.totalSongs, icon: "♬" },
    { label: "Playlists", value: stats.totalPlaylists, icon: "☰" },
    { label: "Favorites", value: stats.totalFavorites, icon: "♥" },
    { label: "Downloads", value: stats.totalDownloads, icon: "↓" },
    { label: "History", value: stats.recentlyPlayed, icon: "⟲" },
    {
      label: "Listening",
      value: `${Math.floor(stats.totalListeningTime / 60)}h ${stats.totalListeningTime % 60}m`,
      icon: "⏱",
    },
  ];

  return (
    <div className="h-full px-3 py-2">
      <div className="space-y-1">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between py-1.5"
            style={{
              borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
              fontFamily: "Chicago, system-ui",
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: "13px", opacity: 0.6 }}>
                {item.icon}
              </span>
              <span style={{ fontSize: "12px", color: textColor }}>
                {item.label}
              </span>
            </div>
            <span
              style={{
                fontSize: "12px",
                color: highlightColor,
                fontWeight: 600,
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
