import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
        { message: "Conversation not found" },
        { status: 404 },
      );
    }

    await prisma.message.deleteMany({
      where: { conversationId },
    });
    await prisma.conversationMember.deleteMany({
      where: { conversationId },
    });
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

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
