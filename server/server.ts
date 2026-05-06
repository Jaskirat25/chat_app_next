import express from "express";
import { Server } from "socket.io";
import http from "http";
import handleIoConnection from "./socket/index";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000","https://chat-app-next-25.vercel.app/"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

handleIoConnection(io);

server.listen(3001, () => {
  console.log("Server listening on port 3001");
});
