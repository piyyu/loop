/**
 * Abstract music provider interface.
 * The rest of the application depends ONLY on this interface.
 * Implementations can be swapped without changing any consumer code.
 */

import type { AudioQuality, ProviderSong } from "@/types/music";

export interface MusicProvider {
  /** Unique provider identifier */
  readonly name: string;

  /** Human-readable display name */
  readonly displayName: string;

  /**
   * Search for a song by query string.
   * Optionally filter by artist name for better matching.
   */
  searchSong(query: string, artist?: string): Promise<ProviderSong[]>;

  /**
   * Get a specific song by its provider-specific ID.
   */
  getSong(id: string): Promise<ProviderSong | null>;

  /**
   * Get a streamable URL for a song.
   * Quality defaults to "high" if not specified.
   */
  getStreamUrl(id: string, quality?: AudioQuality): Promise<string>;

  /**
   * Download the audio data for a song.
   * Returns raw audio bytes.
   */
  download(id: string, quality?: AudioQuality): Promise<ArrayBuffer>;
}
