import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({
    access_token: "mock-spotify-access-token",
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: "mock-spotify-refresh-token",
  });
}
