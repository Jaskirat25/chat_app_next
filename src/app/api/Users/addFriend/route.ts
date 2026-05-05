import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function POST(request: Request) {
  const body = await request.json();
  const friendId = body.friendId as string;

  if (!friendId) {
    return NextResponse.json(
      { error: "Friend ID is required" },
      { status: 400 },
    );
  }

  const token = (await cookies()).get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = jwt.verify(
    token,
    process.env.NEXT_PUBLIC_JWT_SECRET!,
  ) as JwtPayload;
  const userId = decoded.id as string;

  if (userId === friendId) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  try {
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ message: "Already friends" });
    }

    const friendship = await prisma.friendship.create({
      data: {
        userA: { connect: { id: userId } },
        userB: { connect: { id: friendId } },
      },
    });

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        members: {
          every: { userId: { in: [userId, friendId] } },
        },
      },
      include: { members: true },
    });

    if (!existingConversation) {
      await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [{ userId }, { userId: friendId }],
          },
        },
      });
    }

    return NextResponse.json({
      message: "Friend added successfully",
      friendship,
    });
  } catch (error) {
    console.error("ADD FRIEND ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
