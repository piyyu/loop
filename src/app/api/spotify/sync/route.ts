import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

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
 * Syncs the local user's playlists and tracks to the database.
 */
export async function POST() {
  try {
    const user = await getLocalUser();
    const result = await syncMockData(user.spotifyId);
    return NextResponse.json({
      success: true,
      playlists: result.playlistsCount,
      songs: result.songsCount,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
