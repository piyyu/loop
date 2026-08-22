import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

type FavoriteRow = {
  song: {
    id: string;
    spotifyId: string;
    title: string;
    artist: string;
    album: string | null;
    albumArt: string | null;
    duration: number;
    match: { streamUrl: string | null } | null;
  };
};

/**
 * GET /api/favorites — Fetch user's favorites
 * POST /api/favorites — Toggle favorite (body: { songId, song })
 */
export async function GET() {
  try {
    const user = await getLocalUser();

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        song: { include: { match: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      songs: favorites.map((f: FavoriteRow) => ({
        id: f.song.id,
        spotifyId: f.song.spotifyId,
        title: f.song.title,
        artist: f.song.artist,
        album: f.song.album,
        albumArt: f.song.albumArt,
        duration: f.song.duration,
        streamUrl: f.song.match?.streamUrl || null,
        isFavorite: true,
      })),
    });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json({ songs: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getLocalUser();

    const { songId, song } = await request.json();
    if (!songId) {
      return NextResponse.json(
        { error: "songId required" },
        { status: 400 }
      );
    }

    // Ensure the song exists in the database
    let dbSong = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!dbSong && song) {
      dbSong = await prisma.song.create({
        data: {
          id: song.id,
          spotifyId: song.spotifyId || `provider-${song.id}`,
          title: song.title,
          artist: song.artist,
          album: song.album,
          albumArt: song.albumArt,
          duration: song.duration,
          trackNumber: song.trackNumber || null,
        },
      });

      if (song.streamUrl) {
        await prisma.songMatch.create({
          data: {
            songId: dbSong.id,
            streamUrl: song.streamUrl,
            providerId: "jiosaavn",
            providerSongId: song.id,
          },
        });
      }
    }

    // Toggle favorite
    const existing = await prisma.favorite.findUnique({
      where: { userId_songId: { userId: user.id, songId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    } else {
      await prisma.favorite.create({
        data: { userId: user.id, songId },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
