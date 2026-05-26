"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { io, Socket } from "socket.io-client";
import { User, SearchUser, Message } from "@/types/chat";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatArea } from "@/components/chat/ChatArea";

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
  const [replyTo, setReplyTo] = useState<Message | null>(null);

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
  const handleReact = (messageId: string, emoji: string) => {
    setMessages((prev) => prev.map((msg) => {
      if (msg.id === messageId) {
        const existingReactions = msg.reactions || [];
        const existingIndex = existingReactions.findIndex((r) => r.emoji === emoji);
        if (existingIndex >= 0) {
          const newReactions = [...existingReactions];
          newReactions.splice(existingIndex, 1);
          return { ...msg, reactions: newReactions };
        } else {
          return { ...msg, reactions: [...existingReactions, { emoji, users: [userId] }] };
        }
      }
      return msg;
    }));
  };

  const handleEdit = (messageId: string, newContent: string) => {
    setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, content: newContent } : msg));
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleSend = async (contentStr?: string, replyToMsg?: Message | null, file?: File | null) => {
    const textToSend = typeof contentStr === 'string' ? contentStr : input;
    if ((textToSend.trim() === "" && !file) || !selectedUser) return;

    setInput("");
    setReplyTo(null);

    try {
      const messageData = {
        content: textToSend,
        conversationId: conversationId,
        senderId: userId,
        receiverId: selectedUser.id,
        replyTo: replyToMsg?.id,
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
      setInput(textToSend);
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
    <div className="flex h-[100dvh] w-full bg-discord-bg overflow-hidden text-discord-text">
      <Sidebar
        searchText={searchText}
        setSearchText={setSearchText}
        isSearching={isSearching}
        searchError={searchError}
        searchResults={searchResults}
        userFriends={userFriends}
        selectedUser={selectedUser}
        onlineUsers={onlineUsers}
        unreadCounts={unreadCounts}
        onSearch={handleSearch}
        onClearSearch={() => {
          setSearchText("");
          setSearchResults([]);
        }}
        onSelectUser={handleSelectUser}
        onAddFriend={handleAddFriend}
        isHiddenOnMobile={!!selectedUser}
      />
      
      <ChatArea
        selectedUser={selectedUser}
        isOnline={selectedUser ? isUserOnline(selectedUser.id) : false}
        messages={messages}
        userId={userId}
        typingFrom={typingFrom}
        messageStatuses={messageStatuses}
        input={input}
        onInputChange={(val) => {
          setInput(val);
          if (selectedUser && socket) {
            socket.emit("typing", { receiverId: selectedUser.id });
          }
        }}
        onSend={handleSend}
        onDeleteChat={handleDeleteChat}
        onUnfriend={() => selectedUser && handleUnfriend(selectedUser.id)}
        onBack={() => setSelectedUser(null)}
        isHiddenOnMobile={!selectedUser}
        onReact={handleReact}
        onEdit={handleEdit}
        onDelete={handleDeleteMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onReply={setReplyTo}
      />
    </div>
  );
}
