import type { MusicProvider } from "./music-provider";
import type { AudioQuality, ProviderSong } from "@/types/music";
import forge from "node-forge";

const QUALITY_MAP: Record<AudioQuality, string> = {
  low: "_96.mp4",
  medium: "_160.mp4",
  high: "_320.mp4",
  lossless: "_320.mp4",
};

export class JioSaavnProvider implements MusicProvider {
  readonly name = "jiosaavn";
  readonly displayName = "JioSaavn";

  // Shared fetcher to inject Indian geo-cookie and bypass Vercel IP blocks
  private async fetchApi(endpoint: string, params: Record<string, string>) {
    const url = new URL("https://www.jiosaavn.com/api.php");
    url.searchParams.append("__call", endpoint);
    url.searchParams.append("_format", "json");
    url.searchParams.append("_marker", "0");
    url.searchParams.append("api_version", "4");
    url.searchParams.append("ctx", "web6dot0");

    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": "geo=103.155.223.1%2CIN%2CMaharashtra%2CMumbai%2C400001; L=english,hindi;",
      },
    });

    if (!response.ok) throw new Error(`JioSaavn API Error: ${response.status}`);
    return response.json();
  }

  async searchSong(query: string, artist?: string): Promise<ProviderSong[]> {
    const searchQuery = artist ? `${query} ${artist}` : query;

    try {
      const data = await this.fetchApi("search.getResults", { q: searchQuery, n: "10", p: "1" });
      const results = data.results || [];
      return results.map((song: any) => this.mapToProviderSong(song));
    } catch (error) {
      console.error("JioSaavn search error:", error);
      return [];
    }
  }

  async getSong(id: string): Promise<ProviderSong | null> {
    try {
      const data = await this.fetchApi("song.getDetails", { pids: id });
      const song = data?.songs?.[0] || data?.[id];
      if (!song) return null;
      return this.mapToProviderSong(song);
    } catch (error) {
      console.error("JioSaavn getSong error:", error);
      return null;
    }
  }

  async getStreamUrl(id: string, quality: AudioQuality = "high"): Promise<string> {
    const song = await this.getSong(id);
    if (!song || !song.streamUrl) throw new Error(`Song not found: ${id}`);

    // JioSaavn stream URLs have qualities like _96.mp4, _160.mp4, _320.mp4
    const suffix = QUALITY_MAP[quality];
    return song.streamUrl.replace(/_96\.mp4|_160\.mp4|_320\.mp4/, suffix);
  }

  async download(id: string, quality: AudioQuality = "high"): Promise<ArrayBuffer> {
    const streamUrl = await this.getStreamUrl(id, quality);
    const response = await fetch(streamUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.arrayBuffer();
  }

  private decryptUrl(encryptedMediaUrl: string): string {
    if (!encryptedMediaUrl) return "";
    try {
      const key = "38346591";
      const encrypted = forge.util.decode64(encryptedMediaUrl);
      const decipher = forge.cipher.createDecipher("DES-ECB", forge.util.createBuffer(key));
      decipher.start({ iv: forge.util.createBuffer("") });
      decipher.update(forge.util.createBuffer(encrypted));
      decipher.finish();
      return decipher.output.getBytes();
    } catch (error) {
      console.error("Decryption error:", error);
      return "";
    }
  }

  private mapToProviderSong(song: any): ProviderSong {
    // Extract primary artists
    const artistMap = song.more_info?.artistMap;
    const artists = artistMap?.primary_artists?.map((a: any) => a.name).join(", ") 
      || song.subtitle 
      || "Unknown Artist";

    // Decrypt the media url to get the streamable link (defaults to 96kbps, getStreamUrl modifies this)
    const encryptedUrl = song.more_info?.encrypted_media_url || song.more_info?.encrypted_drm_media_url;
    const streamUrl = this.decryptUrl(encryptedUrl);

    // Fix image URL resolution to high quality
    let albumArt = song.image || null;
    if (albumArt) {
      albumArt = albumArt.replace("150x150", "500x500");
    }

    return {
      id: song.id,
      title: song.title || song.name,
      artist: artists,
      album: song.more_info?.album || song.album || "Unknown Album",
      albumArt,
      duration: parseInt(song.more_info?.duration || song.duration || "0", 10) * 1000,
      streamUrl,
      quality: "high",
      provider: this.name,
    };
  }
}
