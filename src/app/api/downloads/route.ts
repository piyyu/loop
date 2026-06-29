import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/downloads — Fetch user's downloaded songs (metadata only)
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

    const downloads = await prisma.download.findMany({
      where: { userId: user.id },
      include: {
        song: { include: { match: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      songs: downloads.map((d) => ({
        id: d.song.id,
        spotifyId: d.song.spotifyId,
        title: d.song.title,
        artist: d.song.artist,
        album: d.song.album,
        albumArt: d.song.albumArt,
        duration: d.song.duration,
        streamUrl: d.song.match?.streamUrl || null,
        isDownloaded: true,
        fileSize: d.fileSize,
      })),
    });
  } catch (error) {
    console.error("Downloads GET error:", error);
    return NextResponse.json({ songs: [] });
  }
}
