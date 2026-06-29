/**
 * Spotify Web API client for fetching user data, playlists, and tracks.
 * This client is ONLY used for metadata — never for playback.
 */

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: SpotifyImage[];
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks: { total: number };
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: SpotifyImage[];
  };
  duration_ms: number;
  track_number: number;
}

interface SpotifyPlaylistTrackItem {
  track: SpotifyTrack | null;
  added_at: string;
}

interface SpotifyPaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
}

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

async function spotifyFetch<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited — retry after delay
      const retryAfter = parseInt(
        response.headers.get("Retry-After") || "1",
        10
      );
      await new Promise((resolve) =>
        setTimeout(resolve, retryAfter * 1000)
      );
      return spotifyFetch(endpoint, accessToken);
    }
    throw new Error(
      `Spotify API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function getUserProfile(
  accessToken: string
): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>("/me", accessToken);
}

export async function getUserPlaylists(
  accessToken: string
): Promise<SpotifyPlaylist[]> {
  const playlists: SpotifyPlaylist[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await spotifyFetch<
      SpotifyPaginatedResponse<SpotifyPlaylist>
    >(`/me/playlists?limit=${limit}&offset=${offset}`, accessToken);

    playlists.push(...response.items);

    if (!response.next) break;
    offset += limit;
  }

  return playlists;
}

export async function getPlaylistTracks(
  playlistId: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await spotifyFetch<
      SpotifyPaginatedResponse<SpotifyPlaylistTrackItem>
    >(
      `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(track(id,name,artists(name),album(name,images),duration_ms,track_number)),next,total`,
      accessToken
    );

    for (const item of response.items) {
      if (item.track && item.track.id) {
        tracks.push(item.track);
      }
    }

    if (!response.next) break;
    offset += limit;
  }

  return tracks;
}

/**
 * Get the best quality image URL from Spotify images array
 */
export function getBestImage(
  images: SpotifyImage[],
  preferredSize: "small" | "medium" | "large" = "medium"
): string | null {
  if (!images || images.length === 0) return null;

  const sorted = [...images].sort((a, b) => b.width - a.width);

  switch (preferredSize) {
    case "large":
      return sorted[0]?.url || null;
    case "small":
      return sorted[sorted.length - 1]?.url || null;
    case "medium":
    default:
      return sorted[Math.floor(sorted.length / 2)]?.url || null;
  }
}
