import express from "express";
import { Server, Socket } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket: Socket) => {
  // console.log('A user connected:', socket.id);

  socket.onAny((event, ...args) => {
    console.log(`Received event "${event}" with args:`, args);
  });

  socket.on("send-message", (msg: string) => {
    console.log("Message received (send-message):", msg);
    socket.broadcast.emit("receive-message", msg);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
