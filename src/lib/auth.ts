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

function isMockMode(): boolean {
  return (
    process.env.SPOTIFY_CLIENT_ID === "mock-spotify-client-id" ||
    !process.env.SPOTIFY_CLIENT_ID
  );
}

function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://127.0.0.1:3000";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    isMockMode()
      ? Credentials({
          id: "spotify",
          name: "Mock Spotify",
          credentials: {},
          async authorize() {
            return {
              id: "mock-spotify-id",
              name: "Loop Demo User",
              email: "dev@loop.music",
            };
          },
        })
      : Spotify({
          clientId: process.env.SPOTIFY_CLIENT_ID || "mock-spotify-client-id",
          clientSecret:
            process.env.SPOTIFY_CLIENT_SECRET || "mock-spotify-client-secret",
          authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SPOTIFY_SCOPES)}`,
        }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        if (account.type === "credentials") {
          token.accessToken = "mock-spotify-access-token";
          token.refreshToken = "mock-spotify-refresh-token";
          token.expiresAt = Math.floor(Date.now() / 1000) + 3600;
          token.spotifyId = "mock-spotify-id";
        } else if (profile) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
          token.spotifyId = (profile as Record<string, unknown>).id as string;
        }
      }

      // Refresh token if expired
      if (token.expiresAt && Date.now() >= (token.expiresAt as number) * 1000) {
        if (token.refreshToken === "mock-spotify-refresh-token") {
          token.expiresAt = Math.floor(Date.now() / 1000) + 3600;
          return token;
        }

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
  trustHost: true,
});

// Extend types for session
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    spotifyId?: string;
    error?: string;
  }
}
