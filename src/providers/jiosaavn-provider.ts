import type { MusicProvider } from "./music-provider";
import type { ProviderSong } from "@/types/music";

const BASE_URL =
  process.env.NEXT_PUBLIC_JIOSAAVN_API_URL || "https://saavnapi-nine.vercel.app";

interface RawSaavnSong {
  id: string;
  song?: string;
  title?: string;
  album?: string;
  image?: string;
  duration?: string;
  primary_artists?: string;
  artistMap?: Record<string, unknown>;
  media_url?: string;
  "320kbps"?: string;
}

interface ProviderSongWithProvider extends ProviderSong {
  provider: string;
}

export class JioSaavnProvider implements MusicProvider {
  readonly name = "jiosaavn";
  readonly displayName = "JioSaavn";

  // Cache of id → stream url populated by search results,
  // used as a fallback for getStreamUrl since this API has no by-id endpoint.
  private streamCache = new Map<string, string>();

  private async fetchApi<T>(endpoint: string): Promise<T | null> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, { cache: "no-store" });
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch (error) {
      console.error(`JioSaavn API Error on ${endpoint}:`, error);
      return null;
    }
  }

  async searchSong(query: string): Promise<ProviderSong[]> {
    const data = await this.fetchApi<RawSaavnSong[]>(
      `/result/?query=${encodeURIComponent(query)}`
    );
    const results = Array.isArray(data) ? data : [];
    return results.map((song) => this.mapToProviderSong(song));
  }

  async getStreamUrl(id: string): Promise<string> {
    const cached = this.streamCache.get(id);
    if (cached) return cached;
    throw new Error(`No stream URL available for: ${id}`);
  }

  async download(id: string): Promise<ArrayBuffer> {
    const streamUrl = await this.getStreamUrl(id);
    const response = await fetch(streamUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  async getSong(id: string): Promise<ProviderSong | null> {
    if (this.streamCache.has(id)) {
      const cached = await this.searchSong(id);
      return cached.find((s) => s.id === id) || null;
    }
    return null;
  }

  private mapToProviderSong(song: RawSaavnSong): ProviderSongWithProvider {
    const artists =
      song.primary_artists ||
      (song.artistMap ? Object.keys(song.artistMap).join(", ") : "") ||
      "Unknown Artist";

    const streamUrl = song.media_url || "";
    if (streamUrl && song.id) {
      this.streamCache.set(song.id, streamUrl);
    }

    let albumArt = song.image || null;
    if (albumArt && albumArt.includes("150x150")) {
      albumArt = albumArt.replace("150x150", "500x500");
    }

    return {
      id: song.id,
      title: song.song || song.title || "Unknown Title",
      artist: artists,
      album: song.album || "Unknown Album",
      albumArt,
      duration: (parseInt(song.duration || "0", 10) || 0) * 1000,
      streamUrl,
      quality: song["320kbps"] === "true" ? "high" : "medium",
      provider: this.name,
    };
  }
}
