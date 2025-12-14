import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "../../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { content, conversationId, senderId, receiverId } = await req.json();

    if (!content || !conversationId || !senderId || !receiverId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔒 Ensure conversation exists
    const conversation = await Prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 }
      );
    }

    const message = await Prisma.message.create({
      data: {
        content,
        conversationId,
        senderId,
        receiverId,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("STORE MESSAGE ERROR:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
