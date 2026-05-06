import { Server, Socket } from "socket.io";

const userSocketMap = new Map<string, Set<string>>();

function addUserSocket(userId: string, socketId: string) {
  const sockets = userSocketMap.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  userSocketMap.set(userId, sockets);
}

function removeUserSocket(userId: string, socketId: string) {
  const sockets = userSocketMap.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSocketMap.delete(userId);
  } else {
    userSocketMap.set(userId, sockets);
  }
}

function getOnlineUsers() {
  return Array.from(userSocketMap.keys());
}

export default function handleIoConnection(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth?.token;
    console.log("socket connected with id", socket.id, "userId", userId);
    if (!userId) {
      socket.disconnect();
      return;
    }

    addUserSocket(userId, socket.id);
    socket.join(String(userId));

    socket.emit("presence-init", getOnlineUsers());
    io.emit("presence-update", getOnlineUsers());

    socket.on("send-message", ({ message, receiverId }) => {
      io.to(String(receiverId)).emit("receive-message", {
        ...message,
        from: userId,
      });
      socket.emit("message-delivered", {
        messageId: message.id,
        receiverId,
      });
    });

    socket.on("typing", ({ receiverId }) => {
      io.to(String(receiverId)).emit("typing", {
        from: userId,
      });
    });

    socket.on("message-read", ({ receiverId }) => {
      io.to(String(receiverId)).emit("message-read", {
        from: userId,
      });
    });

    async function updateLastSeenForUser() {
      try {
        await fetch("http://localhost:3000/api/Users/updateLastSeen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch (error) {
        console.error("Failed to update lastSeen on disconnect:", error);
      }
    }

    socket.on("disconnect", () => {
      console.log("socket disconnected with id", socket.id, "userId", userId);
      removeUserSocket(userId, socket.id);
      updateLastSeenForUser();
      io.emit("presence-update", getOnlineUsers());
    });
  });
}
