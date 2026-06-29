// Music domain types used throughout the application

export interface Song {
  id: string;
  spotifyId: string;
  title: string;
  artist: string;
  album: string | null;
  albumArt: string | null;
  duration: number; // milliseconds
  trackNumber: number | null;
  streamUrl?: string;
  isDownloaded?: boolean;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  spotifyId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  songCount?: number;
  songs?: Song[];
}

export interface Album {
  name: string;
  artist: string;
  imageUrl: string | null;
  songs: Song[];
}

export interface Artist {
  name: string;
  imageUrl: string | null;
  songCount: number;
  songs?: Song[];
}

export type AudioQuality = "low" | "medium" | "high" | "lossless";

export interface ProviderSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  duration: number;
  streamUrl: string;
  quality: AudioQuality;
  provider: string;
}

export interface SearchResults {
  songs: Song[];
  playlists: Playlist[];
  albums: Album[];
  artists: Artist[];
}
