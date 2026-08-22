import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract playlist ID from URL
    // e.g. https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid Spotify playlist URL" },
        { status: 400 }
      );
    }
    const playlistId = match[1];

    // Fetch the embed page
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Spotify playlist page" },
        { status: 500 }
      );
    }

    const html = await response.text();

    // Extract __NEXT_DATA__ JSON script content
    const jsonMatch = html.match(
      /<script[^>]*__NEXT_DATA__[^>]*>([\s\S]*?)<\/script>/
    );
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse playlist page structure" },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[1]);
    const entity = data?.props?.pageProps?.state?.data?.entity;

    if (!entity || !entity.trackList) {
      return NextResponse.json(
        { error: "No track list found in playlist" },
        { status: 400 }
      );
    }

    const user = await getLocalUser();

    const playlistName = entity.name || entity.title || "Imported Playlist";
    const playlistDesc = entity.subtitle || "";
    const playlistImage =
      entity.coverArt?.sources?.[0]?.url ||
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop";

    // Upsert the playlist
    const playlist = await prisma.playlist.upsert({
      where: { spotifyId: playlistId },
      update: {
        name: playlistName,
        description: playlistDesc,
        imageUrl: playlistImage,
      },
      create: {
        spotifyId: playlistId,
        name: playlistName,
        description: playlistDesc,
        imageUrl: playlistImage,
        userId: user.id,
      },
    });

    let totalSongs = 0;

    for (let i = 0; i < entity.trackList.length; i++) {
      const track = entity.trackList[i];
      const trackUri = track.uri || "";
      const trackId = trackUri.split(":").pop();

      if (!trackId) continue;

      const trackTitle = track.title || "Unknown Song";
      const trackArtist = track.subtitle || "Unknown Artist";
      const trackDuration = track.duration || 180000; // fallback 3 minutes

      // Upsert song
      const song = await prisma.song.upsert({
        where: { spotifyId: trackId },
        update: {
          title: trackTitle,
          artist: trackArtist,
          albumArt: playlistImage,
          duration: trackDuration,
          trackNumber: i + 1,
        },
        create: {
          spotifyId: trackId,
          title: trackTitle,
          artist: trackArtist,
          albumArt: playlistImage,
          duration: trackDuration,
          trackNumber: i + 1,
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

    return NextResponse.json({
      success: true,
      name: playlistName,
      playlistId: playlist.id,
      songsCount: totalSongs,
    });
  } catch (error) {
    console.error("Import public playlist error:", error);
    return NextResponse.json(
      { error: "Import failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}
