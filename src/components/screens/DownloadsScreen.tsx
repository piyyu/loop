"use client";

import { useEffect, useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Song } from "@/types/music";
import { formatTime } from "@/utils/format";

/**
 * Downloads screen — shows locally downloaded songs available offline.
 */
export function DownloadsScreen() {
  const { push } = useNavigationStore();
  const { setQueue } = usePlayerStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDownloads() {
      try {
        const res = await fetch("/api/downloads");
        if (res.ok) {
          const data = await res.json();
          setSongs(data.songs || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchDownloads();
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

  if (songs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center" style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: "#5A6A4A" }}>
          No downloads yet. Download songs for offline playback.
        </div>
      </div>
    );
  }

  const items: MenuItem[] = songs.map((song, index) => ({
    id: song.id,
    label: song.title,
    icon: "↓",
    subtitle: `${song.artist} · ${formatTime(song.duration)}`,
    action: () => {
      setQueue(songs, index);
      push({ id: "now-playing", title: "Now Playing" });
    },
  }));

  return <MenuList items={items} />;
}
