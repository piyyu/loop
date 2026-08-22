import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireIfStale, serializeState } from "@/lib/rooms";

/**
 * POST /api/rooms/[code]/join — add a member to the room.
 * Body: { memberId, name? }
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;
    const { memberId, name } = await request.json();
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
    if (await expireIfStale(room.id)) {
      return NextResponse.json({ error: "Room expired" }, { status: 410 });
    }

    await prisma.roomMember.upsert({
      where: {
        roomId_memberId: { roomId: room.id, memberId },
      },
      update: { name: name || null },
      create: { roomId: room.id, memberId, name: name || null },
    });

    await prisma.room.update({
      where: { id: room.id },
      data: { lastActiveAt: new Date() },
    });

    const members = await prisma.roomMember.findMany({
      where: { roomId: room.id },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      room: { code: room.code, hostMemberId: room.hostMemberId },
      members: members.map((m) => ({ memberId: m.memberId, name: m.name })),
      state: serializeState(room.state),
    });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
