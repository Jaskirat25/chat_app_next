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
    return NextResponse.json(
      { error: "Cannot unfriend yourself" },
      { status: 400 },
    );
  }

  try {
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId },
        ],
      },
    });

    return NextResponse.json(
      { message: "Friend removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("UNFRIEND ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
