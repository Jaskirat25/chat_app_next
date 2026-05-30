import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextResponse } from "next/server";
import redis from "../../../../lib/redis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const receiver_id = searchParams.get("token");

  if (!receiver_id) {
    return NextResponse.json({ error: "Receiver ID missing" }, { status: 400 });
  }

  const token = (await cookies()).get("auth-token")?.value;
  if (!token) return NextResponse.error();

  const decoded = jwt.verify(
    token,
    process.env.NEXT_PUBLIC_JWT_SECRET!,
  ) as JwtPayload;

  const userId = decoded.id;

  try {
    const cacheKey = `${userId}:${receiver_id}`;

    let cachedConversationId = await redis.get(cacheKey);

    if (cachedConversationId != null) {
      const cachedConversation = await prisma.conversation.findUnique({
        where: { id: cachedConversationId },
      });
      if (cachedConversation) {
        return NextResponse.json({ conversationId: cachedConversationId });
      }
      await redis.del(cacheKey);
      await redis.del(`${receiver_id}:${userId}`);
      cachedConversationId = null;
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userId } } },
          { members: { some: { userId: receiver_id } } },
        ],
      },
    });

    if (!conversation) {
      const createdConversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [{ userId }, { userId: receiver_id }],
          },
        },
      });

      await redis.set(`${userId}:${receiver_id}`, createdConversation.id);
      await redis.set(`${receiver_id}:${userId}`, createdConversation.id);

      return NextResponse.json({ conversationId: createdConversation.id });
    }

    await redis.set(`${userId}:${receiver_id}`, conversation.id);
    await redis.set(`${receiver_id}:${userId}`, conversation.id);

    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
