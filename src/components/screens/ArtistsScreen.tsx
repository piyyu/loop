"use client";

import { useEffect, useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Artist } from "@/types/music";

/**
 * Artists screen — groups synced songs by artist.
 */
export function ArtistsScreen() {
  const { push } = useNavigationStore();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtists() {
      try {
        const res = await fetch("/api/music/search?type=artists");
        if (res.ok) {
          const data = await res.json();
          setArtists(data.artists || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchArtists();
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

  const items: MenuItem[] = artists.map((artist) => ({
    id: artist.name,
    label: artist.name,
    subtitle: `${artist.songCount} songs`,
    hasArrow: true,
    screen: "artist-detail" as const,
    data: { artistName: artist.name },
  }));

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center" style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: "#5A6A4A" }}>
          No artists found
        </div>
      </div>
    );
  }

  return <MenuList items={items} />;
}
