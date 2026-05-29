"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Settings,
  Trash2,
  UserMinus,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { Message, User } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { MessageSkeleton } from "./MessageSkeleton";
import { TypingIndicator } from "./TypingIndicator";

interface ChatAreaProps {
  selectedUser: User | null;
  isOnline: boolean;
  messages: Message[];
  userId: string;
  typingFrom: string | null;
  messageStatuses: Record<
    string,
    "sent" | "delivered" | "read" | "pending" | "error"
  >;
  input: string;
  onInputChange: (val: string) => void;
  onSend: (
    content: string,
    replyTo?: Message | null,
    file?: File | null,
  ) => void;
  onDeleteChat: () => void;
  onUnfriend: () => void;
  onBack: () => void;
  isHiddenOnMobile?: boolean;
  isLoading?: boolean;
  onRetry?: (message: Message) => void;
  onReply: (message: Message) => void;
}

const getDayLabel = (dateValue: Date | string) => {
  const date = new Date(dateValue);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

export function ChatArea({
  selectedUser,
  isOnline,
  messages,
  userId,
  typingFrom,
  messageStatuses,
  input,
  onInputChange,
  onSend,
  onDeleteChat,
  onUnfriend,
  onBack,
  isHiddenOnMobile = false,
  isLoading = false,
  onRetry,
  onReply,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingFrom]);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const handleCancelFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendClick = () => {
    if (!input.trim() && !selectedFile) return;
    onSend(input, null, selectedFile);
    onInputChange("");
    handleCancelFile();
  };

  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : messages;

  if (!selectedUser) {
    return (
      <div
        className={`panel-enter glass-panel flex-1 flex-col items-center justify-center rounded-[28px] p-8 text-center text-white/54 ${
          isHiddenOnMobile ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/[0.08]">
          <Search size={38} className="text-white/45" />
        </div>
        <p className="text-lg font-semibold text-white">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      className={`panel-enter glass-panel relative flex-1 flex-col overflow-hidden rounded-[28px] ${
        isHiddenOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      {isDragging && (
        <div
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center border-4 border-dashed border-[#4CD964]/70 bg-black/55 backdrop-blur-xl transition-all"
        >
          <div className="mb-3 rounded-full bg-[#4CD964]/14 p-4 text-[#4CD964]">
            <Paperclip size={48} />
          </div>
          <p className="text-xl font-bold text-white">Drop files to upload</p>
          <p className="mt-1 text-sm text-white/52">
            Images or attachments are supported
          </p>
        </div>
      )}

      <div className="glass-soft z-20 m-3 flex shrink-0 items-center justify-between gap-3 rounded-[24px] px-4 py-3 sm:m-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-full p-2 text-white/58 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Back to chat list"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative shrink-0">
            {selectedUser.profilePic ? (
              <Image
                src={selectedUser.profilePic}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover ring-1 ring-white/20"
                alt={selectedUser.username}
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10">
                <span className="text-lg font-bold text-white/70">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#15171b] ${
                isOnline ? "bg-[#4CD964]" : "bg-white/30"
              }`}
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold leading-tight text-white">
              {selectedUser.username}
            </h2>
            <span className="block truncate text-xs text-white/48">
              {selectedUser.email || (isOnline ? "Online" : "Offline")}
            </span>
          </div>
        </div>

        {showSearch && (
          <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-3 py-2 sm:flex">
            <Search size={14} className="text-white/48" />
            <input
              type="text"
              placeholder="Search in chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/38"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-white/48 hover:text-white"
                aria-label="Clear message search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          <button className="hidden rounded-full p-2 text-white/58 transition-colors hover:bg-white/10 hover:text-white sm:block" title="Audio call">
            <Phone size={18} />
          </button>
          <button className="hidden rounded-full p-2 text-white/58 transition-colors hover:bg-white/10 hover:text-white sm:block" title="Video call">
            <Video size={18} />
          </button>
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery("");
            }}
            className={`rounded-full p-2 transition-colors ${
              showSearch
                ? "bg-[#4CD964]/18 text-[#4CD964]"
                : "text-white/58 hover:bg-white/10 hover:text-white"
            }`}
            title="Search messages"
          >
            <Search size={18} />
          </button>
          <button
            onClick={onUnfriend}
            className="rounded-full p-2 text-white/58 transition-colors hover:bg-red-500/10 hover:text-red-300"
            title="Unfriend"
          >
            <UserMinus size={18} />
          </button>
          <button
            onClick={onDeleteChat}
            className="rounded-full p-2 text-white/58 transition-colors hover:bg-red-500/10 hover:text-red-300"
            title="Delete chat"
          >
            <Trash2 size={18} />
          </button>
          <button className="rounded-full p-2 text-white/58 transition-colors hover:bg-white/10 hover:text-white" title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-3 pt-1 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <MessageSkeleton key={i} align={i % 2 === 0 ? "left" : "right"} />
            ))
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/[0.08]">
                <Mic size={30} className="text-white/45" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">
                {searchQuery
                  ? "No matching messages"
                  : `Say hi to ${selectedUser.username}`}
              </h3>
              <p className="max-w-xs px-4 text-sm text-white/50">
                {searchQuery
                  ? "Try searching for a different keyword."
                  : `This is the beginning of your direct message history with ${selectedUser.username}.`}
              </p>
            </div>
          ) : (
            filteredMessages.map((message, index) => {
              const currentLabel = getDayLabel(message.createdAt);
              const previous = filteredMessages[index - 1];
              const previousLabel = previous
                ? getDayLabel(previous.createdAt)
                : null;
              const showSeparator = currentLabel !== previousLabel;

              return (
                <React.Fragment key={message.id || `${index}-${message.createdAt}`}>
                  {showSeparator && (
                    <div className="my-4 flex items-center justify-center">
                      <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-medium text-white/45 backdrop-blur-xl">
                        {currentLabel}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === userId}
                    status={messageStatuses[message.id]}
                    userId={userId}
                    senderName={
                      message.senderId === userId ? "You" : selectedUser.username
                    }
                    onReact={() => {}}
                    onReply={onReply}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onRetry={onRetry}
                  />
                </React.Fragment>
              );
            })
          )}

          {typingFrom === selectedUser.id && (
            <TypingIndicator username={selectedUser.username} />
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div className="shrink-0 px-3 pb-3 sm:px-4 sm:pb-4">
        {selectedFile && (
          <div className="glass-soft mb-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs">
            <div className="flex min-w-0 items-center gap-3">
              {filePreview ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black/10">
                  <img
                    src={filePreview}
                    alt="upload preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4CD964]/14 text-[#4CD964]">
                  <Paperclip size={18} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-white/46">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelFile}
              className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-red-300"
              aria-label="Cancel file upload"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="glass-soft flex items-end gap-3 rounded-[24px] p-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mb-1 rounded-full p-2 text-white/52 transition-all hover:bg-white/10 hover:text-white"
            title="Attach file"
          >
            <Paperclip size={19} />
          </button>

          <div className="flex min-h-11 flex-1 items-end gap-2 rounded-full border border-white/10 bg-black/18 px-4 py-2">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendClick();
                }
              }}
              placeholder={`Message ${selectedUser.username}`}
              className="max-h-32 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-sm leading-5 text-white outline-none placeholder:text-white/38"
              rows={1}
              style={{ height: input ? "auto" : "32px" }}
            />
            <Mic size={18} className="mb-1 text-white/44" />
          </div>

          <button
            onClick={handleSendClick}
            disabled={!input.trim() && !selectedFile}
            className={`mb-0.5 flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all active:scale-95 ${
              input.trim() || selectedFile
                ? "bg-[#4CD964] text-black shadow-[0_0_26px_rgba(76,217,100,0.34)] hover:bg-[#39c856]"
                : "bg-white/[0.08] text-white/38"
            }`}
          >
            <span className="hidden sm:inline">Send</span>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
