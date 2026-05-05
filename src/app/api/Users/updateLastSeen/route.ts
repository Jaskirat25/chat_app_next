import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId as string;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() },
    });

    return NextResponse.json({ message: "Last seen updated" }, { status: 200 });
  } catch (error) {
    console.error("UPDATE LAST SEEN ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
