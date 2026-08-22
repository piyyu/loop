import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { expireIfStale, serializeState } from "@/lib/rooms";

const POLL_INTERVAL_MS = 1000;
const HEARTBEAT_INTERVAL_MS = 15000;

/**
 * GET /api/rooms/[code]/events — Server-Sent Events stream of room snapshots.
 * Polls the room row server-side and pushes when rev or members change.
 * Position sync itself derives from timestamps, so ~1s fan-out latency is fine.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", close);

      let lastSignature = "";

      const readRoom = async () => {
        if (closed) return;
        try {
          const room = await prisma.room.findUnique({
            where: { code: code.toUpperCase() },
            include: { members: { orderBy: { joinedAt: "asc" } } },
          });

          if (!room || (await expireIfStale(room.id))) {
            send("gone", { error: "Room not found or expired" });
            close();
            return;
          }

          const signature = `${room.rev}:${room.members.length}:${room.members
            .map((m) => m.memberId)
            .join(",")}`;

          if (signature !== lastSignature) {
            lastSignature = signature;
            send("snapshot", {
              room: { code: room.code, hostMemberId: room.hostMemberId },
              members: room.members.map((m) => ({
                memberId: m.memberId,
                name: m.name,
              })),
              state: serializeState(room.state),
            });
          }
        } catch (error) {
          console.error("Room events poll error:", error);
        }
      };

      // Initial snapshot immediately
      await readRoom();

      const pollTimer = setInterval(readRoom, POLL_INTERVAL_MS);
      const heartbeatTimer = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
