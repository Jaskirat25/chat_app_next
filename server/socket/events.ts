import { Server, Socket } from "socket.io";
import { Prisma } from "../../lib/prisma";

export function handleSocketEvents(io:Server,socket:Socket){
socket.on("join",(roomId:string)=>{
    socket.join(roomId);
    console.log("socket joined the room with id",roomId);
})

socket.on("send-message",(userId:string,message:string)=>{
    Prisma.message.create({data:{
      content:message,
      
    }})
    io.to(userId).emit("receive-message",{from:socket.id,message})
     
})
}