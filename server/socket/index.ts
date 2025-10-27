import { Server, Socket } from "socket.io";
import { handleSocketEvents } from "./events";

export default function handleIoConnection(io:Server){
io.on("connection",(socket:Socket)=>{
  console.log("socket connected with id",socket.id);
    handleSocketEvents(io,socket);

    socket.on("disconnect",()=>{
      console.log("socket disconnected with id",socket.id);
    })
  })
}