"use client";
import Cookies from "js-cookie";
import { io } from "socket.io-client";

export const socket = io("http://localhost:3001", {
  auth:{
    token:Cookies.get("auth-token")
  },
  autoConnect: false,
});