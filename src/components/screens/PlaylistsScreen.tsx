"use client";

import { useEffect, useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Playlist } from "@/types/music";

/**
 * Playlists screen — shows user's synced Spotify playlists.
 */
export function PlaylistsScreen() {
  const { push } = useNavigationStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function fetchPlaylists() {
    try {
      const res = await fetch("/api/spotify/playlists");
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/spotify/sync", { method: "POST" });
      if (res.ok) {
        await fetchPlaylists();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading || syncing) {
    return <LoadingIndicator message={syncing ? "Syncing..." : "Loading..."} />;
  }

  if (playlists.length === 0) {
    return <EmptyState message="No playlists synced yet" onSync={handleSync} />;
  }

  const items: MenuItem[] = playlists.map((pl) => ({
    id: pl.id,
    label: pl.name,
    subtitle: `${pl.songCount || 0} songs`,
    hasArrow: true,
    screen: "playlist-detail" as const,
    data: { playlistId: pl.id },
  }));

  return <MenuList items={items} />;
}

function LoadingIndicator({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center" style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: "#5A6A4A" }}>
        <div className="animate-spin text-2xl mb-2">⟳</div>
        {message}
      </div>
    </div>
  );
}

function EmptyState({ message, onSync }: { message: string; onSync: () => void }) {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="text-center" style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: "#5A6A4A" }}>
        <p className="mb-3">{message}</p>
        <button
          onClick={onSync}
          className="px-3 py-1.5 rounded text-[11px] font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          style={{
            border: "1px solid #5A6A4A",
            color: "#5A6A4A",
            fontFamily: "Chicago, system-ui",
          }}
        >
          Sync Spotify Playlists
        </button>
      </div>
    </div>
  );
}
