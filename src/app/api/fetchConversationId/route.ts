import { Prisma } from "../../../../lib/prisma";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NextResponse } from "next/server";
import redis from "../../../../lib/redis";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const receiver_id = searchParams.get("token");
  const token = (await cookies()).get("auth-token")?.value;
  if (!token) return NextResponse.error();
  const decoded = jwt.verify(
    token,
    process.env.NEXT_PUBLIC_JWT_SECRET!
  ) as JwtPayload;
  const { id } = decoded;
  const con_Id=await redis.get(`${id}:${receiver_id}`);
  if(con_Id){
    return NextResponse.json({conversationId:con_Id});
  }
  let conversation = await Prisma.conversation.findFirst({
    where: {
      members: {
        every: {
          userId: { in: [id, receiver_id] },
        },
      },

      AND: [
        { members: { some: { userId: id } } },
        { members: { some: { userId: receiver_id } } },
      ],
    },
    // include: {
    //   messages:{
    //     include:{
    //       statuses:true
    //     },
    //     orderBy:{
    //       createdAt:"asc"}
    //   ,
    //     }
    // }
  });
  return NextResponse.json({ chatData: conversation });
}
