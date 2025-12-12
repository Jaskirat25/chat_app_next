import { NextRequest } from "next/server";
import { Prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { conversationId: string } }) {
   const id= params.conversationId;
    const conversation = await Prisma.conversation.findFirst({
        where: {
            id:id,
        },
        include:{
            messages:{
                include:{
                    statuses:true
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
