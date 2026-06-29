import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/providers/provider-registry";

/**
 * GET /api/music/stream
 * Proxies stream URL resolution through the server.
 * ?id=xxx&provider=jiosaavn
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const providerName = searchParams.get("provider");

    if (!id) {
      return NextResponse.json(
        { error: "Song ID required" },
        { status: 400 }
      );
    }

    const provider = getProvider(providerName || undefined);
    const streamUrl = await provider.getStreamUrl(id);

    return NextResponse.json({ streamUrl });
  } catch (error) {
    console.error("Stream API error:", error);
    return NextResponse.json(
      { error: "Failed to get stream URL" },
      { status: 500 }
    );
  }
}
