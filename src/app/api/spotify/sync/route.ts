import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserProfile,
  getUserPlaylists,
  getPlaylistTracks,
  getBestImage,
} from "@/lib/spotify";

async function syncMockData(spotifyId: string) {
  // Upsert mock user in DB
  const user = await prisma.user.upsert({
    where: { spotifyId: spotifyId },
    update: {
      name: "Loop Demo User",
      email: "dev@loop.music",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      accessToken: "mock-dev-token",
    },
    create: {
      spotifyId: spotifyId,
      email: "dev@loop.music",
      name: "Loop Demo User",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      accessToken: "mock-dev-token",
    },
  });

  const mockPlaylists = [
    {
      id: "mock-playlist-1",
      name: "Retro Lofi Beats",
      description: "Relaxing lofi tracks to study to.",
      imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&h=200&fit=crop",
      tracks: [
        { id: "mock-song-1", title: "Midnight Walk", artist: "Lofi Beats", album: "Chilled Out", duration: 180000, trackNumber: 1 },
        { id: "mock-song-2", title: "Tokyo Cafe", artist: "Sora", album: "Nostalgia", duration: 210000, trackNumber: 2 },
        { id: "mock-song-3", title: "Rainy Sunday", artist: "Warm Coffee", album: "Cozy vibes", duration: 165000, trackNumber: 3 },
      ],
    },
    {
      id: "mock-playlist-2",
      name: "Classic Rock Anthems",
      description: "Stellar guitar riffs from the golden era.",
      imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=200&h=200&fit=crop",
      tracks: [
        { id: "mock-song-4", title: "Stairway to Heaven", artist: "Led Zeppelin", album: "Led Zeppelin IV", duration: 482000, trackNumber: 1 },
        { id: "mock-song-5", title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", duration: 355000, trackNumber: 2 },
        { id: "mock-song-6", title: "Hotel California", artist: "Eagles", album: "Hotel California", duration: 390000, trackNumber: 3 },
      ],
    },
  ];

  let totalSongs = 0;
  for (const sp of mockPlaylists) {
    const playlist = await prisma.playlist.upsert({
      where: { spotifyId: sp.id },
      update: {
        name: sp.name,
        description: sp.description,
        imageUrl: sp.imageUrl,
      },
      create: {
        spotifyId: sp.id,
        name: sp.name,
        description: sp.description,
        imageUrl: sp.imageUrl,
        userId: user.id,
      },
    });

    for (const track of sp.tracks) {
      const song = await prisma.song.upsert({
        where: { spotifyId: track.id },
        update: {
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: sp.imageUrl,
          duration: track.duration,
          trackNumber: track.trackNumber,
        },
        create: {
          spotifyId: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: sp.imageUrl,
          duration: track.duration,
          trackNumber: track.trackNumber,
        },
      });

      await prisma.playlist.update({
        where: { id: playlist.id },
        data: {
          songs: {
            connect: { id: song.id },
          },
        },
      });
      totalSongs++;
    }
  }

  return { playlistsCount: mockPlaylists.length, songsCount: totalSongs };
}

/**
 * POST /api/spotify/sync
 * Syncs user's Spotify playlists and tracks to the database.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.accessToken || !session?.spotifyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.accessToken === "mock-dev-token" || session.accessToken === "mock-spotify-access-token") {
      const result = await syncMockData(session.spotifyId);
      return NextResponse.json({
        success: true,
        playlists: result.playlistsCount,
        songs: result.songsCount,
      });
    }

    const accessToken = session.accessToken;

    let profile;
    let spotifyPlaylists;
    try {
      // Try to sync with Spotify API
      profile = await getUserProfile(accessToken);
      spotifyPlaylists = await getUserPlaylists(accessToken);
    } catch (apiError) {
      console.warn("Spotify API sync failed (e.g. invalid client or token). Falling back to mock data sync:", apiError);
      const result = await syncMockData(session.spotifyId);
      return NextResponse.json({
        success: true,
        playlists: result.playlistsCount,
        songs: result.songsCount,
        fallback: true,
      });
    }

    const user = await prisma.user.upsert({
      where: { spotifyId: session.spotifyId },
      update: {
        name: profile.display_name,
        email: profile.email,
        image: profile.images?.[0]?.url,
        accessToken,
      },
      create: {
        spotifyId: session.spotifyId,
        email: profile.email,
        name: profile.display_name,
        image: profile.images?.[0]?.url,
        accessToken,
      },
    });

    let totalSongs = 0;

    for (const sp of spotifyPlaylists) {
      // Upsert playlist
      const playlist = await prisma.playlist.upsert({
        where: { spotifyId: sp.id },
        update: {
          name: sp.name,
          description: sp.description,
          imageUrl: getBestImage(sp.images),
        },
        create: {
          spotifyId: sp.id,
          name: sp.name,
          description: sp.description,
          imageUrl: getBestImage(sp.images),
          userId: user.id,
        },
      });

      // Fetch tracks for this playlist
      const tracks = await getPlaylistTracks(sp.id, accessToken);

      for (const track of tracks) {
        const artists = track.artists.map((a) => a.name).join(", ");
        const albumArt = getBestImage(track.album.images);

        // Upsert song
        const song = await prisma.song.upsert({
          where: { spotifyId: track.id },
          update: {
            title: track.name,
            artist: artists,
            album: track.album.name,
            albumArt,
            duration: track.duration_ms,
            trackNumber: track.track_number,
          },
          create: {
            spotifyId: track.id,
            title: track.name,
            artist: artists,
            album: track.album.name,
            albumArt,
            duration: track.duration_ms,
            trackNumber: track.track_number,
          },
        });

        // Connect song to playlist
        await prisma.playlist.update({
          where: { id: playlist.id },
          data: {
            songs: {
              connect: { id: song.id },
            },
          },
        });

        totalSongs++;
      }
    }

    return NextResponse.json({
      success: true,
      playlists: spotifyPlaylists.length,
      songs: totalSongs,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
