"use client";

import React, { useState } from "react";
import { Smile, Reply, Pencil, Trash2, Check, CornerDownRight, FileText } from "lucide-react";
import { Message } from "@/types/chat";
import { formatChatTimestamp } from "@/lib/dateFormatter";
import Image from "next/image";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
  userId: string;
  senderName: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
}

const EMOJI_LIST = ["👍", "❤️", "😂", "🎉", "😢", "😮"];

export function MessageBubble({
  message,
  isOwn,
  status,
  userId,
  senderName,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const renderFileAttachment = () => {
    if (!message.fileUrl) return null;

    const isImage = message.fileType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(message.fileName || "");

    if (isImage) {
      return (
        <div className="relative mt-2 max-w-[280px] sm:max-w-[320px] rounded-lg overflow-hidden border border-app-dark/30 shadow-xs group/file bg-black/5">
          <img
            src={message.fileUrl}
            alt={message.fileName || "Uploaded image"}
            className="w-full h-auto object-cover max-h-[200px] hover:scale-102 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center">
            <a
              href={message.fileUrl}
              download={message.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white text-gray-900 px-3 py-1.5 rounded font-medium hover:bg-gray-100 shadow-sm transition-colors"
            >
              Open Full Size
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-black/10 border border-app-dark/20 max-w-[320px]">
        <div className="p-2 rounded bg-app-brand/20 text-app-brand">
          <FileText size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-app-text-bright">{message.fileName}</p>
          <p className="text-[10px] text-app-text-muted truncate">
            {message.fileType || "File attachment"}
          </p>
        </div>
        <a
          href={message.fileUrl}
          download={message.fileName}
          className="text-xs font-semibold text-app-brand hover:text-app-brand-hover hover:underline shrink-0"
        >
          Download
        </a>
      </div>
    );
  };

  return (
    <div className="group relative flex flex-col w-full mt-2 transition-all">
      {/* Reply Reference Line & Bubble */}
      {message.replyTo && (
        <div className="flex items-center gap-1.5 ml-4 mb-0.5 text-app-text-muted text-xs">
          <CornerDownRight size={12} className="shrink-0 opacity-70" />
          <span className="font-semibold text-[11px]">@{message.replyTo.senderName}</span>
          <span className="truncate max-w-[200px] opacity-80 text-[11px] italic">
            "{message.replyTo.content}"
          </span>
        </div>
      )}

      {/* Main Message Content Area */}
      <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative max-w-[75%] px-4 py-2.5 rounded-2xl shadow-xs break-words flex flex-col transition-all duration-200 ${
            isOwn
              ? "bg-app-brand text-white rounded-br-xs"
              : "bg-app-sidebar text-app-text-bright rounded-bl-xs border border-app-dark"
          }`}
        >
          {/* Action Toolbar on Hover */}
          <div
            className={`absolute top-[-16px] z-30 hidden group-hover:flex items-center gap-0.5 bg-app-bg border border-app-dark shadow-md rounded-lg p-1 transition-all ${
              isOwn ? "right-3" : "left-3"
            }`}
          >
            {/* Quick Emoji Picker */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 rounded-md hover:bg-app-hover text-app-text-muted hover:text-app-text-bright transition-colors"
                title="React"
              >
                <Smile size={14} />
              </button>
              {showEmojiPicker && (
                <div className="absolute top-[-38px] left-0 flex items-center gap-1 bg-app-bg border border-app-dark shadow-lg rounded-full px-2 py-1 z-40">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:scale-120 transition-transform text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onReply(message)}
              className="p-1 rounded-md hover:bg-app-hover text-app-text-muted hover:text-app-text-bright transition-colors"
              title="Reply"
            >
              <Reply size={14} />
            </button>

            {isOwn && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(message.content);
                  }}
                  className="p-1 rounded-md hover:bg-app-hover text-app-text-muted hover:text-app-text-bright transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1 rounded-md hover:bg-app-hover text-app-danger/20 hover:text-app-danger transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>

          {/* Edit State or Text Content */}
          {isEditing ? (
            <div className="flex flex-col gap-1.5 min-w-[200px] sm:min-w-[260px] py-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-black/15 text-white placeholder-white/50 outline-none rounded-md p-1.5 text-sm border border-white/20 resize-none min-h-[36px]"
                rows={1}
                autoFocus
              />
              <div className="flex justify-end gap-1.5 text-[10px]">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 rounded bg-black/10 hover:bg-black/20 text-white/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 rounded bg-white text-app-brand hover:bg-gray-100 font-semibold transition-colors flex items-center gap-0.5"
                >
                  <Check size={10} />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
          )}

          {/* File Attachment Rendering */}
          {renderFileAttachment()}

          {/* Timestamp & Receipts */}
          <div className="flex items-center justify-end gap-1.5 mt-1 self-end shrink-0">
            <span
              className={`text-[9px] ${
                isOwn ? "text-indigo-200" : "text-app-text-muted"
              }`}
            >
              {formatChatTimestamp(
                typeof message.createdAt === "string"
                  ? message.createdAt
                  : new Date().toISOString(),
              )}
            </span>
            {message.isEdited && (
              <span className={`text-[9px] italic ${isOwn ? "text-indigo-200/70" : "text-app-text-muted/70"}`}>
                (edited)
              </span>
            )}

            {isOwn && (
              <span
                className={`text-[10px] font-bold ${
                  status === "read" ? "text-green-300" : "text-indigo-200 opacity-80"
                }`}
              >
                {status === "sent" && "✓"}
                {status === "delivered" && "✓✓"}
                {status === "read" && "✓✓"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message Reactions Display */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
          {message.reactions.map((reaction) => {
            const hasReacted = reaction.users.includes(userId);
            return (
              <button
                key={reaction.emoji}
                onClick={() => onReact(message.id, reaction.emoji)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-all ${
                  hasReacted
                    ? "bg-app-brand/20 border-app-brand text-app-brand font-medium"
                    : "bg-app-sidebar border-app-dark text-app-text-muted hover:border-app-hover"
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-[10px]">{reaction.users.length}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
