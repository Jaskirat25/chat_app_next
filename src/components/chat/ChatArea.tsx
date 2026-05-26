"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft, Trash2, UserMinus, Search, X, Paperclip, Reply } from "lucide-react";
import Image from "next/image";
import { User, Message } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface ChatAreaProps {
  selectedUser: User | null;
  isOnline: boolean;
  messages: Message[];
  userId: string;
  typingFrom: string | null;
  messageStatuses: Record<string, "sent" | "delivered" | "read">;
  input: string;
  onInputChange: (val: string) => void;
  onSend: (content: string, replyTo?: Message | null, file?: File | null) => void;
  onDeleteChat: () => void;
  onUnfriend: () => void;
  onBack: () => void;
  isHiddenOnMobile?: boolean;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  onReply: (message: Message) => void;
}

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
  onReact,
  onEdit,
  onDelete,
  replyTo,
  onCancelReply,
  onReply,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search local state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Drag and drop / file local state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingFrom]);

  // Clean up object URLs on unmount or file change
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
      const url = URL.createObjectURL(file);
      setFilePreview(url);
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
    onSend(input, replyTo, selectedFile);
    onInputChange("");
    handleCancelFile();
    onCancelReply();
  };

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (!selectedUser) {
    return (
      <div
        className={`flex-1 flex-col items-center justify-center bg-discord-bg text-discord-text-muted ${
          isHiddenOnMobile ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="w-24 h-24 mb-6 opacity-20 bg-discord-text-muted rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-discord-bg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10C22 6.48 17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
        <p className="text-lg font-medium">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      className={`flex-1 flex-col bg-discord-bg relative ${
        isHiddenOnMobile ? "hidden md:flex" : "flex"
      }`}
    >
      {/* File Drag and Drop Overlay */}
      {isDragging && (
        <div
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="absolute inset-0 bg-discord-bg/90 border-4 border-dashed border-discord-brand z-50 flex flex-col items-center justify-center pointer-events-auto transition-all"
        >
          <div className="p-4 bg-discord-brand/10 rounded-full text-discord-brand animate-pulse mb-3">
            <Paperclip size={48} />
          </div>
          <p className="text-xl font-bold text-discord-text-bright">Drop files to upload</p>
          <p className="text-sm text-discord-text-muted mt-1">Images or attachments are supported</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-discord-bg border-b border-discord-dark z-20 shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 mr-1 text-discord-text-muted hover:text-discord-text-bright rounded-md hover:bg-discord-hover transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="relative shrink-0">
            {selectedUser.profilePic ? (
              <Image
                src={selectedUser.profilePic}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
                alt={selectedUser.username}
              />
            ) : (
              <div className="rounded-full bg-discord-sidebar w-10 h-10 flex items-center justify-center border border-discord-dark">
                <span className="text-discord-text-muted font-bold text-lg">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-bg ${
                isOnline ? "bg-discord-success" : "bg-gray-500"
              }`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <h2 className="font-semibold text-discord-text-bright leading-tight truncate">
              {selectedUser.username}
            </h2>
            <span className="text-xs text-discord-text-muted">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Message Search Input inside Header */}
        {showSearch && (
          <div className="flex-1 max-w-xs mx-4 bg-discord-dark border border-discord-dark rounded-md px-2.5 py-1 flex items-center gap-2">
            <Search size={14} className="text-discord-text-muted" />
            <input
              type="text"
              placeholder="Search in chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-discord-text outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-discord-text-muted hover:text-discord-text-bright"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setShowSearch(!showSearch);
              if (showSearch) setSearchQuery("");
            }}
            className={`p-2 rounded-md transition-colors ${
              showSearch ? "bg-discord-active text-discord-text-bright" : "text-discord-text-muted hover:text-discord-text-bright hover:bg-discord-hover"
            }`}
            title="Search Messages"
          >
            <Search size={18} />
          </button>
          <button
            onClick={onUnfriend}
            className="p-2 text-discord-text-muted hover:text-discord-danger hover:bg-discord-hover rounded-md transition-colors group"
            title="Unfriend"
          >
            <UserMinus size={18} className="group-hover:scale-105 transition-transform" />
          </button>
          <button
            onClick={onDeleteChat}
            className="p-2 text-discord-text-muted hover:text-discord-danger hover:bg-discord-hover rounded-md transition-colors group"
            title="Delete Chat"
          >
            <Trash2 size={18} className="group-hover:scale-105 transition-transform" />
          </button>
        </div>
      </div>

      {/* Messages Wrapper */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-1">
        {filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center mt-10 text-center">
            <div className="w-20 h-20 bg-discord-sidebar rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="text-xl font-bold text-discord-text-bright mb-2">
              {searchQuery ? "No matching messages" : `Say hi to ${selectedUser.username}!`}
            </h3>
            <p className="text-discord-text-muted text-sm max-w-xs px-4">
              {searchQuery
                ? "Try searching for a different keyword."
                : `This is the beginning of your direct message history with ${selectedUser.username}.`}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <MessageBubble
              key={message.id || Math.random()}
              message={message}
              isOwn={message.senderId === userId}
              status={messageStatuses[message.id]}
              userId={userId}
              senderName={message.senderId === userId ? "You" : selectedUser.username}
              onReact={onReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}

        {typingFrom === selectedUser.id && (
          <TypingIndicator username={selectedUser.username} />
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 bg-discord-bg shrink-0 border-t border-discord-dark/20">
        {/* Reply Bar */}
        {replyTo && (
          <div className="bg-discord-sidebar border-l-4 border-discord-brand px-4 py-2 mb-2 rounded-r-md flex items-center justify-between text-xs animate-slideDown">
            <div className="flex items-center gap-1.5 text-discord-text-muted truncate">
              <Reply size={12} className="shrink-0" />
              <span>Replying to <span className="font-semibold text-discord-text-bright">@{replyTo.senderId === userId ? "You" : selectedUser.username}</span>:</span>
              <span className="italic truncate max-w-[400px]">"{replyTo.content}"</span>
            </div>
            <button
              onClick={onCancelReply}
              className="text-discord-text-muted hover:text-discord-text-bright p-0.5 rounded-full hover:bg-discord-hover transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* File Preview Bar */}
        {selectedFile && (
          <div className="bg-discord-sidebar px-4 py-3 mb-2 rounded-md flex items-center justify-between gap-3 text-xs border border-discord-dark/30 animate-slideDown">
            <div className="flex items-center gap-3 min-w-0">
              {filePreview ? (
                <div className="relative w-10 h-10 rounded overflow-hidden bg-black/10 shrink-0">
                  <img src={filePreview} alt="upload preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded bg-discord-brand/10 text-discord-brand flex items-center justify-center shrink-0">
                  <Paperclip size={18} />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-discord-text-bright truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-discord-text-muted">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelFile}
              className="text-discord-text-muted hover:text-discord-danger p-1 rounded-full hover:bg-discord-hover transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Input Controls */}
        <div className="bg-discord-input rounded-xl px-4 py-2.5 flex items-end gap-3 max-w-full relative shadow-xs">
          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-md text-discord-text-muted hover:text-discord-text-bright hover:bg-discord-hover mb-1 transition-all"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendClick();
              }
            }}
            placeholder={`Message @${selectedUser.username}`}
            className="flex-1 bg-transparent text-discord-text-bright placeholder-discord-text-muted outline-none resize-none max-h-32 min-h-[24px] py-1.5 custom-scrollbar text-sm"
            rows={1}
            style={{
              height: input ? "auto" : "36px",
            }}
          />

          <button
            onClick={handleSendClick}
            disabled={!input.trim() && !selectedFile}
            className={`p-2 rounded-full mb-0.5 transition-all ${
              input.trim() || selectedFile
                ? "bg-discord-brand text-white hover:bg-discord-brand-hover hover:scale-102 shadow-xs"
                : "bg-discord-dark text-discord-text-muted cursor-not-allowed"
            }`}
          >
            <Send size={16} className={input.trim() || selectedFile ? "ml-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
