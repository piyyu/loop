"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSettingsStore } from "@/stores/settings-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { ThemeId } from "@/types/settings";
import type { AudioQuality } from "@/types/music";

/**
 * Settings screen — iPod-style settings with toggles and options.
 */
export function SettingsScreen() {
  const settings = useSettingsStore();
  const { data: session } = useSession();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const isRealSpotify = session?.accessToken && session.accessToken !== "mock-dev-token" && session.accessToken !== "mock-spotify-access-token";
  const accountLabel = isRealSpotify
    ? `Connected as ${session?.user?.name || "Spotify User"}`
    : session?.user?.name || "Demo Mode";

  const items: MenuItem[] = [
    {
      id: "account",
      label: "Spotify Account",
      subtitle: accountLabel,
      action: () => {
        if (!isRealSpotify) {
          // Redirect to login to connect real Spotify
          window.location.href = "/login";
        }
      },
    },
    {
      id: "sync",
      label: "Sync Playlists",
      subtitle: syncStatus || "From Spotify",
      action: async () => {
        setSyncStatus("Syncing…");
        try {
          const res = await fetch("/api/spotify/sync", { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            setSyncStatus(`✓ ${data.playlists} playlists, ${data.songs} songs`);
          } else {
            setSyncStatus("✗ Sync failed");
          }
        } catch {
          setSyncStatus("✗ Sync failed");
        }
        // Clear status after 5 seconds
        setTimeout(() => setSyncStatus(null), 5000);
      },
    },
    {
      id: "dark-mode",
      label: "Dark Mode",
      subtitle: settings.darkMode ? "On" : "Off",
      action: () => settings.toggleDarkMode(),
    },
    {
      id: "theme",
      label: "Theme",
      subtitle: settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1),
      action: () => {
        const themes: ThemeId[] = ["classic", "black", "pink", "blue", "green"];
        const currentIdx = themes.indexOf(settings.theme);
        const nextTheme = themes[(currentIdx + 1) % themes.length];
        settings.setTheme(nextTheme);
      },
    },
    {
      id: "playback-quality",
      label: "Playback Quality",
      subtitle: settings.playbackQuality.charAt(0).toUpperCase() + settings.playbackQuality.slice(1),
      action: () => {
        const qualities: AudioQuality[] = ["low", "medium", "high", "lossless"];
        const currentIdx = qualities.indexOf(settings.playbackQuality);
        const nextQuality = qualities[(currentIdx + 1) % qualities.length];
        settings.setPlaybackQuality(nextQuality);
      },
    },
    {
      id: "click-sounds",
      label: "Click Sounds",
      subtitle: settings.clickSounds ? "On" : "Off",
      action: () => settings.setClickSounds(!settings.clickSounds),
    },
    {
      id: "haptic-feedback",
      label: "Haptic Feedback",
      subtitle: settings.hapticFeedback ? "On" : "Off",
      action: () => settings.setHapticFeedback(!settings.hapticFeedback),
    },
    {
      id: "sleep-timer",
      label: "Sleep Timer",
      subtitle: settings.sleepTimer
        ? `${settings.sleepTimer} min`
        : "Off",
      action: () => {
        const options = [null, 15, 30, 45, 60, 90, 120];
        const currentIdx = options.indexOf(settings.sleepTimer);
        const nextTimer = options[(currentIdx + 1) % options.length];
        settings.setSleepTimer(nextTimer);
      },
    },
    {
      id: "equalizer",
      label: "Equalizer",
      hasArrow: true,
      screen: "equalizer" as const,
    },
    {
      id: "stats",
      label: "Statistics",
      hasArrow: true,
      screen: "stats" as const,
    },
    {
      id: "logout",
      label: "Logout",
      action: () => {
        signOut({ callbackUrl: "/login" });
      },
    },
  ];

  return <MenuList items={items} />;
}
