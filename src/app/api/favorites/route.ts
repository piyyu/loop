import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/favorites — Fetch user's favorites
 * POST /api/favorites — Toggle favorite (body: { songId })
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.spotifyId) {
      return NextResponse.json({ songs: [] });
    }

    const user = await prisma.user.findUnique({
      where: { spotifyId: session.spotifyId },
    });
    if (!user) return NextResponse.json({ songs: [] });

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        song: { include: { match: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      songs: favorites.map((f) => ({
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
    const session = await auth();
    if (!session?.spotifyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { songId } = await request.json();
    if (!songId) {
      return NextResponse.json(
        { error: "songId required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { spotifyId: session.spotifyId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
