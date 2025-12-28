"use client";

import { Ellipsis, Search, Send, User as UserIcon } from "lucide-react";
import { formatChatTimestamp } from "../../lib/dateFormatter";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

// --- INTERFACES ---
interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string | null;
  lastSeen: string;
  chats?: { content: string; createdAt: string }[]; 
}

interface Message {
  id: string;
  content: string;
  photoUrl?: string;
  createdAt: Date | string;
  updatedAt?: Date;
  isEdited?: boolean;
  conversationId: string;
  senderId: string;
  receiverId: string;
  statuses?: any[];
}

export default function Home() {  
  // --- STATE ---
  const [userFriends, setUserFriends] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [userOnline, setUserOnline] = useState(true); 
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- LOGIC: Initialize User ---
  useEffect(() => {
    const fetchFriends = async () => {
      const token = Cookies.get("auth-token");
      if (!token) return;

      try {
        const decoded = jwtDecode(token) as { id: string };
        setUserId(decoded.id);

        const response = await api.post("/api/Users/fetchUsers", { user_id: decoded.id });
        if (response.data) {
          setUserFriends(response.data.data || response.data); 
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      }
    };
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const newSocket = io("http://localhost:3001", { auth: { token: userId } });
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, [userId]);

  useEffect(() => {
  if (!socket) return;

  // Verify connection
  socket.on("connect", () => console.log("Socket connected on frontend"));

  const handleReceive = (msg: any) => {
    console.log("RECEIVE-MESSAGE EVENT TRIGGERED:", msg); // This should print now
    setMessages((prev) => [...prev, msg]);
  };

  socket.on("receive-message", handleReceive);

  return () => {
    socket.off("receive-message", handleReceive);
    socket.off("connect");
  };
}, [socket]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchChats = async () => {
      setMessages([]); 
      try {
        const idRes = await api.get(`/api/fetchConversationId?token=${selectedUser.id}`);
        setConversationId(idRes.data.conversationId);
        const chats = await api.get(`/api/conversation/${idRes.data.conversationId}`);
        if (chats.data?.messages) setMessages(chats.data.messages);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };
    fetchChats();
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- LOGIC: Send Message ---
  const handleSend = async () => {
  if (input.trim() === "" || !selectedUser) return;
  
  const currentInput = input;
  setInput(""); 

  try {
    const messageData = {
      content: currentInput,
      conversationId: conversationId,
      senderId: userId,
      receiverId: selectedUser.id,
    };

    const response = await api.post("/api/conversation/store", messageData);
    
    // DEBUG: Add this to see what the server returned
    console.log("Database Response:", response.data);

    if (response.status === 201 || response.status === 200) {
      const savedMessage = response.data;

      if (socket) {
        socket.emit("send-message", {
          receiverId: selectedUser.id,
          message: savedMessage, // Sending the full object from DB
        });
      }
      
      // Update local UI
      setMessages((prev) => [...prev, savedMessage]);
    }
  } catch (error) {
    console.error("Error in handleSend:", error);
    setInput(currentInput); 
  }
};

  return (
    <div className="h-screen w-screen p-4 overflow-hidden">
      {/* Main Container */}
      <div className="w-full h-full bg-gray-300 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-3 h-full gap-5 overflow-hidden">
          
          {/* --- LEFT SIDEBAR --- */}
          {/* FIX: added 'flex flex-col' so the list can scroll independently */}
          <div className="col-span-1 p-4 h-full flex flex-col overflow-hidden">
            
            {/* Search Bar */}
            <div className="rounded-md h-10 bg-gray-100 flex items-center px-3 gap-2 shrink-0">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            {/* Friend List Container */}
            {/* FIX: added 'flex-1 overflow-y-auto' to make JUST this part scroll */}
            <div className="my-5 rounded-lg bg-gray-100 py-3 px-3 shadow-xs shadow-pink-300 flex-1 overflow-y-auto">
              <p className="font-bold text-2xl my-4">Chats</p>

              {userFriends.map((chat, index) => (
                <div key={index}>
                  <div
                    onClick={() => setSelectedUser(chat)}
                    className={`flex flex-col gap-2 p-3 hover:bg-gray-200 hover:rounded-2xl cursor-pointer ${
                         selectedUser?.id === chat.id ? "bg-gray-200 rounded-2xl" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="mt-1">
                        {chat.profilePic ? (
                          <Image
                            src={chat.profilePic}
                            width={60}
                            height={60}
                            className="rounded-full"
                            alt={chat.username}
                          />
                        ) : (
                          <div className="rounded-full border-2 p-1 border-gray-400">
                            <UserIcon className="size-8 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <p className="font-bold">{chat.username}</p>
                        <p className="font-light truncate text-gray-600">
                          {chat.chats && chat.chats[0] ? chat.chats[0].content : "Tap to chat"}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="flex justify-end">
                        <p className="font-light text-gray-500 text-sm">
                           {/* Add timestamp logic here if available */}
                        </p>
                      </div>
                    </div>
                  </div>
                  <hr className="w-full border-t border-gray-600 opacity-20 my-1" />
                </div>
              ))}
            </div>
          </div>

          {/* --- RIGHT CHAT WINDOW --- */}
          <div className="flex flex-col col-span-2 h-full relative overflow-hidden bg-gray-300">
            {selectedUser ? (
              <>
                {/* Header */}
                <div className="flex items-center p-4 border-b border-gray-400/30 sticky top-0 z-30 bg-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="border rounded-2xl p-1 border-gray-500">
                        <UserIcon className="size-6 text-gray-700" />
                    </div>
                    <div className="flex flex-col">
                        <p className="font-semibold text-lg leading-tight">{selectedUser.username}</p>
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${userOnline ? "bg-green-600" : "bg-red-600"}`}></div>
                            <span className="text-xs text-gray-600">{userOnline ? "Online" : "Offline"}</span>
                        </div>
                    </div>
                  </div>
                  <Ellipsis className="ml-auto mr-2 cursor-pointer text-gray-600" />
                </div>

                {/* Messages Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id || Math.random()}
                      className={`flex ${
                        message.senderId === userId ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-xl max-w-xs break-words shadow-sm ${
                          message.senderId === userId
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <div>{message.content}</div>
                        <div className="flex justify-end gap-1">
                          <div className={`mt-1 text-[10px] text-right ${message.senderId === userId ? "opacity-80" : "text-gray-500"}`}>
                            {formatChatTimestamp(
                                typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString()
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Invisible div to force scroll to bottom */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-4 bg-gray-300">
                    <div className="flex items-center gap-3 p-3 bg-gray-300 shadow-2xl rounded-full mr-2.5 border border-gray-400/20">
                    <input
                        onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                        }}
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 border border-gray-300 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-lg"
                        onClick={handleSend}
                    >
                        <Send size={18} />
                    </button>
                    </div>
                </div>
              </>
            ) : (
              // Empty State (Matches theme)
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a chat to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}