"use client";

import { Ellipsis, Search, Send, User } from "lucide-react";
import Image from "next/image";
import { formatChatTimestamp } from "../../lib/dateFormatter";
import { useState } from "react";
import { dummyMessages } from "../../data/dummyMessages";
export default function Home() {
  const [selectedUser, setSelectedUser] = useState("");
  const [userOnline, setUserOnline] = useState(true);
  const chats = [
    {
      name: "anil",
      imageUrl: "",
      chats: [
        {
          content: "April fool's day",
          createdAt: "Fri Nov 28 2025 21:21:50 GMT+0530 (India Standard Time)",
          userId: "3",
        },
      ],
    },
    {
      name: "Dost",
      imageUrl: "",
      chats: [
        {
          content: "Sexy",
          createdAt: "Fri Nov 28 2025 21:21:50 GMT+0530 (India Standard Time)",
          userId: "2",
        },
      ],
    },
    {
      name: "Mary ma'am",
      imageUrl: "",
      chats: [
        {
          content: "You have to report it...",
          createdAt: "Fri Nov 28 2025 21:21:50 GMT+0530 (India Standard Time)",
          userId: "1",
        },
      ],
    },
  ];
  return (
    <div className="h-screen w-screen p-4">
      <div className="w-full h-full bg-gray-300   rounded-3xl">
        <div className="grid grid-cols-3 h-full gap-5">
          <div className="col-span-1  p-4">
            <div className="rounded-md h-10 bg-gray-100 flex items-center px-3 gap-2">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <div className="my-5 rounded-lg bg-gray-100 py-3 px-3 shadow-xs shadow-pink-300">
              <p className="font-bold text-2xl my-4">Chats</p>

              {chats.map((chat, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedUser(chat.name);
                  }}
                  className="flex flex-col gap-2 p-3 hover:bg-gray-200 hover:rounded-2xl "
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {chat.imageUrl ? (
                        <Image
                          src={chat.imageUrl}
                          width={60}
                          height={60}
                          alt={chat.imageUrl}
                        />
                      ) : (
                        <div className="rounded-full border-2">
                          <User className="size-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <p className="font-bold">{chat.name}</p>
                      <p className="font-light">{chat.chats[0]?.content}</p>
                    </div>
                    <div className="flex justify-end">
                      <p className="font-light text-gray-500">
                        {chat.chats[0]
                          ? formatChatTimestamp(chat.chats[0].createdAt)
                          : ""}
                      </p>
                    </div>
                  </div>
                  <hr className="w-full mask-l-from-12 mask-r-from-12 border-t border-gray-600" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col  col-span-2">
            <div className="flex  p-2">
              <div className="flex  py-2 px-3 gap-3.5">
                <User className="border rounded-2xl size-7 " />
                <p>{selectedUser}</p>
                <div
                  className={`w-2 border-2 h-2 mt-2.5 -ml-1 ${userOnline ? " bg-red-700 border-red-700" : " bg-green-700 border-green-700"} rounded-2xl`}
                ></div>
              </div>

              <Ellipsis
                onClick={() => {}}
                className="ml-auto mr-3 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-2 p-4">
              {dummyMessages.messages.map((message) => (
                <div
                  key={message.id}  
                  className={`flex ${
                    message.senderId === "user-1"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs ${
                      message.senderId === "user-1"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>


<div className="flex items-center w-7/8 gap-3 p-3">
  <input
    type="text"
    placeholder="Type a message..."
    className="flex-1 bg-gray-100 border border-gray-300 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
  />

  <button className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition">
    <Send size={18} />
  </button>
</div>

          </div>
        </div>
      </div>
    </div>
  );
}
