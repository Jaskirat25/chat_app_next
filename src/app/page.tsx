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
    Record<string, "sent" | "delivered" | "read" | "pending" | "error">
  >({});
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const selectedUserRef = useRef<User | null>(null);
  const conversationIdRef = useRef("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingEmitTimeoutRef = useRef<number | null>(null);
  const typingIndicatorTimeoutRef = useRef<number | null>(null);
  const typingSentRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const token = Cookies.get("auth-token");
      if (!token) return;
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
    } finally {
      setIsLoadingFriends(false);
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

  const stopTyping = () => {
    if (!socketRef.current || !selectedUserRef.current) return;
    if (typingEmitTimeoutRef.current) {
      clearTimeout(typingEmitTimeoutRef.current);
      typingEmitTimeoutRef.current = null;
    }

    if (typingSentRef.current) {
      socketRef.current.emit("stop-typing", {
        receiverId: selectedUserRef.current.id,
      });
      typingSentRef.current = false;
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!socketRef.current || !selectedUserRef.current) return;

    const receiverId = selectedUserRef.current.id;
    if (!value.trim()) {
      stopTyping();
      return;
    }

    if (!typingSentRef.current) {
      socketRef.current.emit("typing", { receiverId });
      typingSentRef.current = true;
    }

    if (typingEmitTimeoutRef.current) {
      clearTimeout(typingEmitTimeoutRef.current);
    }

    typingEmitTimeoutRef.current = window.setTimeout(() => {
      stopTyping();
    }, 1400);
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
    stopTyping();
    selectedUserRef.current = user;
    setSelectedUser(user);
    setTypingFrom(null);
    setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
    setMessageStatuses({});
  };

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    if (!selectedUser) {
      setTypingFrom(null);
      stopTyping();
    }
  }, [selectedUser]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

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
    if (socketRef.current) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      "https://chat-app-server-ah27.onrender.com";

    const newSocket = io(socketUrl, {
      auth: { token: userId },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("Socket connected on frontend");
      setSocketConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected", reason);
      setSocketConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    });

    newSocket.io.on("reconnect", (attempt) => {
      console.log("Socket reconnected after", attempt, "attempt(s)");
      setSocketConnected(true);
      if (conversationIdRef.current) {
        newSocket.emit("join-conversation", {
          conversationId: conversationIdRef.current,
        });
      }
    });

    return () => {
      newSocket.off();
      newSocket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [userId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handlePresenceInit = (online: string[]) => {
      console.log("Received presence-init:", online);
      setOnlineUsers(online);
    };

    const handlePresenceUpdate = (online: string[]) => {
      console.log("Received presence-update:", online);
      setOnlineUsers(online);
    };

    const appendMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((message) => message.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleReceive = (msg: Message) => {
      const activeUser = selectedUserRef.current;
      const isActiveChat =
        activeUser?.id === msg.senderId &&
        (!conversationIdRef.current ||
          msg.conversationId === conversationIdRef.current);

      if (isActiveChat) {
        appendMessage(msg);
        setTypingFrom(null);
        setUnreadCounts((prev) => ({ ...prev, [msg.senderId]: 0 }));
        socket.emit("message-read", { receiverId: msg.senderId });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] ?? 0) + 1,
        }));
      }
    };

    const handleTyping = ({ from }: { from: string }) => {
      const activeUser = selectedUserRef.current;
      if (activeUser?.id !== from) return;
      setTypingFrom(from);
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
      typingIndicatorTimeoutRef.current = window.setTimeout(() => {
        setTypingFrom(null);
      }, 1800);
    };

    const handleStopTyping = ({ from }: { from: string }) => {
      const activeUser = selectedUserRef.current;
      if (activeUser?.id !== from) return;
      setTypingFrom(null);
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
    };

    const handleMessageDelivered = ({ messageId }: { messageId: string }) => {
      setMessageStatuses((prev) => ({
        ...prev,
        [messageId]: "delivered",
      }));
    };

    const handleMessageRead = ({ from }: { from: string }) => {
      const activeUser = selectedUserRef.current;
      if (activeUser?.id !== from) return;
      setMessageStatuses((prev) => {
        const next = { ...prev };
        messagesRef.current.forEach((message) => {
          if (message.senderId === userId) {
            next[message.id] = "read";
          }
        });
        return next;
      });
    };

    socket.on("presence-init", handlePresenceInit);
    socket.on("presence-update", handlePresenceUpdate);
    socket.on("receive-message", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);
    socket.on("message-delivered", handleMessageDelivered);
    socket.on("message-read", handleMessageRead);

    return () => {
      socket.off("presence-init", handlePresenceInit);
      socket.off("presence-update", handlePresenceUpdate);
      socket.off("receive-message", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
      socket.off("message-delivered", handleMessageDelivered);
      socket.off("message-read", handleMessageRead);
    };
  }, [userId]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchChats = async () => {
      setIsLoadingChats(true);
      setMessages([]);
      setMessageStatuses({});
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
        if (chats.data?.messages) {
          const loadedMessages = chats.data.messages;
          setMessages(loadedMessages);

          // Initialize messageStatuses from loaded messages
          const statusMap: Record<
            string,
            "sent" | "delivered" | "read" | "pending" | "error"
          > = {};
          loadedMessages.forEach((msg: Message) => {
            if (msg.senderId === userId) {
              if (msg.statuses && msg.statuses.length > 0) {
                const status = msg.statuses[0] as any;
                if (status.read) {
                  statusMap[msg.id] = "read";
                } else if (status.delivered) {
                  statusMap[msg.id] = "delivered";
                } else {
                  statusMap[msg.id] = "sent";
                }
              } else {
                statusMap[msg.id] = "sent";
              }
            }
          });
          setMessageStatuses(statusMap);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };
    fetchChats();
  }, [selectedUser, userId]);

  useEffect(() => {
    if (!socketRef.current || !conversationId) return;
    socketRef.current.emit("join-conversation", { conversationId });
  }, [conversationId]);

  useEffect(() => {
    if (!socketRef.current || !selectedUser) return;
    socketRef.current.emit("message-read", { receiverId: selectedUser.id });
  }, [selectedUser]);

  useEffect(() => {
    return () => {
      if (typingEmitTimeoutRef.current) {
        clearTimeout(typingEmitTimeoutRef.current);
      }
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- LOGIC: Send Message ---
  const handleReact = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReactions = msg.reactions || [];
          const existingIndex = existingReactions.findIndex(
            (r) => r.emoji === emoji,
          );
          if (existingIndex >= 0) {
            const newReactions = [...existingReactions];
            newReactions.splice(existingIndex, 1);
            return { ...msg, reactions: newReactions };
          } else {
            return {
              ...msg,
              reactions: [...existingReactions, { emoji, users: [userId] }],
            };
          }
        }
        return msg;
      }),
    );
  };

  const handleEdit = (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent } : msg,
      ),
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleRetry = async (msg: Message) => {
    handleDeleteMessage(msg.id);
    await handleSend(msg.content, msg.replyTo as any, null);
  };

  const handleSend = async (
    contentStr?: string,
    replyToMsg?: Message | null,
    file?: File | null,
  ) => {
    const textToSend = typeof contentStr === "string" ? contentStr : input;
    if ((textToSend.trim() === "" && !file) || !selectedUser) return;

    setInput("");
    setReplyTo(null);

    const tempId = Date.now().toString();
    const optimisticMessage: Message = {
      id: tempId,
      content: textToSend,
      senderId: userId,
      receiverId: selectedUser.id,
      conversationId: conversationId,
      createdAt: new Date().toISOString(),
      replyTo: replyToMsg
        ? {
            id: replyToMsg.id,
            senderName:
              replyToMsg.senderId === userId ? "You" : selectedUser.username,
            content: replyToMsg.content,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageStatuses((prev) => ({ ...prev, [tempId]: "pending" }));
    stopTyping();

    try {
      const messageData = {
        content: textToSend,
        conversationId: conversationId,
        senderId: userId,
        receiverId: selectedUser.id,
        replyTo: replyToMsg,
      };

      const response = await api.post("/api/conversation/store", messageData);

      if (response.status === 201 || response.status === 200) {
        const savedMessage = response.data;

        if (socketRef.current) {
          socketRef.current.emit("send-message", {
            receiverId: selectedUser.id,
            message: savedMessage,
          });
        }

        setMessages((prev) =>
          prev.some((m) => m.id === savedMessage.id)
            ? prev.filter((m) => m.id !== tempId)
            : prev.map((m) => (m.id === tempId ? savedMessage : m)),
        );
        setMessageStatuses((prev) => {
          const next = { ...prev };
          delete next[tempId];
          return { ...next, [savedMessage.id]: "sent" };
        });
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      setMessageStatuses((prev) => ({ ...prev, [tempId]: "error" }));
    }
  };

  const selectedUserOnline = selectedUser
    ? onlineUsers.includes(selectedUser.id)
    : false;

  return (
    <div className="flex h-[100dvh] w-full gap-4 overflow-hidden p-3 text-discord-text sm:p-4 lg:gap-5 lg:p-5">
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
        isLoading={isLoadingFriends}
      />
      <ChatArea
        selectedUser={selectedUser}
        messages={messages}
        messageStatuses={messageStatuses}
        onSend={handleSend}
        isOnline={selectedUserOnline}
        userId={userId}
        typingFrom={typingFrom}
        input={input}
        onInputChange={handleInputChange}
        onDeleteChat={handleDeleteChat}
        onUnfriend={() => selectedUser && handleUnfriend(selectedUser.id)}
        onBack={() => setSelectedUser(null)}
        isLoading={isLoadingChats}
        onRetry={handleRetry}
        onReply={setReplyTo}
      />
    </div>
  );
}
