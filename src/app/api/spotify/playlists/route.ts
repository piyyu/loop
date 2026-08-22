import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

/**
 * GET /api/spotify/playlists
 * Fetches user's playlists from database.
 * ?id=xxx — fetches songs for a specific playlist.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get("id");

    const user = await getLocalUser();

    if (playlistId) {
      // Return songs for a specific playlist
      const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        include: {
          songs: {
            include: {
              match: true,
              favorites: { where: { userId: user.id } },
            },
            orderBy: { trackNumber: "asc" },
          },
        },
      });

      if (!playlist) {
        return NextResponse.json(
          { error: "Playlist not found" },
          { status: 404 }
        );
      }

      const songs = playlist.songs.map((song) => ({
        id: song.id,
        spotifyId: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        albumArt: song.albumArt,
        duration: song.duration,
        trackNumber: song.trackNumber,
        streamUrl: song.match?.streamUrl || null,
        isFavorite: song.favorites.length > 0,
      }));

      return NextResponse.json({ songs });
    }

    // Return all playlists
    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      include: { _count: { select: { songs: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      playlists: playlists.map((p) => ({
        id: p.id,
        spotifyId: p.spotifyId,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        songCount: p._count.songs,
      })),
    });
  } catch (error) {
    console.error("Playlists API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}
