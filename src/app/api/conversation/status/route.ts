import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/conversation/status
 * Body: { messageId: string, status: "DELIVERED" | "READ" }
 * OR
 * Body: { conversationId: string, receiverId: string, status: "READ" }
 *   → marks all messages in the conversation sent to receiverId as READ
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { status } = body;

    if (!["DELIVERED", "READ"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    if (body.messageId) {
      // Update a single message's status
      await prisma.messageStatus.updateMany({
        where: { messageId: body.messageId },
        data: { status, updatedAt: new Date() },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.conversationId && body.receiverId) {
      // Mark all messages in conversation sent TO receiverId as READ
      const messages = await prisma.message.findMany({
        where: {
          conversationId: body.conversationId,
          receiverId: body.receiverId,
        },
        select: { id: true },
      });
      const messageIds = messages.map((m) => m.id);

      if (messageIds.length > 0) {
        await prisma.messageStatus.updateMany({
          where: {
            messageId: { in: messageIds },
            status: { not: "READ" },
          },
          data: { status: "READ", updatedAt: new Date() },
        });
      }
      return NextResponse.json({ ok: true, updated: messageIds.length });
    }

    return NextResponse.json(
      { message: "messageId or (conversationId + receiverId) required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("STATUS UPDATE ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
