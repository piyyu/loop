"use client";

import { useEffect, useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Song } from "@/types/music";
import { formatTime } from "@/utils/format";

/**
 * Songs screen — shows all synced songs.
 */
export function SongsScreen() {
  const { push } = useNavigationStore();
  const { setQueue } = usePlayerStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSongs() {
      try {
        const res = await fetch("/api/music/search?type=all");
        if (res.ok) {
          const data = await res.json();
          setSongs(data.songs || []);
        }
      } catch (err) {
        console.error("Failed to fetch songs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSongs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: "#5A6A4A" }}>
          <div className="animate-spin text-2xl mb-2 text-center">⟳</div>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const items: MenuItem[] = songs.map((song, index) => ({
    id: song.id,
    label: song.title,
    subtitle: `${song.artist} · ${formatTime(song.duration)}`,
    action: () => {
      setQueue(songs, index);
      push({ id: "now-playing", title: "Now Playing" });
    },
  }));

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center" style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: "#5A6A4A" }}>
          No songs synced yet. Connect Spotify to import your library.
        </div>
      </div>
    );
  }

  return <MenuList items={items} />;
}
