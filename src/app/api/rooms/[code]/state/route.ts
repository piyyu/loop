import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireIfStale, serializeState } from "@/lib/rooms";
import {
  positionAt,
  type QueuedSong,
  type SharedPlaybackState,
} from "@/types/room";

type RoomAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "seek"; positionMs: number }
  | { type: "skip" } // advance to next queued song
  | { type: "play-now"; song: QueuedSong; queueAfter?: QueuedSong[] }
  | { type: "add-to-queue"; song: QueuedSong }
  | { type: "remove-from-queue"; index: number };

/**
 * POST /api/rooms/[code]/state — apply a control action (everyone controls).
 * Serialized by an optimistic rev lock; last write wins.
 * Body: { memberId, expectedRev, action }
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;
    const { expectedRev, action } = await request.json();

    if (typeof expectedRev !== "number" || !action?.type) {
      return NextResponse.json(
        { error: "expectedRev and action.type required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (await expireIfStale(room.id)) {
      return NextResponse.json({ error: "Room expired" }, { status: 410 });
    }

    const current = serializeState(room.state);
    if (room.rev !== expectedRev) {
      // Someone wrote first — hand back the latest so the client can retry
      return NextResponse.json(
        { conflict: true, state: { ...current, rev: room.rev } },
        { status: 409 }
      );
    }

    const now = Date.now();
    const nextState = applyAction(current, action, now);
    // Persist the incremented rev so SSE readers stay consistent
    nextState.rev = room.rev + 1;

    const updated = await prisma.room.updateMany({
      where: { id: room.id, rev: expectedRev },
      data: {
        state: nextState as unknown as object,
        rev: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });

    if (updated.count === 0) {
      const latest = await prisma.room.findUnique({
        where: { id: room.id },
      });
      return NextResponse.json(
        {
          conflict: true,
          state: latest
            ? { ...serializeState(latest.state), rev: latest.rev }
            : null,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      state: nextState,
    });
  } catch (error) {
    console.error("Room state update error:", error);
    return NextResponse.json(
      { error: "Failed to update room state" },
      { status: 500 }
    );
  }
}

function applyAction(
  state: SharedPlaybackState,
  action: RoomAction,
  nowMs: number
): SharedPlaybackState {
  const next: SharedPlaybackState = { ...state, queue: [...state.queue] };
  const currentPosition = positionAt(state, nowMs);

  switch (action.type) {
    case "play": {
      if (!next.current) break;
      const resumePos = next.isPlaying
        ? currentPosition
        : (next.pausedPositionMs ?? 0);
      next.isPlaying = true;
      next.startedAt = nowMs - resumePos;
      next.pausedPositionMs = null;
      break;
    }

    case "pause":
    case "toggle": {
      if (action.type === "toggle" && !next.isPlaying) {
        return applyAction(next, { type: "play" }, nowMs);
      }
      if (!next.current || !next.isPlaying) break;
      next.pausedPositionMs = currentPosition;
      next.isPlaying = false;
      next.startedAt = null;
      break;
    }

    case "seek": {
      if (!next.current) break;
      const pos = Math.max(0, Math.min(action.positionMs, next.current.duration));
      if (next.isPlaying) {
        next.startedAt = nowMs - pos;
      } else {
        next.pausedPositionMs = pos;
      }
      break;
    }

    case "skip": {
      if (next.queue.length === 0) {
        next.current = null;
        next.isPlaying = false;
        next.startedAt = null;
        next.pausedPositionMs = null;
        break;
      }
      next.current = next.queue[0];
      next.queue = next.queue.slice(1);
      next.isPlaying = true;
      next.startedAt = nowMs;
      next.pausedPositionMs = null;
      break;
    }

    case "play-now": {
      next.current = action.song;
      next.isPlaying = true;
      next.startedAt = nowMs;
      next.pausedPositionMs = null;
      const upcoming = action.queueAfter ?? next.queue;
      next.queue = upcoming.filter((s) => s.id !== action.song.id);
      break;
    }

    case "add-to-queue": {
      if (next.queue.some((s) => s.id === action.song.id)) break;
      if (next.current?.id === action.song.id) break;
      next.queue.push(action.song);
      break;
    }

    case "remove-from-queue": {
      next.queue.splice(action.index, 1);
      break;
    }
  }

  return next;
}
