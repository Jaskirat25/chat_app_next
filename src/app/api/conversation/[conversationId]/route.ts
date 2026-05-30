import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
    },
    include: {
      messages: {
        include: {
          statuses: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return Response.json(conversation);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation already removed" },
        { status: 200 },
      );
    }

    const memberIds = conversation.members.map((member) => member.userId);

    await prisma.messageStatus.deleteMany({
      where: { message: { conversationId } },
    });
    await prisma.message.deleteMany({
      where: { conversationId },
    });
    await prisma.conversationMember.deleteMany({
      where: { conversationId },
    });
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    if (memberIds.length === 2) {
      const [userA, userB] = memberIds;
      await redis.del(`${userA}:${userB}`);
      await redis.del(`${userB}:${userA}`);
    }

    return NextResponse.json(
      { message: "Conversation deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE CONVERSATION ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
