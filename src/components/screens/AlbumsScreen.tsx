"use client";

import { useEffect, useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Album } from "@/types/music";

/**
 * Albums screen — groups synced songs by album.
 */
export function AlbumsScreen() {
  const { push } = useNavigationStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const res = await fetch("/api/music/search?type=albums");
        if (res.ok) {
          const data = await res.json();
          setAlbums(data.albums || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
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

  const items: MenuItem[] = albums.map((album) => ({
    id: album.name,
    label: album.name,
    subtitle: album.artist,
    hasArrow: true,
    screen: "playlist-detail" as const,
    data: { albumName: album.name },
  }));

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center" style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: "#5A6A4A" }}>
          No albums found
        </div>
      </div>
    );
  }

  return <MenuList items={items} />;
}
