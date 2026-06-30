import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/providers/provider-registry";

/**
 * GET /api/music/search
 * Search for songs. Searches both database and music provider.
 * ?q=query — search by query
 * ?type=all — return all songs
 * ?type=albums — return grouped albums
 * ?type=artists — return grouped artists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type");

    const session = await auth();
    const user = session?.spotifyId
      ? await prisma.user.findUnique({
          where: { spotifyId: session.spotifyId },
        })
      : null;

    // Return all songs from database
    if (type === "all") {
      const songs = await prisma.song.findMany({
        include: { match: true },
        orderBy: { title: "asc" },
        take: 500,
      });

      return NextResponse.json({
        songs: songs.map((s) => ({
          id: s.id,
          spotifyId: s.spotifyId,
          title: s.title,
          artist: s.artist,
          album: s.album,
          albumArt: s.albumArt,
          duration: s.duration,
          trackNumber: s.trackNumber,
          streamUrl: s.match?.streamUrl || null,
        })),
      });
    }

    // Return grouped albums
    if (type === "albums") {
      const songs = await prisma.song.findMany({
        orderBy: { album: "asc" },
      });

      const albumMap = new Map<
        string,
        { name: string; artist: string; imageUrl: string | null; songCount: number }
      >();

      for (const song of songs) {
        const albumName = song.album || "Unknown Album";
        if (!albumMap.has(albumName)) {
          albumMap.set(albumName, {
            name: albumName,
            artist: song.artist,
            imageUrl: song.albumArt,
            songCount: 0,
          });
        }
        albumMap.get(albumName)!.songCount++;
      }

      return NextResponse.json({
        albums: Array.from(albumMap.values()),
      });
    }

    // Return grouped artists
    if (type === "artists") {
      const songs = await prisma.song.findMany({
        orderBy: { artist: "asc" },
      });

      const artistMap = new Map<
        string,
        { name: string; imageUrl: string | null; songCount: number }
      >();

      for (const song of songs) {
        if (!artistMap.has(song.artist)) {
          artistMap.set(song.artist, {
            name: song.artist,
            imageUrl: song.albumArt,
            songCount: 0,
          });
        }
        artistMap.get(song.artist)!.songCount++;
      }

      return NextResponse.json({
        artists: Array.from(artistMap.values()),
      });
    }

    // Search by query
    if (query) {
      // Search database only
      const dbSongs = await prisma.song.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { artist: { contains: query, mode: "insensitive" } },
            { album: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { match: true },
        take: 20,
      });

      const dbSongList = dbSongs.map((s) => ({
        id: s.id,
        spotifyId: s.spotifyId,
        title: s.title,
        artist: s.artist,
        album: s.album,
        albumArt: s.albumArt,
        duration: s.duration,
        trackNumber: s.trackNumber,
        streamUrl: s.match?.streamUrl || null,
      }));

      return NextResponse.json({
        songs: dbSongList,
      });
    }

    return NextResponse.json({ songs: [] });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
