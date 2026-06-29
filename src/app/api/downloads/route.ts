import { NextRequest, NextResponse } from "next/server";
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

/**
 * POST /api/downloads — Register a downloaded song
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.spotifyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { songId, fileKey, fileSize, song } = await request.json();
    if (!songId || !fileKey) {
      return NextResponse.json(
        { error: "songId and fileKey required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { spotifyId: session.spotifyId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    const download = await prisma.download.upsert({
      where: { userId_songId: { userId: user.id, songId } },
      update: { fileKey, fileSize: fileSize || 0 },
      create: { userId: user.id, songId, fileKey, fileSize: fileSize || 0 },
    });

    return NextResponse.json({ success: true, download });
  } catch (error) {
    console.error("Downloads POST error:", error);
    return NextResponse.json(
      { error: "Failed to register download" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/downloads — Delete a downloaded song record
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.spotifyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId");
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

    await prisma.download.deleteMany({
      where: { userId: user.id, songId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Downloads DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete download record" },
      { status: 500 }
    );
  }
}
