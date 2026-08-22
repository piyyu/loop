"use client";

import { useState, useEffect } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { useSettingsStore } from "@/stores/settings-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Song } from "@/types/music";
import { startPlayback } from "@/lib/playback";
import { formatTime } from "@/utils/format";

/**
 * Search screen — allows text input and searches across providers.
 * Uses the click wheel for character selection (iPod-style) or keyboard input.
 */
export function SearchScreen() {
  const { push } = useNavigationStore();
  const { darkMode } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";

  useEffect(() => {
    const q = query.trim();
    if (!q) return;

    // Debounced search — all state updates happen asynchronously in the timer
    const timeoutId = setTimeout(() => {
      setLoading(true);
      setHasSearched(true);

      fetch(`/api/music/search?q=${encodeURIComponent(q)}`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setResults(data.songs || []);
          }
        })
        .catch((err) => {
          console.error("Search failed:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
    }
  };

  const items: MenuItem[] = results.map((song, index) => ({
    id: song.id,
    label: song.title,
    subtitle: `${song.artist} · ${formatTime(song.duration)}`,
    action: () => {
      startPlayback(results, index);
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
          onChange={handleQueryChange}
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
