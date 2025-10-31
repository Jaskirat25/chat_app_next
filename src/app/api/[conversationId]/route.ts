import { NextRequest } from "next/server";
import { Prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
    const conversation = await Prisma.conversation.findFirst({
        where: {
            id: params.conversationId,
        },
        include:{
            messages:{
                select:{
                    content:true,
                    photoUrl:true,
                    createdAt:true,
                    senderId:true,
                    receiverId:true
                },
                orderBy:{
                    createdAt:"asc"
                }

            }
        }
    });

    console.log(conversation)
    return Response.json(conversation);
}
