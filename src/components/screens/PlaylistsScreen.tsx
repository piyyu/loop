"use client";

import { useEffect, useState } from "react";
import { useNavigationStore } from "@/stores/navigation-store";
import { useSettingsStore } from "@/stores/settings-store";
import { MenuList } from "@/components/ipod/MenuList";
import type { MenuItem } from "@/types/navigation";
import type { Playlist } from "@/types/music";

/**
 * Playlists screen — shows user's synced Spotify playlists.
 */
export function PlaylistsScreen() {
  const { push } = useNavigationStore();
  const { darkMode } = useSettingsStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Import states
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const textColor = darkMode ? "#C8D8B8" : "#1a1a1a";
  const mutedColor = darkMode ? "#8A9A7A" : "#5A6A4A";
  const highlightBg = darkMode ? "#3A5A9D" : "#4A90D9";

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

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);

    try {
      const res = await fetch("/api/spotify/import-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsImporting(false);
        setImportUrl("");
        await fetchPlaylists();
      } else {
        setImportError(data.error || "Failed to import playlist");
      }
    } catch (err) {
      setImportError("Network error occurred during import");
    } finally {
      setImporting(false);
    }
  };

  if (loading || syncing) {
    return <LoadingIndicator message={syncing ? "Syncing..." : "Loading..."} />;
  }

  if (isImporting) {
    return (
      <div className="h-full flex flex-col justify-center px-4 py-3">
        <div
          style={{
            fontFamily: "Chicago, system-ui",
            fontSize: "11px",
            color: mutedColor,
          }}
          className="mb-2 font-bold"
        >
          Enter Public Spotify Playlist URL:
        </div>
        <input
          type="text"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          placeholder="https://open.spotify.com/playlist/..."
          className="w-full bg-transparent outline-none p-1.5 rounded mb-2"
          style={{
            fontFamily: "Chicago, system-ui",
            fontSize: "11px",
            color: textColor,
            border: `1px solid ${mutedColor}`,
          }}
          autoFocus
          disabled={importing}
        />
        {importError && (
          <div
            className="text-[10px] mb-2 truncate"
            style={{ color: "#D94A4A", fontFamily: "Chicago, system-ui" }}
          >
            {importError}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              setIsImporting(false);
              setImportUrl("");
              setImportError(null);
            }}
            className="px-3 py-1 rounded text-[10px] font-bold cursor-pointer"
            style={{
              border: `1px solid ${mutedColor}`,
              color: mutedColor,
              fontFamily: "Chicago, system-ui",
            }}
            disabled={importing}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1 rounded text-[10px] font-bold cursor-pointer"
            style={{
              background: highlightBg,
              color: "#FFFFFF",
              border: "none",
              fontFamily: "Chicago, system-ui",
            }}
            disabled={importing}
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    );
  }

  const items: MenuItem[] = [
    {
      id: "import-playlist",
      label: "⊕ Import Spotify Playlist",
      subtitle: "Paste a public URL",
      action: () => setIsImporting(true),
    },
    ...playlists.map((pl) => ({
      id: pl.id,
      label: pl.name,
      subtitle: `${pl.songCount || 0} songs`,
      hasArrow: true,
      screen: "playlist-detail" as const,
      data: { playlistId: pl.id },
    })),
  ];

  return <MenuList items={items} />;
}

function LoadingIndicator({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div
        className="text-center"
        style={{
          fontFamily: "Chicago, system-ui",
          fontSize: "12px",
          color: "#5A6A4A",
        }}
      >
        <div className="animate-spin text-2xl mb-2">⟳</div>
        {message}
      </div>
    </div>
  );
}
