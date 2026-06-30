/**
 * JioSaavn music provider implementation using the local jiosaavn-sdk.
 */

import type { MusicProvider } from "./music-provider";
import type { AudioQuality, ProviderSong } from "@/types/music";
import { SearchService, SongService } from "jiosaavn-sdk";

interface JioSaavnSearchResult {
  id: string;
  name: string;
  artists?: {
    primary?: { name: string }[];
    all?: { name: string }[];
  };
  album?: {
    name: string | null;
  };
  image?: { url: string; quality: string }[];
  duration?: number | null;
  downloadUrl?: { url: string; quality: string }[];
}

interface JioSaavnSongDetail {
  id: string;
  name: string;
  artists?: {
    primary?: { name: string }[];
    all?: { name: string }[];
  };
  album?: {
    name: string | null;
  };
  image?: { url: string; quality: string }[];
  duration?: number | null;
  downloadUrl?: { url: string; quality: string }[];
}

const QUALITY_MAP: Record<AudioQuality, string> = {
  low: "96kbps",
  medium: "160kbps",
  high: "320kbps",
  lossless: "320kbps",
};

export class JioSaavnProvider implements MusicProvider {
  readonly name = "jiosaavn";
  readonly displayName = "JioSaavn";

  private searchService: SearchService;
  private songService: SongService;

  constructor() {
    this.searchService = new SearchService();
    this.songService = new SongService();
  }

  async searchSong(query: string, artist?: string): Promise<ProviderSong[]> {
    const searchQuery = artist ? `${query} ${artist}` : query;

    try {
      const data = await this.searchService.searchSongs({
        query: searchQuery,
        page: 1,
        limit: 10,
      });
      const results = data.results || [];

      return results.map((song) => this.mapToProviderSong(song as any));
    } catch (error) {
      console.error("JioSaavn search error:", error);
      return [];
    }
  }

  async getSong(id: string): Promise<ProviderSong | null> {
    try {
      const songs = await this.songService.getSongByIds({ songIds: id });
      const song = songs?.[0];

      if (!song) return null;

      return this.mapToProviderSong(song as any);
    } catch (error) {
      console.error("JioSaavn getSong error:", error);
      return null;
    }
  }

  async getStreamUrl(
    id: string,
    quality: AudioQuality = "high"
  ): Promise<string> {
    const song = await this.getSong(id);
    if (!song) throw new Error(`Song not found: ${id}`);

    // Try to find the requested quality, fall back to highest available
    const targetQuality = QUALITY_MAP[quality];
    const downloadUrls = await this.getDownloadUrls(id);

    const match =
      downloadUrls.find((u) => u.quality === targetQuality) ||
      downloadUrls[downloadUrls.length - 1]; // highest available

    if (!match) throw new Error(`No stream URL available for: ${id}`);

    return match.url;
  }

  async download(
    id: string,
    quality: AudioQuality = "high"
  ): Promise<ArrayBuffer> {
    const streamUrl = await this.getStreamUrl(id, quality);
    const response = await fetch(streamUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  private async getDownloadUrls(
    id: string
  ): Promise<{ url: string; quality: string }[]> {
    try {
      const songs = await this.songService.getSongByIds({ songIds: id });
      const song = songs?.[0];

      return song?.downloadUrl || [];
    } catch {
      return [];
    }
  }

  private mapToProviderSong(
    song: JioSaavnSearchResult | JioSaavnSongDetail
  ): ProviderSong {
    const artists =
      song.artists?.primary?.map((a) => a.name).join(", ") ||
      song.artists?.all?.map((a) => a.name).join(", ") ||
      "Unknown Artist";

    const albumArt =
      song.image?.find((i) => i.quality === "500x500")?.url ||
      song.image?.[song.image.length - 1]?.url ||
      null;

    const streamUrl =
      song.downloadUrl?.find((u) => u.quality === "320kbps")?.url ||
      song.downloadUrl?.[song.downloadUrl.length - 1]?.url ||
      "";

    return {
      id: song.id,
      title: song.name,
      artist: artists,
      album: song.album?.name || "Unknown Album",
      albumArt,
      duration: (song.duration || 0) * 1000, // convert seconds to ms
      streamUrl,
      quality: "high",
      provider: this.name,
    };
  }
}
