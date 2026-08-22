import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/rooms/[code]/leave — remove a member from the room.
 * Body: { memberId }
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;
    const { memberId } = await request.json();
    if (!memberId) {
      return NextResponse.json(
        { error: "memberId required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    await prisma.roomMember.deleteMany({
      where: { roomId: room.id, memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave room error:", error);
    return NextResponse.json({ error: "Failed to leave room" }, { status: 500 });
  }
}
