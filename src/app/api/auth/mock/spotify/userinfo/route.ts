import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    id: "mock-spotify-id",
    display_name: "Loop Demo User",
    email: "dev@loop.music",
    images: [
      {
        url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      },
    ],
  });
}
