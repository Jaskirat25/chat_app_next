"use client";

import Cookies from "js-cookie";
import { io } from "socket.io-client";

export const socket = io(
  "https://chat-app-server-ah27.onrender.com",
  {
    auth: {
      token: Cookies.get("auth-token"),
    },
    autoConnect: false,
  }
);