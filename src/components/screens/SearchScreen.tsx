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
        const res = await fetch(
          `/api/music/search?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.songs || []);
        }
      } catch {
        // silent
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
