import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";
import Credentials from "next-auth/providers/credentials";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID || "mock-spotify-client-id",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "mock-spotify-client-secret",
      authorization:
        process.env.SPOTIFY_CLIENT_ID === "mock-spotify-client-id" || !process.env.SPOTIFY_CLIENT_ID
          ? `${process.env.NEXTAUTH_URL || "http://127.0.0.1:3000"}/api/auth/mock/spotify/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}`
          : `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}`,
      token:
        process.env.SPOTIFY_CLIENT_ID === "mock-spotify-client-id" || !process.env.SPOTIFY_CLIENT_ID
          ? `${process.env.NEXTAUTH_URL || "http://127.0.0.1:3000"}/api/auth/mock/spotify/token`
          : undefined,
      userinfo:
        process.env.SPOTIFY_CLIENT_ID === "mock-spotify-client-id" || !process.env.SPOTIFY_CLIENT_ID
          ? `${process.env.NEXTAUTH_URL || "http://127.0.0.1:3000"}/api/auth/mock/spotify/userinfo`
          : undefined,
    }),
    Credentials({
      name: "Development Bypass",
      credentials: {},
      async authorize() {
        return {
          id: "dev-user",
          name: "Loop Retro User",
          email: "dev@loop.music",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.spotifyId = (profile as Record<string, unknown>).id as string;
      } else if (account && account.provider === "credentials") {
        token.accessToken = "mock-dev-token";
        token.spotifyId = "mock-spotify-id";
      }

      // Refresh token if expired
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
        try {
          const response = await fetch(
            "https://accounts.spotify.com/api/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                  `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
                ).toString("base64")}`,
              },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) throw data;

          token.accessToken = data.access_token;
          token.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
          if (data.refresh_token) {
            token.refreshToken = data.refresh_token;
          }
        } catch (error) {
          console.error("Error refreshing access token", error);
          token.error = "RefreshAccessTokenError";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken as string;
        session.spotifyId = token.spotifyId as string;
        session.error = token.error as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

// Extend types for session
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    spotifyId?: string;
    error?: string;
  }
}
