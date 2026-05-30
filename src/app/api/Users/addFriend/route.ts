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
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: friendId } } },
        ],
      },
    });

    let conversationId: string;
    if (!existingConversation) {
      const newConversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [{ userId }, { userId: friendId }],
          },
        },
      });
      conversationId = newConversation.id;
    } else {
      conversationId = existingConversation.id;
    }

    const [initiatorUser, recipientUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          profilePic: true,
          lastSeen: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: friendId },
        select: {
          id: true,
          username: true,
          email: true,
          profilePic: true,
          lastSeen: true,
        },
      }),
    ]);

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3001"
        : "https://chat-app-server-ah27.onrender.com");
    let socketEmitOk = false;
    try {
      const socketRes = await fetch(`${socketUrl}/internal/friend-added`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiatorId: userId,
          recipientId: friendId,
          conversationId,
          initiatorUser,
          recipientUser,
        }),
      });
      socketEmitOk = socketRes.ok;
      if (!socketEmitOk) {
        console.error(
          "Friend-added emit failed",
          socketUrl,
          socketRes.status,
          await socketRes.text(),
        );
      }
    } catch (emitError) {
      console.error("Friend-added emit exception", emitError, socketUrl);
      socketEmitOk = false;
    }

    if (!socketEmitOk) {
      // Roll back: delete the friendship and conversation just created
      await prisma.friendship.delete({ where: { id: friendship.id } });
      // Only delete the conversation if we just created it (not an existing one)
      if (!existingConversation) {
        await prisma.conversation.delete({ where: { id: conversationId } });
      }
      return NextResponse.json(
        { error: "Could not notify clients in real time. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Friend added successfully",
      friendship,
      conversationId,
      friendUser: recipientUser,
      isFriend: true,
    });
  } catch (error) {
    console.error("ADD FRIEND ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
