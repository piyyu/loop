import { prisma } from "@/lib/prisma";
import { emptyRoomState, type SharedPlaybackState } from "@/types/room";

/** Characters that are easy to read/say over voice chat */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;

/** Rooms expire after 72h of inactivity */
export const ROOM_TTL_MS = 72 * 60 * 60 * 1000;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function serializeState(raw: unknown): SharedPlaybackState {
  return { ...emptyRoomState(), ...(raw as SharedPlaybackState) };
}

/**
 * Delete the room if it has been inactive past the TTL.
 * Returns true if the room was expired and removed.
 */
export async function expireIfStale(roomId: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - ROOM_TTL_MS);
  const result = await prisma.room.deleteMany({
    where: { id: roomId, lastActiveAt: { lt: staleBefore } },
  });
  return result.count > 0;
}
