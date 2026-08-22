import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRoomCode, serializeState } from "@/lib/rooms";
import { emptyRoomState } from "@/types/room";

/**
 * POST /api/rooms — create a new listen-together room.
 * Body: { hostMemberId, hostName? }
 */
export async function POST(request: NextRequest) {
  try {
    const { hostMemberId, hostName } = await request.json();
    if (!hostMemberId) {
      return NextResponse.json(
        { error: "hostMemberId required" },
        { status: 400 }
      );
    }

    // Retry on the (unlikely) code collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      try {
        const room = await prisma.room.create({
          data: {
            code,
            hostMemberId,
            state: emptyRoomState() as unknown as object,
            members: {
              create: { memberId: hostMemberId, name: hostName || null },
            },
          },
        });

        return NextResponse.json({
          room: {
            code: room.code,
            hostMemberId: room.hostMemberId,
          },
          members: [{ memberId: hostMemberId, name: hostName || null }],
          state: serializeState(room.state),
        });
      } catch (err) {
        // Unique constraint violation on code — retry with a new code
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code?: string }).code === "P2002" &&
          attempt < 4
        ) {
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json(
      { error: "Could not allocate room code" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
