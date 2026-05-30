"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCheck,
  Clock,
  CornerDownRight,
  FileText,
  Pencil,
  Reply,
  Smile,
  Trash2,
  XCircle,
} from "lucide-react";

import { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  status?: "pending" | "sent" | "delivered" | "read" | "error";
  userId: string;
  senderName: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onRetry?: (message: Message) => void;
}

const EMOJI_LIST = ["+1", "<3", ":)", "!!", ":(", ":o"];

export function MessageBubble({
  message,
  isOwn,
  status,
  userId,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const displayStatus = status ?? "sent";
  const timestamp = new Date(message.createdAt)
    .toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

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

    const isImage =
      message.fileType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(message.fileName || "");

    if (isImage) {
      return (
        <div className="group/file relative mt-3 max-w-[280px] overflow-hidden rounded-2xl border border-white/12 bg-black/10 shadow-lg sm:max-w-[320px]">
          <img
            src={message.fileUrl}
            alt={message.fileName || "Uploaded image"}
            className="max-h-[220px] h-auto w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/file:opacity-100">
            <a
              href={message.fileUrl}
              download={message.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-950 shadow-sm transition-colors hover:bg-gray-100"
            >
              Open full size
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 flex max-w-[320px] items-center gap-3 rounded-2xl border border-white/12 bg-black/12 p-3">
        <div className="rounded-xl bg-[#4CD964]/14 p-2 text-[#4CD964]">
          <FileText size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">
            {message.fileName}
          </p>
          <p className="truncate text-[10px] text-white/45">
            {message.fileType || "File attachment"}
          </p>
        </div>
        <a
          href={message.fileUrl}
          download={message.fileName}
          className="shrink-0 text-xs font-semibold text-[#4CD964] hover:underline"
        >
          Download
        </a>
      </div>
    );
  };

  const renderInlineMeta = () => (
    <span className="float-right ml-2 mt-[6px] inline-flex translate-y-[5px] items-center gap-1 whitespace-nowrap pl-1 text-[11px] leading-none text-white/38">
      {message.isEdited && <span className="opacity-60">(edited)</span>}
      <span>{timestamp}</span>
      {isOwn && (
        <span
          className={`inline-flex items-center ${
            displayStatus === "read"
              ? "text-[#4CD964]/80"
              : displayStatus === "pending"
                ? "text-amber-200/70"
                : displayStatus === "error"
                  ? "text-rose-200/80"
                  : "text-white/45"
          }`}
          title={
            displayStatus === "read"
              ? "Read"
              : displayStatus === "delivered"
                ? "Delivered"
                : displayStatus === "pending"
                  ? "Sending"
                  : displayStatus === "error"
                    ? "Failed"
                    : "Sent"
          }
        >
          {displayStatus === "sent" && <Check size={13} strokeWidth={2.2} />}
          {displayStatus === "delivered" && (
            <CheckCheck size={13} strokeWidth={2.2} />
          )}
          {displayStatus === "read" && (
            <CheckCheck size={13} strokeWidth={2.2} />
          )}
          {displayStatus === "pending" && <Clock size={12} strokeWidth={2.2} />}
          {displayStatus === "error" && (
            <button
              onClick={() => onRetry?.(message)}
              className="inline-flex items-center"
              title="Retry"
            >
              <XCircle size={12} strokeWidth={2.2} />
            </button>
          )}
        </span>
      )}
    </span>
  );

  return (
    <div className="message-enter group relative mt-1 flex w-full flex-col">
      {message.replyTo && (
        <div
          className={`mb-1 flex items-center gap-1.5 text-xs text-white/42 ${
            isOwn ? "justify-end pr-3" : "justify-start pl-3"
          }`}
        >
          <CornerDownRight size={12} className="shrink-0 opacity-70" />
          <span className="text-[11px] font-semibold">
            @{message.replyTo.senderName}
          </span>
          <span className="max-w-[220px] truncate text-[11px] italic opacity-80">
            "{message.replyTo.content}"
          </span>
        </div>
      )}

      <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative flex max-w-[65%] flex-col break-words rounded-2xl px-3.5 py-3 text-sm leading-relaxed text-white shadow-[0_14px_38px_rgba(0,0,0,0.22)] transition-all duration-200 max-sm:max-w-[82%] ${
            isOwn
              ? "border border-[#4CD964]/18 bg-white/[0.15]"
              : "border border-white/12 bg-black/24"
          }`}
        >
          <div
            className={`absolute top-[-18px] z-30 hidden items-center gap-0.5 rounded-full border border-white/12 bg-[#15171b]/80 p-1 shadow-xl backdrop-blur-xl group-hover:flex ${
              isOwn ? "right-3" : "left-3"
            }`}
          >
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="rounded-full p-1 text-white/48 transition-colors hover:bg-white/10 hover:text-white"
                title="React"
              >
                <Smile size={14} />
              </button>
              {showEmojiPicker && (
                <div className="absolute -top-10 left-0 z-40 flex items-center gap-1 rounded-full border border-white/12 bg-[#15171b]/90 px-2 py-1 shadow-lg backdrop-blur-xl">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(message.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="rounded-full px-1 text-xs text-white/80 transition-transform hover:scale-110 hover:text-white"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onReply(message)}
              className="rounded-full p-1 text-white/48 transition-colors hover:bg-white/10 hover:text-white"
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
                  className="rounded-full p-1 text-white/48 transition-colors hover:bg-white/10 hover:text-white"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="rounded-full p-1 text-white/48 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>

          {isEditing ? (
            <div className="flex min-w-[200px] flex-col gap-2 py-1 sm:min-w-[260px]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-10 w-full resize-none rounded-xl border border-white/15 bg-black/20 p-2 text-sm text-white outline-none placeholder:text-white/40"
                rows={1}
                autoFocus
              />
              <div className="flex justify-end gap-1.5 text-[10px]">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-white/78 transition-colors hover:bg-white/16"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 rounded-full bg-[#4CD964] px-2.5 py-1 font-semibold text-black transition-colors hover:bg-[#39c856]"
                >
                  <Check size={10} />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div>
              {message.photoUrl && (
                <div className="group/photo relative mb-2 max-w-[280px] overflow-hidden rounded-2xl border border-white/12 bg-black/10 shadow-lg sm:max-w-[320px]">
                  <img
                    src={message.photoUrl}
                    alt="Shared image"
                    className="max-h-[280px] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/photo:opacity-100">
                    <a
                      href={message.photoUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-950 shadow-sm transition-colors hover:bg-gray-100"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
              {message.content && (
                <div className="whitespace-pre-wrap">
                  {message.content}
                  {renderInlineMeta()}
                </div>
              )}
              {!message.content && message.photoUrl && renderInlineMeta()}
            </div>
          )}

          {renderFileAttachment()}
        </div>
      </div>

      {message.reactions && message.reactions.length > 0 && (
        <div
          className={`mt-1 flex flex-wrap gap-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          {message.reactions.map((reaction) => {
            const hasReacted = reaction.users.includes(userId);
            return (
              <button
                key={reaction.emoji}
                onClick={() => onReact(message.id, reaction.emoji)}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-all ${
                  hasReacted
                    ? "border-[#4CD964]/60 bg-[#4CD964]/14 text-[#4CD964]"
                    : "border-white/12 bg-white/[0.07] text-white/55 hover:border-white/20"
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
