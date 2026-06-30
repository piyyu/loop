"use client";

import { useState, useCallback, useEffect } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Song } from "@/types/music";
import { formatTime, debounce } from "@/utils/format";

/**
 * Search screen — allows text input and searches across providers.
 * Uses the click wheel for character selection (iPod-style) or keyboard input.
 */
export function SearchScreen() {
  const { push } = useNavigationStore();
  const { setQueue } = usePlayerStore();
  const { darkMode } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";

  const searchSongs = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const [dbRes, providerRes] = await Promise.all([
          fetch(`/api/music/search?q=${encodeURIComponent(q)}`),
          fetch(`https://nepotuneapi.vercel.app/api/search/songs?query=${encodeURIComponent(q)}&limit=10`)
        ]);

        let dbSongs: Song[] = [];
        let providerSongs: Song[] = [];

        if (dbRes.ok) {
          const data = await dbRes.json();
          dbSongs = data.songs || [];
        }

        if (providerRes.ok) {
          const data = await providerRes.json();
          if (data.success && data.data?.results) {
            providerSongs = data.data.results.map((song: any) => {
              const artists =
                song.artists?.primary?.map((a: any) => a.name).join(", ") ||
                song.artists?.all?.map((a: any) => a.name).join(", ") ||
                "Unknown Artist";

              const streamUrl =
                song.downloadUrl?.find((u: any) => u.quality === "320kbps")?.url ||
                song.downloadUrl?.[song.downloadUrl.length - 1]?.url ||
                "";

              let albumArt = song.image?.find((i: any) => i.quality === "500x500")?.url ||
                song.image?.[song.image.length - 1]?.url ||
                null;

              if (albumArt && albumArt.includes("150x150")) {
                albumArt = albumArt.replace("150x150", "500x500");
              }

              return {
                id: song.id,
                spotifyId: "",
                title: song.name || song.title,
                artist: artists,
                album: song.album?.name || "Unknown Album",
                albumArt,
                duration: (song.duration || 0) * 1000,
                trackNumber: null,
                streamUrl,
                quality: "high",
                provider: "jiosaavn",
              } as Song;
            });
          }
        }

        // Merge, preferring DB songs
        const merged = [...dbSongs];
        for (const ps of providerSongs) {
          if (!merged.some(ds => ds.title.toLowerCase() === ps.title.toLowerCase() && ds.artist.toLowerCase() === ps.artist.toLowerCase())) {
            merged.push(ps);
          }
        }

        setResults(merged);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    searchSongs(query);
  }, [query, searchSongs]);

  const items: MenuItem[] = results.map((song, index) => ({
    id: song.id,
    label: song.title,
    subtitle: `${song.artist} · ${formatTime(song.duration)}`,
    action: () => {
      setQueue(results, index);
      push({ id: "now-playing", title: "Now Playing" });
    },
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Search input */}
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs..."
          className="w-full bg-transparent outline-none"
          style={{
            fontFamily: "Chicago, system-ui",
            fontSize: "13px",
            color: textColor,
            caretColor: textColor,
          }}
          autoFocus
          aria-label="Search for songs"
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: mutedColor }}>
              Searching...
            </div>
          </div>
        ) : items.length > 0 ? (
          <MenuList items={items} />
        ) : hasSearched && query.trim() ? (
          <div className="flex items-center justify-center h-full">
            <div style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: mutedColor }}>
              No results found
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div style={{ fontFamily: "Chicago, system-ui", fontSize: "12px", color: mutedColor }}>
              Type to search
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
