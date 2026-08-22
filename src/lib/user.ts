import { prisma } from "@/lib/prisma";

/**
 * The app has no authentication — everything belongs to a single local user.
 */
const LOCAL_SPOTIFY_ID = "local-loop-user";

export async function getLocalUser() {
  return prisma.user.upsert({
    where: { spotifyId: LOCAL_SPOTIFY_ID },
    update: {},
    create: {
      spotifyId: LOCAL_SPOTIFY_ID,
      email: "local@loop.music",
      name: "Loop User",
      accessToken: "mock-dev-token",
    },
  });
}
