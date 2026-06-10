import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json({ users: [] });
  }

  const token = (await cookies()).get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  const userId = decoded.id as string;

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    const friendIds = new Set(
      friendships
        .flatMap((friendship) => [friendship.user1Id, friendship.user2Id])
        .filter((id) => id !== userId),
    );

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePic: true,
        lastSeen: true,
      },
      take: 30,
    });

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        isFriend: friendIds.has(user.id),
      })),
    });
  } catch (error) {
    console.error("SEARCH USERS ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
