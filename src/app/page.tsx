"use client";

import { Search, Send, User as UserIcon } from "lucide-react";
import { formatChatTimestamp } from "../../lib/dateFormatter";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import CustomDrawer from "@/components/CustomDrawer";
// --- INTERFACES ---
interface User {
  id: string;
  username: string;
  email: string;
  profilePic?: string | null;
  lastSeen: string;
  chats?: { content: string; createdAt: string }[];
}

interface SearchUser extends User {
  isFriend: boolean;
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
  statuses?: Record<string, unknown>[];
}

export default function Home() {
  // --- STATE ---
  const [userFriends, setUserFriends] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  // const [lastReadByReceiver, setLastReadByReceiver] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState<
    Record<string, "sent" | "delivered" | "read">
  >({});

  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const fetchFriends = async () => {
    const token = Cookies.get("auth-token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token) as { id: string };
      setUserId(decoded.id);

      const response = await api.post("/api/Users/fetchUsers", {
        user_id: decoded.id,
      });

      if (response.data) {
        setUserFriends(response.data.data || response.data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await api.get(
        `/api/Users/search?q=${encodeURIComponent(query)}`,
      );
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("Could not search users. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    try {
      const response = await api.post("/api/Users/addFriend", { friendId });
      if (response.status === 201 || response.status === 200) {
        await fetchFriends();
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === friendId ? { ...user, isFriend: true } : user,
          ),
        );
      }
    } catch (error) {
      console.error("Add friend failed:", error);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
    setMessageStatuses({});
  };

  const handleUnfriend = async (friendId: string) => {
    try {
      const response = await api.post("/api/Users/unfriend", { friendId });
      if (response.status === 200 || response.status === 201) {
        await fetchFriends();
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === friendId ? { ...user, isFriend: false } : user,
          ),
        );
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[friendId];
          return next;
        });
        if (selectedUser?.id === friendId) {
          setSelectedUser(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Unfriend failed:", error);
    }
  };

  const handleDeleteChat = async () => {
    if (!conversationId || !selectedUser) return;

    try {
      const response = await api.delete(`/api/conversation/${conversationId}`);
      if (response.status === 200) {
        setMessages([]);
        setConversationId("");
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Delete chat failed:", error);
    }
  };

  const getUnreadCount = (userId: string) => unreadCounts[userId] || 0;

  // --- LOGIC: Initialize User ---
  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const newSocket = io("https://chat-app-server-ah27.onrender.com", {
      auth: { token: userId },
      autoConnect: true,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected on frontend");
      setSocketConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // socket.on("connect", () => {
    //   console.log("Socket connected on frontend");
    //   setSocketConnected(true);
    // });

    // socket.on("disconnect", () => {
    //   setSocketConnected(false);
    // });

    socket.on("presence-init", (online: string[]) => {
      console.log("Received presence-init:", online);
      setOnlineUsers(online);
    });

    socket.on("presence-update", (online: string[]) => {
      console.log("Received presence-update:", online);
      setOnlineUsers(online);
    });

    const handleReceive = (msg: Message) => {
      if (selectedUser?.id === msg.senderId) {
        setMessages((prev) => [...prev, msg]);
        setUnreadCounts((prev) => ({ ...prev, [msg.senderId]: 0 }));
        socket.emit("message-read", { receiverId: msg.senderId });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] ?? 0) + 1,
        }));
      }
    };

    socket.on("receive-message", handleReceive);

    socket.on("typing", ({ from }: { from: string }) => {
      if (selectedUser?.id !== from) return;
      setTypingFrom(from);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(() => {
        setTypingFrom(null);
      }, 1600);
    });

    socket.on("message-delivered", ({ messageId }) => {
      // setLastReadByReceiver(false);
      setMessageStatuses((prev) => ({
        ...prev,
        [messageId]: "delivered",
      }));
    });

    socket.on("message-read", ({ from }: { from: string }) => {
      if (selectedUser?.id !== from) return;
      // setLastReadByReceiver(true);
      setMessageStatuses((prev) => {
        const next = { ...prev };
        messagesRef.current.forEach((message) => {
          if (message.senderId === userId) {
            next[message.id] = "read";
          }
        });
        return next;
      });
    });

    return () => {
      socket.off("receive-message", handleReceive);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("presence-init");
      socket.off("presence-update");
      socket.off("typing");
      socket.off("message-delivered");
      socket.off("message-read");
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchChats = async () => {
      setMessages([]);
      setTypingFrom(null);
      // setLastReadByReceiver(false);

      try {
        const idRes = await api.get(
          `/api/fetchConversationId?token=${selectedUser.id}`,
        );
        setConversationId(idRes.data.conversationId);
        const chats = await api.get(
          `/api/conversation/${idRes.data.conversationId}`,
        );
        if (chats.data?.messages) setMessages(chats.data.messages);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };
    fetchChats();
  }, [selectedUser]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    socket.emit("message-read", { receiverId: selectedUser.id });
  }, [selectedUser, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- LOGIC: Send Message ---
  const handleSend = async () => {
    if (input.trim() === "" || !selectedUser) return;

    const currentInput = input;
    setInput("");
    // setLastReadByReceiver(false);

    try {
      const messageData = {
        content: currentInput,
        conversationId: conversationId,
        senderId: userId,
        receiverId: selectedUser.id,
      };

      const response = await api.post("/api/conversation/store", messageData);

      if (response.status === 201 || response.status === 200) {
        const savedMessage = response.data;

        if (socket) {
          socket.emit("send-message", {
            receiverId: selectedUser.id,
            message: savedMessage,
          });
        }

        setMessages((prev) => [...prev, savedMessage]);
        setMessageStatuses((prev) => ({
          ...prev,
          [savedMessage.id]: "sent",
        }));
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      setInput(currentInput);
    }
  };

  const selectedUserOnline = selectedUser
    ? onlineUsers.includes(selectedUser.id)
    : false;
  const isUserOnline = (id: string) => onlineUsers.includes(id);
  const formatLastSeen = (date?: string) => {
    if (!date) return "Offline";
    return new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-screen w-screen p-4 overflow-hidden">
      {/* Main Container */}
      <div className="w-full h-full bg-gray-300 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-3 h-full gap-5 overflow-hidden">
          {/* --- LEFT SIDEBAR --- */}
          <div className="col-span-1 p-4 h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 shrink-0">
              {/* User Profile Icon/Avatar */}
              <CustomDrawer />


              <div className="flex flex-col gap-1 flex-1">
                <div className="rounded-md h-10 bg-gray-100 flex items-center px-3 gap-2 shadow-sm">
                  <Search size={20} className="text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search users or friends..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Friend List Container */}
            {/* FIX: added 'flex-1 overflow-y-auto' to make JUST this part scroll */}
            <div className="my-5 rounded-lg bg-gray-100 py-3 px-3 shadow-xs shadow-pink-300 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="font-bold text-2xl my-4">
                  {searchText.trim() ? "Search Results" : "Chats"}
                </p>
                {searchText.trim() ? (
                  <button
                    onClick={() => {
                      setSearchText("");
                      setSearchResults([]);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {searchText.trim() ? (
                <>
                  {isSearching && (
                    <p className="text-sm text-gray-500">
                      Looking for users...
                    </p>
                  )}
                  {searchError && (
                    <p className="text-sm text-red-500">{searchError}</p>
                  )}
                  {!isSearching && searchResults.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Type a username or email and press Enter to search.
                    </p>
                  )}

                  {searchResults.map((user) => (
                    <div key={user.id}>
                      <div
                        className={`flex flex-col gap-2 p-3 rounded-2xl bg-white shadow-sm ${
                          selectedUser?.id === user.id
                            ? "border border-blue-300"
                            : ""
                        }`}
                      >
                        <div className="flex gap-4 items-center">
                          <div className="mt-1">
                            {user.profilePic ? (
                              <Image
                                src={user.profilePic}
                                width={60}
                                height={60}
                                className="rounded-full"
                                alt={user.username}
                              />
                            ) : (
                              <div className="rounded-full border-2 p-1 border-gray-400">
                                <UserIcon className="size-8 text-gray-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{user.username}</p>
                              <span
                                className={`w-2 h-2 rounded-full ${isUserOnline(user.id) ? "bg-green-600" : "bg-gray-400"}`}
                              />
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-[11px] text-gray-500">
                              {isUserOnline(user.id)
                                ? "Online"
                                : `Last seen ${formatLastSeen(user.lastSeen)}`}
                            </div>
                            {getUnreadCount(user.id) > 0 && (
                              <div className="rounded-full bg-blue-600 text-white px-2 py-1 text-[10px] font-semibold">
                                {getUnreadCount(user.id)}
                              </div>
                            )}
                            {user.isFriend ? (
                              <button
                                onClick={() => handleSelectUser(user)}
                                className="rounded-full bg-blue-600 px-3 py-1 text-white text-sm hover:bg-blue-700"
                              >
                                Chat
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddFriend(user.id)}
                                className="rounded-full bg-green-600 px-3 py-1 text-white text-sm hover:bg-green-700"
                              >
                                Add Friend
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <hr className="w-full border-t border-gray-600 opacity-20 my-1" />
                    </div>
                  ))}
                </>
              ) : (
                userFriends.map((chat) => (
                  <div key={chat.id}>
                    <div
                      onClick={() => handleSelectUser(chat)}
                      className={`flex flex-col gap-2 p-3 hover:bg-gray-200 hover:rounded-2xl cursor-pointer ${
                        selectedUser?.id === chat.id
                          ? "bg-gray-200 rounded-2xl"
                          : ""
                      }`}
                    >
                      <div className="flex gap-4 items-center">
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
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{chat.username}</p>
                            <span
                              className={`w-2 h-2 rounded-full ${isUserOnline(chat.id) ? "bg-green-600" : "bg-gray-400"}`}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-light truncate text-gray-600">
                                {chat.chats && chat.chats[0]
                                  ? chat.chats[0].content
                                  : "Tap to chat"}
                              </p>
                              {!isUserOnline(chat.id) && (
                                <p className="text-[10px] text-gray-500">
                                  Last seen {formatLastSeen(chat.lastSeen)}
                                </p>
                              )}
                            </div>
                            {getUnreadCount(chat.id) > 0 && (
                              <div className="rounded-full bg-blue-600 text-white px-2 py-1 text-[10px] font-semibold">
                                {getUnreadCount(chat.id)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <hr className="w-full border-t border-gray-600 opacity-20 my-1" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* --- RIGHT CHAT WINDOW --- */}
          <div className="flex flex-col col-span-2 h-full relative overflow-hidden bg-gray-300">
            {selectedUser ? (
              <>
                {/* Header */}
                <div className="flex flex-col sticky top-0 z-30 bg-gray-300 border-b border-gray-400/30">
                  <div className="flex items-center p-4">
                    <div className="flex items-center gap-3">
                      <div className="border rounded-2xl p-1 border-gray-500">
                        <UserIcon className="size-6 text-gray-700" />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-semibold text-lg leading-tight">
                          {selectedUser.username}
                        </p>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${selectedUserOnline ? "bg-green-600" : "bg-red-600"}`}
                          ></div>
                          <span className="text-xs text-gray-600">
                            {selectedUserOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={handleDeleteChat}
                        className="rounded-full bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
                      >
                        Delete Chat
                      </button>
                      <button
                        onClick={() => handleUnfriend(selectedUser.id)}
                        className="rounded-full bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-800"
                      >
                        Unfriend
                      </button>
                      {/* <Ellipsis className="cursor-pointer text-gray-600" /> */}
                    </div>
                  </div>
                </div>

                {/* Messages Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id || Math.random()}
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
                        <div className="flex items-center justify-end gap-2 mt-1 text-[10px]">
                          <div
                            className={`${message.senderId === userId ? "opacity-80" : "text-gray-500"}`}
                          >
                            {formatChatTimestamp(
                              typeof message.createdAt === "string"
                                ? message.createdAt
                                : new Date().toISOString(),
                            )}
                          </div>
                          {message.senderId === userId && (
                            <span
                              className={`mt-0.5 text-[11px] ${
                                messageStatuses[message.id] === "read"
                                  ? "text-blue-200"
                                  : "text-gray-800"
                              }`}
                            >
                              {messageStatuses[message.id] === "sent"
                                ? "✓"
                                : messageStatuses[message.id] === "delivered"
                                  ? "✓✓"
                                  : messageStatuses[message.id] === "read"
                                    ? "✓✓"
                                    : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Invisible div to force scroll to bottom */}
                  <div ref={messagesEndRef} />
                </div>

                {typingFrom === selectedUser?.id && (
                  <div className="px-4 py-2 bg-gray-100 border-t border-gray-300 text-sm text-gray-600">
                    {selectedUser.username} is typing...
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-4 bg-gray-300">
                  <div className="flex items-center gap-3 p-3 bg-gray-300 shadow-2xl rounded-full mr-2.5 border border-gray-400/20">
                    <input
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (selectedUser && socket) {
                          socket.emit("typing", {
                            receiverId: selectedUser.id,
                          });
                        }
                      }}
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
