import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  if (!redirectUri) {
    return new NextResponse("Missing redirect_uri", { status: 400 });
  }

  // Redirect back to NextAuth callback with mock code and state
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", "mock-spotify-auth-code");
  if (state) {
    callbackUrl.searchParams.set("state", state);
  }

  return NextResponse.redirect(callbackUrl.toString());
}
