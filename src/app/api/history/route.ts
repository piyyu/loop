import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/history — Fetch recent play history
 * POST /api/history — Record a play event (body: { songId })
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

    const history = await prisma.history.findMany({
      where: { userId: user.id },
      include: {
        song: { include: { match: true } },
      },
      orderBy: { playedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      songs: history.map((h) => ({
        id: h.song.id,
        spotifyId: h.song.spotifyId,
        title: h.song.title,
        artist: h.song.artist,
        album: h.song.album,
        albumArt: h.song.albumArt,
        duration: h.song.duration,
        streamUrl: h.song.match?.streamUrl || null,
      })),
    });
  } catch (error) {
    console.error("History GET error:", error);
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

    await prisma.history.create({
      data: { userId: user.id, songId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("History POST error:", error);
    return NextResponse.json(
      { error: "Failed to record history" },
      { status: 500 }
    );
  }
}
