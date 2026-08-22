import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireIfStale, serializeState } from "@/lib/rooms";

/**
 * GET /api/rooms/[code] — fetch a room snapshot (state + members).
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;

    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: { members: { orderBy: { joinedAt: "asc" } } },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (await expireIfStale(room.id)) {
      return NextResponse.json({ error: "Room expired" }, { status: 410 });
    }

    return NextResponse.json({
      room: { code: room.code, hostMemberId: room.hostMemberId },
      members: room.members.map((m) => ({
        memberId: m.memberId,
        name: m.name,
      })),
      state: serializeState(room.state),
    });
  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}
