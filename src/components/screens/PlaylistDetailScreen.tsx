"use client";

import { useEffect, useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Song } from "@/types/music";
import { formatTime } from "@/utils/format";

/**
 * Playlist detail screen — shows songs in a specific playlist.
 */
export function PlaylistDetailScreen() {
  const { currentScreen, push } = useNavigationStore();
  const { setQueue } = usePlayerStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const playlistId = (currentScreen.data as { playlistId?: string })?.playlistId;

  useEffect(() => {
    if (!playlistId) return;

    async function fetchSongs() {
      try {
        const res = await fetch(`/api/spotify/playlists?id=${playlistId}`);
        if (res.ok) {
          const data = await res.json();
          setSongs(data.songs || []);
        }
      } catch (err) {
        console.error("Failed to fetch playlist songs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSongs();
  }, [playlistId]);

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

  const items: MenuItem[] = [
    {
      id: "play-all",
      label: "Play All",
      icon: "▶",
      action: () => {
        if (songs.length > 0) {
          setQueue(songs, 0);
          push({ id: "now-playing", title: "Now Playing" });
        }
      },
    },
    {
      id: "shuffle-all",
      label: "Shuffle All",
      icon: "⤮",
      action: () => {
        if (songs.length > 0) {
          const shuffled = [...songs].sort(() => Math.random() - 0.5);
          setQueue(shuffled, 0);
          push({ id: "now-playing", title: "Now Playing" });
        }
      },
    },
    ...songs.map((song, index) => ({
      id: song.id,
      label: song.title,
      subtitle: `${song.artist} · ${formatTime(song.duration)}`,
      action: () => {
        setQueue(songs, index);
        push({ id: "now-playing", title: "Now Playing" });
      },
    })),
  ];

  return <MenuList items={items} />;
}
