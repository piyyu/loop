import type { MusicProvider } from "./music-provider";
import type { AudioQuality, ProviderSong } from "@/types/music";

const BASE_URL = "https://nepotuneapi.vercel.app";

const QUALITY_MAP: Record<AudioQuality, string> = {
  low: "96kbps",
  medium: "160kbps",
  high: "320kbps",
  lossless: "320kbps",
};

export class JioSaavnProvider implements MusicProvider {
  readonly name = "jiosaavn";
  readonly displayName = "JioSaavn";

  private async fetchApi<T>(endpoint: string): Promise<T | null> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, { cache: "no-store" });
      if (!response.ok) return null;
      const json = await response.json();
      if (!json.success) return null;
      return json.data;
    } catch (error) {
      console.error(`JioSaavn API Error on ${endpoint}:`, error);
      return null;
    }
  }

  async searchSong(query: string, artist?: string): Promise<ProviderSong[]> {
    const searchQuery = artist ? `${query} ${artist}` : query;
    const data = await this.fetchApi<any>(`/api/search/songs?query=${encodeURIComponent(searchQuery)}&limit=10`);
    const results = data?.results || [];
    return results.map((song: any) => this.mapToProviderSong(song));
  }

  async getSong(id: string): Promise<ProviderSong | null> {
    const data = await this.fetchApi<any[]>(`/api/songs/${encodeURIComponent(id)}`);
    const song = data?.[0];
    if (!song) return null;
    return this.mapToProviderSong(song);
  }

  async getStreamUrl(id: string, quality: AudioQuality = "high"): Promise<string> {
    const data = await this.fetchApi<any[]>(`/api/songs/${encodeURIComponent(id)}`);
    const song = data?.[0];
    if (!song) throw new Error(`Song not found: ${id}`);

    const targetQuality = QUALITY_MAP[quality];
    const downloadUrls = song.downloadUrl || [];
    
    const match =
      downloadUrls.find((u: any) => u.quality === targetQuality) ||
      downloadUrls[downloadUrls.length - 1]; // highest available

    if (!match) throw new Error(`No stream URL available for: ${id}`);
    return match.url;
  }

  async download(id: string, quality: AudioQuality = "high"): Promise<ArrayBuffer> {
    const streamUrl = await this.getStreamUrl(id, quality);
    const response = await fetch(streamUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  private mapToProviderSong(song: any): ProviderSong {
    // Extract artists
    const artists =
      song.artists?.primary?.map((a: any) => a.name).join(", ") ||
      song.artists?.all?.map((a: any) => a.name).join(", ") ||
      "Unknown Artist";

    // Extract best stream url (320kbps or fallback)
    const streamUrl =
      song.downloadUrl?.find((u: any) => u.quality === "320kbps")?.url ||
      song.downloadUrl?.[song.downloadUrl.length - 1]?.url ||
      "";

    // Extract high-quality image
    let albumArt = song.image?.find((i: any) => i.quality === "500x500")?.url ||
      song.image?.[song.image.length - 1]?.url ||
      null;

    if (albumArt && albumArt.includes("150x150")) {
      albumArt = albumArt.replace("150x150", "500x500");
    }

    return {
      id: song.id,
      title: song.name || song.title,
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
