import { Prisma } from "../../../../lib/prisma";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextResponse } from "next/server";
import redis from "../../../../lib/redis";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const receiver_id = searchParams.get("token");
  if (!receiver_id) {
    return NextResponse.json(
      { error: "Receiver ID missing" },
      { status: 400 }
    );
  }
  
  const token = ( await cookies()).get("auth-token")?.value;
  if (!token) return NextResponse.error();
  
  const decoded = jwt.verify(
    token,
    process.env.NEXT_PUBLIC_JWT_SECRET!
  ) as JwtPayload;
  
  const userId = decoded.id;
  
  try {
    const cacheKey = `${userId}:${receiver_id}`;
  
   
    const cachedConversationId = await redis.get(cacheKey);

    if (cachedConversationId!=null) {
      return NextResponse.json({ conversationId: cachedConversationId });
    }
    const conversation = await Prisma.conversation.findFirst({
      where: {
        isGroup:false,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: receiver_id } } },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json({ conversationId: null });
    }
    await redis.set(`${userId}:${receiver_id}`, conversation.id);
    await redis.set(`${receiver_id}:${userId}`, conversation.id);
     
    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

