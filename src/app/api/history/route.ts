import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

/**
 * GET /api/history — Fetch recent play history
 * POST /api/history — Record a play event (body: { songId })
 */
export async function GET() {
  try {
    const user = await getLocalUser();

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
    const user = await getLocalUser();

    const { songId } = await request.json();
    if (!songId) {
      return NextResponse.json(
        { error: "songId required" },
        { status: 400 }
      );
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
