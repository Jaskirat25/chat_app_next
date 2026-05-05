import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json({ available: "Not Available" });
  const user = await prisma.user.findFirst({
    where: {
      username: username,
    },
  });

  return NextResponse.json({ isAvailable: user ? false : true });
}
