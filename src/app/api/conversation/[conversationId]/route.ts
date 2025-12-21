import { NextRequest } from "next/server";
import  prisma  from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ conversationId:string }> }) {
   const {conversationId}=await params;
    const conversation = await prisma.conversation.findFirst({
        where: {
            id:conversationId,
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

    
    return Response.json(conversation);
}
