"use client";

import { Check, CheckCheck, Ellipsis, Search, Send, User } from "lucide-react";
import { formatChatTimestamp } from "../../lib/dateFormatter";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import { io } from "socket.io-client";
import redis from "../../lib/redis";
// const socket = io("http://localhost:3001");
interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string | null;
  lastSeen: string;
  password: string;
}
interface message {
  id: string;
  content: string;
  photoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  conversationId: string;
  senderId: string;
  receiverId: string;
  statuses: [
    {
      id: string;
      messageId: string;
      status: string;
      updatedAt: Date;
    },
  ];
}
export default function Home() {
  const [userFriends, setUserFriends] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<message[]>([]);
  const [userOnline, setUserOnline] = useState(true);
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  useEffect(() => {
    const handleReceive = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    };

    // socket.on("receive-message", handleReceive);

    return () => {
      // socket.off("receive-message", handleReceive);
    };
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      console.log("hi");
      const token = Cookies.get("auth-token");
      if (!token) return;
      const { id } = jwtDecode(token) as { id: string };
      setUserId(id);
      const response = await api.post("/api/Users/fetchUsers", { user_id: id });

      if (response) {
        setUserFriends(response.data.data);
      } else return;
    };

    fetchFriends();
  }, []);

  useEffect(() => {
    setMessages([]);
    const fetchChats = async () => {
      const id = (
        await api.get(`/api/fetchConversationId?token=${selectedUser?.id}`)
      ).data.chatData;
      
      const convo_Id=id.id;
      const chats = await api.get(`/api/conversation/${convo_Id}`);
      if (!chats) return;
      const messages = chats.data?.messages;

      if (!messages || messages.length === 0) {
        setMessages([]);
        return;
      }
      setConversationId(convo_Id);
      if (chats) {
        setMessages(chats.data.messages);
      }
    };
    fetchChats();
  }, [selectedUser]);

  const handleSend = () => {
    if (input == "") return;
    setInput("");
    try {
      //now just call for storing the message in with that conversation id
    } catch (error) {}
  };

  return (
    <div className="h-screen w-screen p-4 overflow-hidden">
      <div className="w-full h-full bg-gray-300 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-3 h-full gap-5 overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div className="col-span-1 p-4 overflow-hidden">
            <div className="rounded-md h-10 bg-gray-100 flex items-center px-3 gap-2">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            <div className="my-5 rounded-lg bg-gray-100 py-3 px-3 shadow-xs shadow-pink-300 overflow-y-auto h-[calc(100%-4rem)]">
              <p className="font-bold text-2xl my-4">Chats</p>

              {userFriends.map((chat, index) => {
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedUser(chat)}
                    className="flex flex-col gap-2 p-3 hover:bg-gray-200 hover:rounded-2xl cursor-pointer"
                  >
                    <div className="flex gap-4">
                      <div className="mt-1">
                        {chat.profilePic ? (
                          <Image
                            src={chat.profilePic}
                            width={60}
                            height={60}
                            alt={chat.profilePic}
                          />
                        ) : (
                          <div className="rounded-full border-2 p-1">
                            <User className="size-8" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 overflow-hidden">
                        <p className="font-bold">{chat.username}</p>
                        <p className="font-light truncate">
                          {"chat.chats[0]?.content"}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <p className="font-light text-gray-500 text-sm">
                          {/* {chat.chats[0]
                          ? formatChatTimestamp("chat.chats[0].createdAt")
                          : ""} */}
                        </p>
                      </div>
                    </div>

                    <hr className="w-full border-t border-gray-600 opacity-20" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT CHAT WINDOW */}
          <div className="flex flex-col col-span-2 h-full relative overflow-hidden bg-gray-300 ">
            {/* Header */}
            <div className="flex items-center p-4 border-b  sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <User className="border rounded-2xl size-7" />
                <p className="font-semibold">{selectedUser?.username}</p>

                <div
                  className={`w-3 h-3 rounded-full ${
                    userOnline ? "bg-green-600" : "bg-red-600"
                  }`}
                ></div>
              </div>

              <Ellipsis className="ml-auto mr-2 cursor-pointer" />
            </div>

            {/* Chat messages (only this scrolls!) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === userId
                      ? "justify-end"
                      : "justify-start"
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
                      <div className="mt-1 opacity-60 text-xs text-right">
                        {formatChatTimestamp(
                          new Date(message.createdAt).toISOString()
                        )}
                      </div>
                      <div className=" text-xs text-right">
                        {message.statuses[0].status == "SENT" ? (
                          <Check />
                        ) : message.statuses[0].status == "DELIVERED" ? (
                          <CheckCheck />
                        ) : (
                          <CheckCheck color="red" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-3 p-3 bg-gray-300 sticky bottom-0 z-70 shadow-2xl rounded-4xl mr-2.5">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                onChange={(e) => setInput(e.target.value)}
                value={input}
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 border border-gray-300 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition"
                onClick={() => {
                  handleSend();
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
