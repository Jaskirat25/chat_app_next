"use client";

import { Search, User } from "lucide-react";
import Image from "next/image";

export default function Home() {
  function formatChatTimestamp(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "numeric", hour12: true };
    const formattedTime = date.toLocaleTimeString([], options);

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today, ${formattedTime}`;
    } else if (isYesterday) {
      return `Yesterday, ${formattedTime}`;
    } else {
      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
      return `${weekday}, ${formattedTime}`;
    }
  }

  const chats = [
    {
      name: "anil",
      imageUrl: "",
      chats: [
        {
          content: "April fool's day",
          createdAt: "Fri Nov 28 2025 21:21:50 GMT+0530 (India Standard Time)",
          userId: "1",
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
      <div className="w-full h-full bg-gray-300 border-b-black  rounded-3xl">
        <div className="grid grid-cols-3 h-full gap-5">
          <div className="col-span-1 border-2 p-4">
            <div className="rounded-md h-10 bg-gray-100 flex items-center px-3 gap-2">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <div className="my-5 rounded-lg bg-gray-100 py-3 px-5 shadow-xs shadow-pink-300">
              <p className="font-bold text-2xl my-4">Chats</p>

              {chats.map((chat, index) => (
                <div key={index} className="flex flex-col gap-2 py-2">
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
          <div className="col-span-2 border-2"></div>
        </div>
      </div>
    </div>
  );
}
