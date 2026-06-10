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
  // conversationId lookup: friendId → conversationId (populated by friend-added event or fetchConversationId)
  const conversationIdLookupRef = useRef<Record<string, string>>({});

  // Per-user loading/success/error state for the Add Friend button
  const [addFriendLoading, setAddFriendLoading] = useState<
    Record<string, boolean>
  >({});
  const [addFriendSuccess, setAddFriendSuccess] = useState<
    Record<string, boolean>
  >({});
  const [addFriendError, setAddFriendError] = useState<Record<string, string>>(
    {},
  );

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isUnfriending, setIsUnfriending] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [pendingUnfriendId, setPendingUnfriendId] = useState<string | null>(
    null,
  );
  const [isUploadingFile, setIsUploadingFile] = useState(false);
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

  const uploadImageToCloudinary = async (
    file: File,
  ): Promise<string | null> => {
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 30 seconds for file upload
      });

      if (response.status === 200 && response.data.url) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    } finally {
      setIsUploadingFile(false);
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
    setAddFriendLoading((prev) => ({ ...prev, [friendId]: true }));
    setAddFriendError((prev) => {
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
    try {
      const response = await api.post("/api/Users/addFriend", { friendId });
      if (response.status === 201 || response.status === 200) {
        // Friend list state is updated by the friend-added socket event.
        // Just set success feedback here.
        setAddFriendSuccess((prev) => ({ ...prev, [friendId]: true }));
        setTimeout(() => {
          setAddFriendSuccess((prev) => {
            const next = { ...prev };
            delete next[friendId];
            return next;
          });
        }, 2000);
        setSearchResults((prev) =>
          prev.map((user) =>
            user.id === friendId ? { ...user, isFriend: true } : user,
          ),
        );
      }
    } catch (error) {
      console.error("Add friend failed:", error);
      setAddFriendError((prev) => ({
        ...prev,
        [friendId]: "Failed to add friend. Please try again.",
      }));
    } finally {
      setAddFriendLoading((prev) => {
        const next = { ...prev };
        delete next[friendId];
        return next;
      });
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

  const requestUnfriend = (friendId: string) => {
    setPendingUnfriendId(friendId);
    setShowUnfriendConfirm(true);
  };

  const handleUnfriend = async (friendId: string) => {
    setShowUnfriendConfirm(false);
    setIsUnfriending(true);

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
          const deleted = await handleDeleteChat();
          if (!deleted) {
            setMessages([]);
            setConversationId("");
            setSelectedUser(null);
          }
        }
      }
    } catch (error) {
      console.error("Unfriend failed:", error);
    } finally {
      setIsUnfriending(false);
      setPendingUnfriendId(null);
    }
  };

  const handleDeleteChat = async () => {
    if (!conversationId || !selectedUser) return true;

    setIsDeletingChat(true);
    try {
      const response = await api.delete(`/api/conversation/${conversationId}`);
      if (response.status === 200) {
        setMessages([]);
        setConversationId("");
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[selectedUser.id];
          return next;
        });
        setSelectedUser(null);
        return true;
      }
      return false;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        setMessages([]);
        setConversationId("");
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[selectedUser.id];
          return next;
        });
        setSelectedUser(null);
        return true;
      }
      console.error("Delete chat failed:", error);
      return false;
    } finally {
      setIsDeletingChat(false);
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
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3001"
        : "https://chat-app-server-ah27.onrender.com");

    const newSocket = io(socketUrl, {
      auth: { token: userId },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = newSocket;

    // --- Connection lifecycle ---
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

    // --- Presence ---
    newSocket.on("presence-init", (online: string[]) => {
      console.log("Received presence-init:", online);
      setOnlineUsers(online);
    });

    newSocket.on("presence-update", (online: string[]) => {
      console.log("Received presence-update:", online);
      setOnlineUsers(online);
    });

    // --- Messages ---
    newSocket.on("receive-message", (msg: Message) => {
      const activeUser = selectedUserRef.current;
      const isActiveChat =
        activeUser?.id === msg.senderId &&
        (!conversationIdRef.current ||
          msg.conversationId === conversationIdRef.current);

      if (isActiveChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTypingFrom(null);
        setUnreadCounts((prev) => ({ ...prev, [msg.senderId]: 0 }));
        newSocket.emit("message-read", { receiverId: msg.senderId });

        // Persist READ status to DB for this message
        if (msg.id && msg.conversationId) {
          fetch("/api/conversation/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: msg.conversationId,
              receiverId: activeUser?.id,
              status: "READ",
            }),
          }).catch(() => {});
        }
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] ?? 0) + 1,
        }));
      }
    });

    newSocket.on("message-delivered", ({ messageId }: { messageId: string }) => {
      setMessageStatuses((prev) => ({ ...prev, [messageId]: "delivered" }));
      // Persist DELIVERED status to DB
      fetch("/api/conversation/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, status: "DELIVERED" }),
      }).catch(() => {});
    });

    newSocket.on("message-read", ({ from }: { from: string }) => {
      if (selectedUserRef.current?.id !== from) return;
      // Update UI for all sent messages in this conversation
      const sentMsgIds = messagesRef.current
        .filter((m) => m.senderId === userId)
        .map((m) => m.id);
      setMessageStatuses((prev) => {
        const next = { ...prev };
        sentMsgIds.forEach((id) => { next[id] = "read"; });
        return next;
      });
      // Persist READ status to DB for all sent messages in this conversation
      if (conversationIdRef.current) {
        fetch("/api/conversation/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversationIdRef.current,
            receiverId: from,
            status: "READ",
          }),
        }).catch(() => {});
      }
    });

    // --- Typing ---
    newSocket.on("typing", ({ from }: { from: string }) => {
      if (selectedUserRef.current?.id !== from) return;
      setTypingFrom(from);
      if (typingIndicatorTimeoutRef.current)
        clearTimeout(typingIndicatorTimeoutRef.current);
      typingIndicatorTimeoutRef.current = window.setTimeout(
        () => setTypingFrom(null),
        1800,
      );
    });

    newSocket.on("stop-typing", ({ from }: { from: string }) => {
      if (selectedUserRef.current?.id !== from) return;
      setTypingFrom(null);
      if (typingIndicatorTimeoutRef.current) {
        clearTimeout(typingIndicatorTimeoutRef.current);
        typingIndicatorTimeoutRef.current = null;
      }
    });

    // --- Friend added ---
    type FriendAddedPayload = {
      newFriend: {
        id: string;
        username: string;
        email: string;
        profilePic: string | null;
        lastSeen: string;
      };
      conversationId: string;
      forUserId: string;
    };

    newSocket.on("friend-added", (payload: FriendAddedPayload) => {
      const { newFriend, conversationId: newConversationId } = payload;
      setUserFriends((prev) => {
        if (prev.some((f) => f.id === newFriend.id)) return prev;
        return [...prev, { ...newFriend, lastSeen: String(newFriend.lastSeen) }];
      });
      conversationIdLookupRef.current[newFriend.id] = newConversationId;
      setSearchResults((prev) =>
        prev.map((u) => (u.id === newFriend.id ? { ...u, isFriend: true } : u)),
      );
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
                const statusRecord = msg.statuses[0] as any;
                const statusValue: string = statusRecord.status ?? "";
                if (statusValue === "READ") {
                  statusMap[msg.id] = "read";
                } else if (statusValue === "DELIVERED") {
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
    await handleSend(msg.content ?? "", msg.replyTo as any, null);
  };

  const handleSend = async (
    contentStr?: string,
    replyToMsg?: Message | null,
    file?: File | null,
    mediaUrl?: string | null,
  ) => {
    const textToSend = typeof contentStr === "string" ? contentStr : input;
    if ((textToSend.trim() === "" && !file && !mediaUrl) || !selectedUser) return;

    setInput("");
    setReplyTo(null);

    let photoUrl: string | null = mediaUrl || null;

    // Upload image if provided
    if (file && !mediaUrl) {
      photoUrl = await uploadImageToCloudinary(file);
      if (!photoUrl) {
        const tempId = Date.now().toString();
        setMessageStatuses((prev) => ({ ...prev, [tempId]: "error" }));
        return;
      }
    }

    // --- Race condition guard: resolve conversationId if not yet available ---
    let resolvedConversationId = conversationIdRef.current;

    if (!resolvedConversationId) {
      // Check the lookup ref first (populated by friend-added event)
      resolvedConversationId =
        conversationIdLookupRef.current[selectedUser.id] ?? "";
    }

    if (!resolvedConversationId) {
      try {
        const idRes = await api.get(
          `/api/fetchConversationId?token=${selectedUser.id}`,
        );
        resolvedConversationId = idRes.data.conversationId;
        setConversationId(resolvedConversationId);
        conversationIdRef.current = resolvedConversationId;
        conversationIdLookupRef.current[selectedUser.id] =
          resolvedConversationId;
      } catch (fetchError) {
        console.error("Could not resolve conversationId:", fetchError);
        const tempId = Date.now().toString();
        const failedMessage: Message = {
          id: tempId,
          content: textToSend || null,
          photoUrl: photoUrl || null,
          senderId: userId,
          receiverId: selectedUser.id,
          conversationId: "",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, failedMessage]);
        setMessageStatuses((prev) => ({ ...prev, [tempId]: "error" }));
        return;
      }
    }

    const tempId = Date.now().toString();
    const optimisticMessage: Message = {
      id: tempId,
      content: textToSend || null,
      photoUrl: photoUrl || null,
      senderId: userId,
      receiverId: selectedUser.id,
      conversationId: resolvedConversationId,
      createdAt: new Date().toISOString(),
      replyTo: replyToMsg
        ? {
            id: replyToMsg.id,
            senderName:
              replyToMsg.senderId === userId ? "You" : selectedUser.username,
            content: replyToMsg.content ?? "Attachment",
          }
        : undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageStatuses((prev) => ({ ...prev, [tempId]: "pending" }));
    stopTyping();

    try {
      const messageData = {
        content: textToSend || null,
        photoUrl: photoUrl || null,
        conversationId: resolvedConversationId,
        senderId: userId,
        receiverId: selectedUser.id,
        replyTo: replyToMsg,
      };

      let response = await api.post("/api/conversation/store", messageData);

      if (response.status === 404) {
        const idRes = await api.get(
          `/api/fetchConversationId?token=${selectedUser.id}`,
        );
        resolvedConversationId = idRes.data.conversationId;
        setConversationId(resolvedConversationId);
        conversationIdRef.current = resolvedConversationId;
        conversationIdLookupRef.current[selectedUser.id] =
          resolvedConversationId;

        response = await api.post("/api/conversation/store", {
          ...messageData,
          conversationId: resolvedConversationId,
        });
      }

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
      } else {
        console.error(
          "Unexpected response from store message:",
          response.status,
        );
        setMessageStatuses((prev) => ({ ...prev, [tempId]: "error" }));
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          const idRes = await api.get(
            `/api/fetchConversationId?token=${selectedUser.id}`,
          );
          resolvedConversationId = idRes.data.conversationId;
          setConversationId(resolvedConversationId);
          conversationIdRef.current = resolvedConversationId;
          conversationIdLookupRef.current[selectedUser.id] =
            resolvedConversationId;

          const retryResponse = await api.post("/api/conversation/store", {
            content: textToSend || null,
            photoUrl: photoUrl || null,
            conversationId: resolvedConversationId,
            senderId: userId,
            receiverId: selectedUser.id,
            replyTo: replyToMsg,
          });

          if (retryResponse.status === 201 || retryResponse.status === 200) {
            const savedMessage = retryResponse.data;
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
            return;
          }
        } catch (retryError) {
          console.error("Retry after conversation refresh failed:", retryError);
        }
      } else {
        console.error("Error in handleSend:", error);
      }

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
        addFriendLoading={addFriendLoading}
        addFriendSuccess={addFriendSuccess}
        addFriendError={addFriendError}
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
        onUnfriend={() => selectedUser && requestUnfriend(selectedUser.id)}
        onBack={() => setSelectedUser(null)}
        isLoading={isLoadingChats}
        isUnfriending={isUnfriending}
        isDeletingChat={isDeletingChat}
        onRetry={handleRetry}
        onReply={setReplyTo}
      />

      {showUnfriendConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 p-6 shadow-xl ring-1 ring-white/10">
            <h2 className="mb-3 text-xl font-semibold text-white">
              Confirm Unfriend
            </h2>
            <p className="mb-6 text-sm text-slate-300">
              Are you sure you want to unfriend {selectedUser.username}? This
              will also delete the current chat with them.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowUnfriendConfirm(false);
                  setPendingUnfriendId(null);
                }}
                className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => selectedUser && handleUnfriend(selectedUser.id)}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Unfriend and delete chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
