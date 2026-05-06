import { Server, Socket } from "socket.io";

export function handleSocketEvents(io: Server, socket: Socket) {
  socket.on(
    "send-message",
    ({message,receiverId}) => {
    
      io.to(receiverId).emit("receive-message", { from: socket.id, message });
    }
  );
}
